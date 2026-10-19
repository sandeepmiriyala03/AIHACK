"""
Staff directory API for the yuktai v5.1 agentic grid.

Everything heavy happens in Neon PostgreSQL, so the browser only ever holds one
page of rows, however large the table is (tested with 1,000,000 employees).

Endpoints (mount with app.include_router(router)):
  GET /employees            one page of rows: filters, search, sort, pagination
  GET /employees/stats      totals and averages, optionally grouped (BI questions)
  GET /employees/anomalies  rows far outside the normal range (IQR rule)
  GET /employees/health     database check + capacity settings

Filters use the same shape yuktai's grid agent produces (GridToolFilter):
  [{"key": "salary", "operator": "greaterThan", "value": 100000}, ...]

Safety: every column and operator is whitelisted, every value is a bound
parameter (never pasted into SQL), page sizes are capped and each query has a
statement timeout.

Environment variables:
  DATABASE_URL       Neon connection string (use the "pooled" one)   required
  MAX_PAGE_SIZE      largest page the API returns (default 100, hard cap 1000)
  STATEMENT_TIMEOUT  per-query limit in ms (default 8000)
  API_KEY            optional; if set, requests must send header X-Api-Key
"""

from __future__ import annotations

import json
import os
from datetime import date
from decimal import Decimal
from typing import Any, Literal

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from psycopg import sql
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

# ── Settings ────────────────────────────────────────────────────────────────

MAX_PAGE_SIZE = max(1, min(int(os.getenv("MAX_PAGE_SIZE", "100")), 1000))
STATEMENT_TIMEOUT_MS = int(os.getenv("STATEMENT_TIMEOUT", "8000"))
MAX_OFFSET = 1_000_000  # deepest row you can page to with OFFSET

# Grid column key -> (SQL column in the staff_directory view, type)
COLUMNS: dict[str, tuple[str, str]] = {
    "id": ("id", "number"),
    "name": ("name", "text"),
    "salary": ("salary", "number"),
    "age": ("age", "number"),
    "department": ("department", "text"),
    "joinedOn": ("joined_on", "date"),
}
TEXT_OPERATORS = {"contains", "equals", "startsWith", "endsWith"}
RANGE_OPERATORS = {"equals", "greaterThan", "lessThan", "between"}
GROUPABLE = {"department", "age"}
AGGREGATES = {"sum", "avg", "min", "max", "count"}

_pool: ConnectionPool | None = None


def get_pool() -> ConnectionPool:
    """One small pool per process; opened lazily so imports never need the DB."""
    global _pool
    if _pool is None:
        url = os.getenv("DATABASE_URL")
        if not url:
            raise HTTPException(500, "DATABASE_URL is not set on the API server.")
        _pool = ConnectionPool(
            url,
            min_size=0,
            max_size=int(os.getenv("DB_POOL_SIZE", "5")),
            kwargs={"row_factory": dict_row, "autocommit": True},
            open=True,
        )
    return _pool


def run(query: sql.Composable, params: list[Any]) -> list[dict[str, Any]]:
    with get_pool().connection() as conn:
        conn.execute(sql.SQL("SET statement_timeout = {}").format(sql.Literal(STATEMENT_TIMEOUT_MS)))
        return conn.execute(query, params).fetchall()


def check_api_key(x_api_key: str | None = Header(default=None)) -> None:
    expected = os.getenv("API_KEY")
    if expected and x_api_key != expected:
        raise HTTPException(401, "Missing or wrong X-Api-Key.")


router = APIRouter(prefix="/employees", tags=["staff directory"], dependencies=[Depends(check_api_key)])

# ── Query building ──────────────────────────────────────────────────────────


def _column(key: str) -> tuple[sql.Identifier, str]:
    if key not in COLUMNS:
        raise HTTPException(400, f'Unknown column "{key}". Allowed: {", ".join(COLUMNS)}.')
    name, kind = COLUMNS[key]
    return sql.Identifier(name), kind


def _like(value: str) -> str:
    """Escape %, _ and \\ so user text is matched literally."""
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def _typed(value: Any, kind: str) -> Any:
    try:
        if kind == "number":
            return float(value)
        if kind == "date":
            return date.fromisoformat(str(value)[:10])
    except (TypeError, ValueError):
        raise HTTPException(400, f"{value!r} is not a valid {kind}.")
    return str(value)


