import hashlib
import math
import os
import re
import time
import unicodedata
from collections import Counter
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


MAX_TEXT_LENGTH = 200_000
MAX_CHUNK_WORDS = 100
CHUNK_OVERLAP_WORDS = 20
VECTOR_SIZE = 64

app = FastAPI(title="AksharaTantra RAG API", docs_url=None, redoc_url=None)

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "RAG_ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.middleware("http")
async def route_from_query(request, call_next):
    # Vercel serves api/main.py only at the exact path /api/main,
    # so the real route arrives as a query: /api/main?route=/rag/ingest
    target = request.query_params.get("route", "")
    if request.url.path.rstrip("/") == "/api/main" and target.startswith("/"):
        request.scope["path"] = target
    return await call_next(request)


class IngestRequest(BaseModel):
    text: str = Field(min_length=1, max_length=MAX_TEXT_LENGTH)


class SearchRequest(BaseModel):
    doc_id: str = Field(min_length=1, max_length=64)
    text: str = Field(min_length=1, max_length=MAX_TEXT_LENGTH)
    question: str = Field(min_length=1, max_length=2_000)
    top_k: int = Field(default=3, ge=1, le=5)


def _document_id(text: str) -> str:
    return hashlib.sha256(text.strip().encode("utf-8")).hexdigest()[:16]


def _tokens(text: str) -> list[str]:
    tokens: list[str] = []
    current: list[str] = []
    for character in text.casefold():
        category = unicodedata.category(character)
        if category[0] in {"L", "M", "N"}:
            current.append(character)
        elif current:
            tokens.append("".join(current))
            current = []
    if current:
        tokens.append("".join(current))
    return [token for token in tokens if len(token) > 1]


def _split_sentences(text: str) -> list[str]:
    normalized = re.sub(r"\s+", " ", text).strip()
    if not normalized:
        return []
    return [
        sentence.strip()
        for sentence in re.split(r"(?<=[.!?।॥])\s+", normalized)
        if sentence.strip()
    ]


def _chunk_document(text: str) -> tuple[list[str], list[str]]:
    sentences = _split_sentences(text)
    words = [word for sentence in sentences for word in sentence.split()]
    chunks: list[str] = []
    stride = MAX_CHUNK_WORDS - CHUNK_OVERLAP_WORDS
    for start in range(0, len(words), stride):
        chunk = " ".join(words[start : start + MAX_CHUNK_WORDS]).strip()
        if chunk:
            chunks.append(chunk)
        if start + MAX_CHUNK_WORDS >= len(words):
            break
    return sentences, chunks


def _document_idf(chunks: list[str]) -> dict[str, float]:
    document_frequency: Counter[str] = Counter()
    for chunk in chunks:
        document_frequency.update(set(_tokens(chunk)))
    chunk_count = max(len(chunks), 1)
    return {
        token: math.log((chunk_count + 1) / (frequency + 1)) + 1
        for token, frequency in document_frequency.items()
    }


def _vectorize(tokens: list[str], idf: dict[str, float]) -> list[float]:
    vector = [0.0] * VECTOR_SIZE
    counts = Counter(tokens)
    for token, count in counts.items():
        digest = hashlib.blake2b(token.encode("utf-8"), digest_size=8).digest()
        index = int.from_bytes(digest[:4], "big") % VECTOR_SIZE
        sign = 1.0 if digest[4] & 1 else -1.0
        vector[index] += sign * (1 + math.log(count)) * idf.get(token, 1.0)
    magnitude = math.sqrt(sum(value * value for value in vector))
    if magnitude:
        vector = [value / magnitude for value in vector]
    return vector


def _elapsed_ms(started: float) -> int:
    return round((time.perf_counter() - started) * 1000)


def _step(
    key: str,
    title: str,
    started: float,
    summary: str,
    *,
    meta: dict[str, str | int | float | bool] | None = None,
    items: list[dict[str, Any]] | None = None,
    prompt: str | None = None,
) -> dict[str, Any]:
    result: dict[str, Any] = {
        "key": key,
        "title": title,
        "ms": _elapsed_ms(started),
        "summary": summary,
    }
    if meta:
        result["meta"] = meta
    if items:
        result["items"] = items
    if prompt is not None:
        result["prompt"] = prompt
    return result


def _preview_items(
    chunks: list[str], vectors: list[list[float]] | None = None
) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for index, chunk in enumerate(chunks[:8]):
        item: dict[str, Any] = {
            "label": f"C{index + 1}",
            "text": chunk,
            "words": len(chunk.split()),
        }
        if vectors:
            item["vector"] = [round(value, 4) for value in vectors[index][:8]]
        items.append(item)
    return items


