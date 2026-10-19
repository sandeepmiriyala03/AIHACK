"""
AksharaTantra Python API (Vercel serverless function: api/main.py)

How it's reached
  On Vercel : https://<your-domain>/api/main/...  → vercel.json rewrite → this file
  Locally   : uvicorn on http://127.0.0.1:8000/api/main/...
  Both      : interactive docs at /api/main/docs

Every route lives under /api/main, because Vercel passes the original
request path to this function.

Files in this folder
  main.py        this entry point (Vercel deploys it as a function)
  _employees.py  staff directory endpoints. The leading "_" stops Vercel
                 from deploying it as a separate function.

Run locally (PowerShell, from the project root):
  pip install -r requirements.txt
  $env:DATABASE_URL="<Neon pooled connection string>"
  $env:API_KEY="local-test-key"
  cd api
  uvicorn main:app --reload --port 8000
  open http://127.0.0.1:8000/api/main/docs
"""

import os
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Make sibling files (_employees.py) importable on Vercel and locally
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from _employees import router as employees_router  # noqa: E402

PREFIX = "/api/main"

app = FastAPI(
    title="AksharaTantra API",
    version="1.0.0",
    docs_url=f"{PREFIX}/docs",
    openapi_url=f"{PREFIX}/openapi.json",
)

# The browser goes through the Next.js proxy (server to server), so CORS only
# matters if a page ever calls this API directly.
allowed = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed,
    allow_methods=["GET"],
    allow_headers=["X-Api-Key", "Content-Type"],
)

# /api/main/employees, /api/main/employees/stats, /anomalies, /health
app.include_router(employees_router, prefix=PREFIX)


@app.get(PREFIX)
def root():
    return {"service": "aksharatantra-api", "docs": f"{PREFIX}/docs", "health": f"{PREFIX}/employees/health"}