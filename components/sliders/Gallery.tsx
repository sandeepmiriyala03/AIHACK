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
    <div style={{ padding: "16px 0" }}>
      {/* Controls */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20, alignItems: "center" }}>
        <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600 }}>
          Total: {posters.length}
        </span>
        <select value={sortBy} onChange={(e) => { setSortBy(e.target.value as SortOrder); setPage(1); }} style={selectStyle}>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="name-asc">A → Z</option>
          <option value="name-desc">Z → A</option>
        </select>
        <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} style={selectStyle}>
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>{n} per page</option>
          ))}
        </select>
        <input
          placeholder="Filter by title…"
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setPage(1); }}
          style={{ ...selectStyle, minWidth: 160 }}
        />
        <button onClick={load} style={ghostBtnStyle}>🔄 Refresh</button>
        <button onClick={handleClearAll} style={{ ...ghostBtnStyle, color: "#E53935", borderColor: "#E53935" }}>
          🗑 Clear All
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <p style={{ fontFamily: "Montserrat, sans-serif", color: "#888" }}>Loading…</p>
      ) : items.length === 0 ? (
        <p style={{ fontFamily: "Montserrat, sans-serif", color: "#888" }}>
          No posters found. Create one in the Create tab!
        </p>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
            {items.map((item) => (
              <div key={item.id} style={{ borderRadius: 10, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.10)", background: "#fff", display: "flex", flexDirection: "column" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.dataUrl}
                  alt={item.title}
                  loading="lazy"
                  style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", cursor: "pointer" }}
                  onClick={() => setPreviewItem(item)}
                />
                <div style={{ padding: "10px 12px 12px" }}>
                  <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.title || "Untitled"}
                  </div>
                  <div style={{ fontFamily: "Montserrat, sans-serif", fontSize: 11, color: "#888", marginBottom: 8 }}>
                    {new Date(item.ts).toLocaleDateString()}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => setPreviewItem(item)} style={smallBtnStyle}>🔍</button>
                    <button onClick={() => downloadDataUrl(item.dataUrl, `${(item.title || "poster").replace(/[^\w\- ]/g, "")}.png`)} style={smallBtnStyle}>⬇</button>
                    <button onClick={() => handleDelete(item.id!)} style={{ ...smallBtnStyle, color: "#E53935" }}>🗑</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div style={{ display: "flex", gap: 10, marginTop: 20, alignItems: "center", fontFamily: "Montserrat, sans-serif" }}>
            {currentPage > 1 && (
              <button onClick={() => setPage(currentPage - 1)} style={ghostBtnStyle}>◀ Prev</button>
            )}
            <span>{currentPage} / {totalPages}</span>
            {currentPage < totalPages && (
              <button onClick={() => setPage(currentPage + 1)} style={ghostBtnStyle}>Next ▶</button>
            )}
          </div>
        </>
      )}

      {/* Preview Modal */}
      {previewItem && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 10001, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => setPreviewItem(null)}
        >
          <div
            style={{ background: "#fff", borderRadius: 14, padding: 20, maxWidth: 560, width: "100%", boxShadow: "0 8px 40px rgba(0,0,0,0.3)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontFamily: "Montserrat, sans-serif" }}>
              <div>
                <div style={{ fontWeight: 700 }}>{previewItem.title || "Untitled"}</div>
                <div style={{ fontSize: 12, color: "#888" }}>{new Date(previewItem.ts).toLocaleString()}</div>
              </div>
              <button onClick={() => setPreviewItem(null)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer" }}>✖</button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewItem.dataUrl} alt="Poster preview" style={{ width: "100%", borderRadius: 8 }} />
            <button
              onClick={() => downloadDataUrl(previewItem.dataUrl, `${(previewItem.title || "poster").replace(/[^\w\- ]/g, "")}.png`)}
              style={{ ...primaryBtnStyle, width: "100%", marginTop: 12 }}
            >
              ⬇ Download
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  padding: "6px 10px", borderRadius: 7, border: "1.5px solid #ddd",
  fontFamily: "Montserrat, sans-serif", fontSize: 13, background: "#fff", cursor: "pointer",
};
const ghostBtnStyle: React.CSSProperties = {
  padding: "6px 14px", borderRadius: 7, border: "1.5px solid #ccc",
  background: "#fff", cursor: "pointer", fontFamily: "Montserrat, sans-serif", fontSize: 13,
};
const primaryBtnStyle: React.CSSProperties = {
  padding: "10px 20px", borderRadius: 8, border: "none",
  background: "#4A90E2", color: "#fff", fontWeight: 700,
  cursor: "pointer", fontFamily: "Montserrat, sans-serif",
};
const smallBtnStyle: React.CSSProperties = {
  padding: "4px 10px", borderRadius: 6, border: "1.5px solid #eee",
  background: "#fff", cursor: "pointer", fontSize: 14,
};