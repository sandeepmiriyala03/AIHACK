"use client";
// =====================================================
// AksharaChitra — Gallery Component (FIXED)
// =====================================================
// FIX 3: Gallery now reloads whenever the tab is switched to "gallery"
// by listening to a custom "gallery-refresh" window event fired from page.tsx

import { useCallback, useEffect, useState } from "react";
import {
  getAllPosters,
  deletePosterFromDB,
  clearAllPosters,
} from "../../lib/db";
import type { SavedPoster, SortOrder } from "../../types";
import { downloadDataUrl } from "../../lib/imageUtils";
import { showToast } from "./Toast";

const PAGE_SIZE_OPTIONS = [6, 12, 20];

export function Gallery() {
  const [posters, setPosters] = useState<SavedPoster[]>([]);
  const [sortBy, setSortBy] = useState<SortOrder>("newest");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [loading, setLoading] = useState(true);
  const [previewItem, setPreviewItem] = useState<SavedPoster | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await getAllPosters();
      setPosters(all);
    } catch {
      showToast("❌ Could not load gallery", "#E53935");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    load();
  }, [load]);

  // FIX 3: Re-load whenever page.tsx fires "gallery-refresh" event
  // (fired when user clicks "My Creations" tab OR after a successful save)
  useEffect(() => {
    const handler = () => load();
    window.addEventListener("gallery-refresh", handler);
    return () => window.removeEventListener("gallery-refresh", handler);
  }, [load]);

  // Filter + sort
  let filtered = [...posters];
  const f = filter.trim().toLowerCase();
  if (f) filtered = filtered.filter((x) => (x.title || "").toLowerCase().includes(f));
  if (sortBy === "newest") filtered.sort((a, b) => b.ts - a.ts);
  if (sortBy === "oldest") filtered.sort((a, b) => a.ts - b.ts);
  if (sortBy === "name-asc") filtered.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
  if (sortBy === "name-desc") filtered.sort((a, b) => (b.title || "").localeCompare(a.title || ""));

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const items = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this poster?")) return;
    await deletePosterFromDB(id);
    showToast("🗑️ Deleted", "#E53935");
    load();
  };

  const handleClearAll = async () => {
    if (!confirm("Delete ALL posters?")) return;
    await clearAllPosters();
    showToast("🗑️ All cleared", "#E53935");
    load();
  };

  return (
    <div className="is-e41b563">
      {/* Controls */}
      <div className="is-270ac1d">
        <span className="is-d7d261b">
          Total: {posters.length}
        </span>
        <select value={sortBy} onChange={(e) => { setSortBy(e.target.value as SortOrder); setPage(1); }} className="is-f2b3bd0">
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="name-asc">A → Z</option>
          <option value="name-desc">Z → A</option>
        </select>
        <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="is-f2b3bd0">
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>{n} per page</option>
          ))}
        </select>
        <input
          placeholder="Filter by title…"
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setPage(1); }}
          className="is-4ee012e"
        />
        <button onClick={load} className="is-c4c8996">🔄 Refresh</button>
        <button onClick={handleClearAll} className="is-214a115">
          🗑 Clear All
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <p className="is-73f809e">Loading…</p>
      ) : items.length === 0 ? (
        <p className="is-73f809e">
          No posters found. Create one in the Create tab!
        </p>
      ) : (
        <>
          <div className="is-4813ae5">
            {items.map((item) => (
              <div key={item.id} className="is-28d3d23">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.dataUrl}
                  alt={item.title}
                  loading="lazy"
                  className="is-5970110"
                  onClick={() => setPreviewItem(item)}
                />
                <div className="is-a5e9c96">
                  <div className="is-0195665">
                    {item.title || "Untitled"}
                  </div>
                  <div className="is-ca9af91">
                    {new Date(item.ts).toLocaleDateString()}
                  </div>
                  <div className="is-4a5d9a1">
                    <button onClick={() => setPreviewItem(item)} className="is-1a54b55">🔍</button>
                    <button onClick={() => downloadDataUrl(item.dataUrl, `${(item.title || "poster").replace(/[^\w\- ]/g, "")}.png`)} className="is-1a54b55">⬇</button>
                    <button onClick={() => handleDelete(item.id!)} className="is-2348b70">🗑</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="is-85274bd">
            {currentPage > 1 && (
              <button onClick={() => setPage(currentPage - 1)} className="is-c4c8996">◀ Prev</button>
            )}
            <span>{currentPage} / {totalPages}</span>
            {currentPage < totalPages && (
              <button onClick={() => setPage(currentPage + 1)} className="is-c4c8996">Next ▶</button>
            )}
          </div>
        </>
      )}

      {/* Preview Modal */}
      {previewItem && (
        <div
          className="is-2476138"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="is-be84b1d"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="is-cf960dc">
              <div>
                <div className="is-be8e63c">{previewItem.title || "Untitled"}</div>
                <div className="is-41d412c">{new Date(previewItem.ts).toLocaleString()}</div>
              </div>
              <button onClick={() => setPreviewItem(null)} className="is-f0e294d">✖</button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewItem.dataUrl} alt="Poster preview" className="is-dfaf437" />
            <button
              onClick={() => downloadDataUrl(previewItem.dataUrl, `${(previewItem.title || "poster").replace(/[^\w\- ]/g, "")}.png`)}
              className="is-b010254"
            >
              ⬇ Download
            </button>
          </div>
        </div>
      )}
    </div>
  );
}