def build_conditions(filters_json: str | None, search: str | None) -> tuple[list[sql.Composable], list[Any]]:
    """WHERE conditions (joined with AND) and their bound parameters."""
    parts: list[sql.Composable] = []
    params: list[Any] = []

    try:
        filters = json.loads(filters_json) if filters_json else []
    except json.JSONDecodeError:
        raise HTTPException(400, "filters must be a JSON array.")
    if not isinstance(filters, list) or len(filters) > 20:
        raise HTTPException(400, "filters must be a JSON array of at most 20 items.")

    for f in filters:
        if not isinstance(f, dict):
            raise HTTPException(400, "Each filter must be an object with key, operator and value.")
        col, kind = _column(str(f.get("key", "")))
        op = str(f.get("operator", ""))
        value = f.get("value")

        if kind == "text":
            if op not in TEXT_OPERATORS:
                raise HTTPException(400, f'Operator "{op}" is not allowed on text.')
            text = str(value).strip()
            if op == "equals":
                parts.append(sql.SQL("lower({}) = lower(%s)").format(col))
                params.append(text)
            else:
                pattern = {"contains": "%{}%", "startsWith": "{}%", "endsWith": "%{}"}[op].format(_like(text))
                parts.append(sql.SQL("{} ILIKE %s").format(col))
                params.append(pattern)
        else:
            if op not in RANGE_OPERATORS:
                raise HTTPException(400, f'Operator "{op}" is not allowed on {kind} columns.')
            if op == "between":
                if not isinstance(value, list) or len(value) != 2:
                    raise HTTPException(400, "between needs [low, high].")
                lo, hi = sorted([_typed(value[0], kind), _typed(value[1], kind)])
                parts.append(sql.SQL("{} BETWEEN %s AND %s").format(col))
                params.extend([lo, hi])
            else:
                symbol = {"equals": "=", "greaterThan": ">", "lessThan": "<"}[op]
                parts.append(sql.SQL("{} " + symbol + " %s").format(col))
                params.append(_typed(value, kind))

    # Free-text search across name and department (each word must match)
    for word in (search or "").split()[:5]:
        parts.append(sql.SQL("(name ILIKE %s OR department ILIKE %s)"))
        pattern = f"%{_like(word)}%"
        params.extend([pattern, pattern])

    return parts, params


def where_clause(parts: list[sql.Composable]) -> sql.Composable:
    return sql.SQL(" WHERE ") + sql.SQL(" AND ").join(parts) if parts else sql.SQL("")


def build_where(filters_json: str | None, search: str | None) -> tuple[sql.Composable, list[Any]]:
    parts, params = build_conditions(filters_json, search)
    return where_clause(parts), params


def _row(r: dict[str, Any]) -> dict[str, Any]:
    out = dict(r)
    for k, v in out.items():
        if isinstance(v, Decimal):
            out[k] = float(v)
        elif isinstance(v, date):
            out[k] = v.isoformat()
    if "joined_on" in out:
        out["joinedOn"] = out.pop("joined_on")
    return out


SELECT_ROW = sql.SQL("SELECT id, name, salary, age, department, joined_on FROM staff_directory")

# ── Endpoints ───────────────────────────────────────────────────────────────


