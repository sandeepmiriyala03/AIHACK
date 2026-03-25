/// <reference lib="webworker" />

type Column = {
  name: string;
  type: "string" | "number";
};

self.onmessage = async (e: MessageEvent) => {
  const { DB_NAME, STORE_NAME, TOTAL, BATCH, columns } = e.data;

  const openDB = (): Promise<IDBDatabase> =>
    new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);

      req.onupgradeneeded = (ev) => {
        const db = (ev.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      };

      req.onsuccess = (ev) =>
        resolve((ev.target as IDBOpenDBRequest).result);

      req.onerror = (ev) =>
        reject((ev.target as IDBOpenDBRequest).error);
    });

  const db = await openDB();

  let inserted = 0;

  while (inserted < TOTAL) {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    for (let i = 0; i < BATCH && inserted < TOTAL; i++) {
      inserted++;

      const record: any = { id: inserted };

      columns.forEach((col: Column) => {
        record[col.name] =
          col.type === "number" ? inserted : `${col.name}_${inserted}`;
      });

      store.put(record);
    }

    await new Promise((r) => setTimeout(r, 0));

    (self as any).postMessage({ inserted });
  }

  (self as any).postMessage({ done: true });
};