@app.get("/health")
@app.get("/api/main/health", include_in_schema=False)
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/rag/ingest")
@app.post("/api/main/rag/ingest", include_in_schema=False)
def ingest(request: IngestRequest) -> dict[str, Any]:
    text = request.text.strip()
    if not text:
        raise HTTPException(status_code=422, detail="Document text must not be empty.")

    started = time.perf_counter()
    sentences, chunks = _chunk_document(text)
    split_step = _step(
        "split",
        "Split",
        started,
        f"{len(sentences)} sentences",
        meta={"sentences": len(sentences)},
        items=[
            {"label": f"S{index + 1}", "text": sentence, "words": len(sentence.split())}
            for index, sentence in enumerate(sentences[:8])
        ],
    )

    started = time.perf_counter()
    chunk_step = _step(
        "chunk",
        "Chunk",
        started,
        f"{len(chunks)} chunks",
        meta={
            "target_words": MAX_CHUNK_WORDS,
            "overlap_words": CHUNK_OVERLAP_WORDS,
        },
        items=_preview_items(chunks),
    )

    started = time.perf_counter()
    idf = _document_idf(chunks)
    vectors = [_vectorize(_tokens(chunk), idf) for chunk in chunks]
    embed_step = _step(
        "embed",
        "Embed",
        started,
        f"{len(vectors)} compact lexical vectors",
        meta={"dimensions": VECTOR_SIZE, "method": "hashed TF-IDF"},
        items=_preview_items(chunks, vectors),
    )

    started = time.perf_counter()
    store_step = _step(
        "store",
        "Store",
        started,
        "Ready; no persistent storage",
        meta={
            "chunks": len(chunks),
            "persistence": "none",
            "note": "The index is rebuilt from the supplied text for each question.",
        },
    )

    return {
        "doc_id": _document_id(text),
        "steps": [split_step, chunk_step, embed_step, store_step],
    }


@app.post("/rag/search")
@app.post("/api/main/rag/search", include_in_schema=False)
def search(request: SearchRequest) -> dict[str, Any]:
    text = request.text.strip()
    question = request.question.strip()
    if not text or not question:
        raise HTTPException(
            status_code=422,
            detail="Document text and question must not be empty.",
        )
    if request.doc_id != _document_id(text):
        raise HTTPException(
            status_code=409,
            detail="The document changed. Re-index it before asking a question.",
        )

    _, chunks = _chunk_document(text)
    if not chunks:
        raise HTTPException(status_code=422, detail="No searchable text was found.")

    started = time.perf_counter()
    idf = _document_idf(chunks)
    query_vector = _vectorize(_tokens(question), idf)
    embed_query_step = _step(
        "embed_query",
        "Embed question",
        started,
        f"{len(_tokens(question))} terms",
        meta={"dimensions": VECTOR_SIZE, "method": "hashed TF-IDF"},
        items=[{"label": "Q", "text": question, "vector": [round(v, 4) for v in query_vector[:8]]}],
    )

    started = time.perf_counter()
    ranked: list[tuple[int, float, str, list[float]]] = []
    for index, chunk in enumerate(chunks):
        vector = _vectorize(_tokens(chunk), idf)
        score = max(0.0, sum(left * right for left, right in zip(query_vector, vector)))
        ranked.append((index, score, chunk, vector))
    ranked.sort(key=lambda result: result[1], reverse=True)
    matches = [result for result in ranked[: request.top_k] if result[1] > 0]
    sources = [
        {
            "label": f"C{index + 1}",
            "text": chunk,
            "words": len(chunk.split()),
            "score": round(score, 4),
            "vector": [round(value, 4) for value in vector[:8]],
        }
        for index, score, chunk, vector in matches
    ]
    search_step = _step(
        "search",
        "Search",
        started,
        f"{len(matches)} relevant chunks",
        meta={"searched_chunks": len(chunks), "returned": len(matches)},
        items=sources,
    )

    context = "\n\n".join(f"[{source['label']}] {source['text']}" for source in sources)
    prompt = (
        f"Question: {question}\n\nDocument excerpts:\n{context}"
        if context
        else f"Question: {question}\n\nNo relevant document excerpts were found."
    )
    started = time.perf_counter()
    augment_step = _step(
        "augment",
        "Augment",
        started,
        f"{len(matches)} excerpts added to context",
        meta={"answer_mode": "extractive"},
        prompt=prompt,
    )

    started = time.perf_counter()
    answer = (
        "Relevant passages from the document:\n\n"
        + "\n\n".join(f"[{source['label']}] {source['text']}" for source in sources)
        if sources
        else "I couldn't find a relevant passage in the supplied document."
    )
    generate_step = _step(
        "generate",
        "Generate",
        started,
        "Extractive answer ready (no external model)",
        meta={"answer_mode": "extractive"},
    )

    return {
        "answer": answer,
        "sources": sources,
        "steps": [embed_query_step, search_step, augment_step, generate_step],
    }