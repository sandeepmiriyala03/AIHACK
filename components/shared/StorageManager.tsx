// components/shared/StorageManager.ts
// IndexedDB + LocalStorage hybrid manager with strict TypeScript

import { formatBytes } from "./Utils";

/* ---------- Types ---------- */
export interface BlobRecord {
  id: string;
  name?: string;
  type?: string;
  createdAt: number;
  size?: number;
}

export interface MetaRecord<T> {
  key: string;
  value: T;
}

class StorageManager {
  private dbName = "aksharatantra-db";
  private storeFiles = "files";
  private storeMeta = "meta";
  private db: IDBDatabase | null = null;

  /* -------------------------
      INIT DB
  ------------------------- */
  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve) => {
      try {
        const req = indexedDB.open(this.dbName, 1);

        req.onupgradeneeded = (ev) => {
          const database = (ev.target as IDBOpenDBRequest).result;

          if (!database.objectStoreNames.contains(this.storeFiles)) {
            database.createObjectStore(this.storeFiles, { keyPath: "id" });
          }
          if (!database.objectStoreNames.contains(this.storeMeta)) {
            database.createObjectStore(this.storeMeta, { keyPath: "key" });
          }
        };

        req.onsuccess = () => {
          this.db = req.result;
          resolve();
        };

        req.onerror = () => {
          console.warn("IndexedDB unavailable, fallback to localStorage");
          this.db = null;
          resolve();
        };
      } catch {
        this.db = null;
        resolve();
      }
    });
  }

  /* -------------------------
      SAVE BLOB
  ------------------------- */
  async saveBlob(id: string, blob: Blob, name?: string): Promise<BlobRecord> {
    const record: BlobRecord = {
      id,
      name: name || id,
      type: blob.type,
      createdAt: Date.now(),
      size: blob.size,
    };

    try {
      if (!this.db) await this.init();
      if (!this.db) throw new Error("DB not available");

      return await new Promise<BlobRecord>((resolve, reject) => {
        const tx = this.db!.transaction(this.storeFiles, "readwrite");
        const store = tx.objectStore(this.storeFiles);

        const req = store.put({ ...record, blob });

        req.onsuccess = () => resolve(record);
        req.onerror = () => reject("Failed to save blob");
      });
    } catch {
      localStorage.setItem(`filemeta_${id}`, JSON.stringify(record));
      return record;
    }
  }

  /* -------------------------
      GET BLOB
  ------------------------- */
  async getBlob(id: string): Promise<Blob | null> {
    try {
      if (!this.db) await this.init();
      if (!this.db) return null;

      return await new Promise<Blob | null>((resolve) => {
        const tx = this.db!.transaction(this.storeFiles, "readonly");
        const req = tx.objectStore(this.storeFiles).get(id);

        req.onsuccess = () => {
          const row = req.result;
          resolve(row?.blob ?? null);
        };

        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  /* -------------------------
      DELETE BLOB
  ------------------------- */
  async deleteBlob(id: string): Promise<void> {
    try {
      if (!this.db) await this.init();
      if (!this.db) {
        localStorage.removeItem(`filemeta_${id}`);
        return;
      }

      const tx = this.db!.transaction(this.storeFiles, "readwrite");
      tx.objectStore(this.storeFiles).delete(id);
    } catch {
      localStorage.removeItem(`filemeta_${id}`);
    }
  }

  /* -------------------------
      LIST FILES
  ------------------------- */
  async listFiles(): Promise<BlobRecord[]> {
    try {
      if (!this.db) await this.init();

      if (!this.db) {
        const arr: BlobRecord[] = [];

        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i) ?? "";
          if (key.startsWith("filemeta_")) {
            const item = localStorage.getItem(key);
            if (item) arr.push(JSON.parse(item));
          }
        }
        return arr;
      }

      return await new Promise<BlobRecord[]>((resolve) => {
        const tx = this.db!.transaction(this.storeFiles, "readonly");
        const req = tx.objectStore(this.storeFiles).getAll();

        req.onsuccess = () => {
          const rows = (req.result || []).map(
            (row: { id: string; name: string; type: string; createdAt: number; size: number }) =>
              row
          );
          resolve(rows);
        };

        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }

  /* -------------------------
      USAGE STATS
  ------------------------- */
  async getUsageStats(): Promise<{ totalBytes: number; human: string }> {
    const files = await this.listFiles();
    const total = files.reduce((sum, f) => sum + (f.size ?? 0), 0);
    return { totalBytes: total, human: formatBytes(total) };
  }

  /* -------------------------
      META SET
  ------------------------- */
  async setMeta<T>(key: string, value: T): Promise<void> {
    try {
      if (!this.db) await this.init();

      if (!this.db) {
        localStorage.setItem(`meta_${key}`, JSON.stringify(value));
        return;
      }

      const tx = this.db!.transaction(this.storeMeta, "readwrite");
      tx.objectStore(this.storeMeta).put({ key, value });
    } catch {
      localStorage.setItem(`meta_${key}`, JSON.stringify(value));
    }
  }

  /* -------------------------
      META GET
  ------------------------- */
  async getMeta<T>(key: string): Promise<T | null> {
    try {
      if (!this.db) await this.init();

      if (!this.db) {
        const raw = localStorage.getItem(`meta_${key}`);
        return raw ? (JSON.parse(raw) as T) : null;
      }

      return await new Promise<T | null>((resolve) => {
        const tx = this.db!.transaction(this.storeMeta, "readonly");
        const req = tx.objectStore(this.storeMeta).get(key);

        req.onsuccess = () => resolve(req.result?.value ?? null);
        req.onerror = () => resolve(null);
      });
    } catch {
      const raw = localStorage.getItem(`meta_${key}`);
      return raw ? (JSON.parse(raw) as T) : null;
    }
  }

  /* -------------------------
      CLEAR ALL
  ------------------------- */
  async clearAll(): Promise<void> {
    try {
      if (!this.db) await this.init();

      if (this.db) {
        this.db.close();
        indexedDB.deleteDatabase(this.dbName);
        this.db = null;
      }

      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("filemeta_") || key.startsWith("meta_"))
          localStorage.removeItem(key);
      });
    } catch {}
  }
}

/* ---------- EXPORT SINGLETON ---------- */
const storageManager = new StorageManager();
export default storageManager;
