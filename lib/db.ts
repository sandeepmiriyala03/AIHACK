// =====================================================
// AksharaChitra — IndexedDB Utility (Next.js safe)
// =====================================================
// All DB calls are client-side only — safe for Next.js SSR
// since this module is only imported inside useEffect / event handlers.

import type { SavedPoster } from "../types";

const DB_NAME = "ak_gallery_v13";
const STORE_NAME = "posters";
const DB_VERSION = 2;

let _db: IDBDatabase | null = null;

export async function openDB(): Promise<IDBDatabase> {
  if (_db) return _db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("ts", "ts", { unique: false });
        store.createIndex("title", "title", { unique: false });
      }
    };

    request.onsuccess = (e) => {
      _db = (e.target as IDBOpenDBRequest).result;
      resolve(_db);
    };

    request.onerror = (e) => {
      reject((e.target as IDBOpenDBRequest).error);
    };
  });
}

export async function savePosterToDB(
  rec: Omit<SavedPoster, "id">
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).add(rec);
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject((e.target as IDBRequest).error);
  });
}

export async function getAllPosters(): Promise<SavedPoster[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result ?? []);
    req.onerror = (e) => reject((e.target as IDBRequest).error);
  });
}

export async function deletePosterFromDB(id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject((e.target as IDBRequest).error);
  });
}

export async function clearAllPosters(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject((e.target as IDBRequest).error);
  });
}