@router.get("")
def list_employees(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, alias="pageSize"),
    filters: str | None = Query(None, description="JSON array of {key, operator, value}"),
    search: str | None = Query(None, max_length=100),
    sort_key: str | None = Query(None, alias="sortKey"),
    sort_dir: Literal["asc", "desc"] = Query("asc", alias="sortDir"),
):
    page_size = min(page_size, MAX_PAGE_SIZE)
    offset = (page - 1) * page_size
    if offset > MAX_OFFSET:
        raise HTTPException(400, f"Page too deep. Narrow the results with a filter or search instead.")

    where, params = build_where(filters, search)

    order = sql.SQL(" ORDER BY id")
    if sort_key:
        col, _ = _column(sort_key)
        direction = sql.SQL("DESC NULLS LAST" if sort_dir == "desc" else "ASC NULLS LAST")
        order = sql.SQL(" ORDER BY {} {}, id").format(col, direction)

    rows = run(SELECT_ROW + where + order + sql.SQL(" LIMIT %s OFFSET %s"), [*params, page_size, offset])
    total = run(sql.SQL("SELECT count(*) AS n FROM staff_directory") + where, params)[0]["n"]

    return {
        "rows": [_row(r) for r in rows],
        "pagination": {
            "page": page,
            "pageSize": page_size,
            "totalRows": total,
            "totalPages": max(1, -(-total // page_size)),
            "maxPageSize": MAX_PAGE_SIZE,
        },
    }


@router.get("/stats")
def stats(
    metric: str = Query("salary", description="number column, ignored for count"),
    agg: str = Query("avg"),
    group_by: str | None = Query(None, alias="groupBy"),
    filters: str | None = None,
    search: str | None = Query(None, max_length=100),
    order: Literal["asc", "desc"] = "desc",
    limit: int = Query(50, ge=1, le=200),
):
    if agg not in AGGREGATES:
        raise HTTPException(400, f"agg must be one of {', '.join(sorted(AGGREGATES))}.")
    where, params = build_where(filters, search)

    if agg == "count":
        value = sql.SQL("count(*)")
    else:
        col, kind = _column(metric)
        if kind != "number":
            raise HTTPException(400, "metric must be a number column (salary or age).")
        value = sql.SQL("round({}({})::numeric, 2)").format(sql.SQL(agg), col)

    overall = run(sql.SQL("SELECT {} AS value, count(*) AS count FROM staff_directory").format(value) + where, params)[0]

    groups: list[dict[str, Any]] = []
    if group_by:
        if group_by not in GROUPABLE:
            raise HTTPException(400, f"groupBy must be one of {', '.join(sorted(GROUPABLE))}.")
        gcol, _ = _column(group_by)
        q = (
            sql.SQL("SELECT {} AS {}, {} AS value, count(*) AS count FROM staff_directory").format(gcol, sql.Identifier("group"), value)
            + where
            + sql.SQL(" GROUP BY 1 ORDER BY 2 " + ("DESC" if order == "desc" else "ASC") + " NULLS LAST LIMIT %s")
        )
        groups = [_row(r) for r in run(q, [*params, limit])]

    return {"metric": metric, "agg": agg, "groupBy": group_by, "overall": _row(overall), "groups": groups}


@router.get("/anomalies")
def anomalies(
    column: Literal["salary", "age"] = "salary",
    factor: float = Query(1.5, ge=0.5, le=10),
    filters: str | None = None,
    search: str | None = Query(None, max_length=100),
    limit: int = Query(25, ge=1, le=100),
):
    parts, params = build_conditions(filters, search)
    where = where_clause(parts)
    col, _ = _column(column)
    q = run(
        sql.SQL(
            "SELECT percentile_cont(0.25) WITHIN GROUP (ORDER BY {c}) AS q1, "
            "percentile_cont(0.75) WITHIN GROUP (ORDER BY {c}) AS q3 FROM staff_directory"
        ).format(c=col)
        + where,
        params,
    )[0]
    if q["q1"] is None:
        return {"column": column, "rows": [], "totalOutliers": 0}

    q1, q3 = float(q["q1"]), float(q["q3"])
    low, high = q1 - factor * (q3 - q1), q3 + factor * (q3 - q1)
    outside = sql.SQL("({c} < %s OR {c} > %s)").format(c=col)
    where_out = where_clause([*parts, outside])

    rows = run(
        SELECT_ROW + where_out + sql.SQL(" ORDER BY abs({c} - %s) DESC LIMIT %s").format(c=col),
        [*params, low, high, (q1 + q3) / 2, limit],
    )
    total = run(sql.SQL("SELECT count(*) AS n FROM staff_directory") + where_out, [*params, low, high])[0]["n"]
    return {
        "column": column,
        "q1": q1,
        "q3": q3,
        "lower": low,
        "upper": high,
        "totalOutliers": total,
        "rows": [_row(r) for r in rows],
    }


@router.get("/health")
def health():
    info = run(
        sql.SQL(
            "SELECT reltuples::bigint AS estimated_rows FROM pg_class WHERE oid = 'employees'::regclass"
        ),
        [],
    )[0]
    return {"ok": True, "estimatedRows": info["estimated_rows"], "maxPageSize": MAX_PAGE_SIZE, "maxOffset": MAX_OFFSET}