self.onmessage = async (e) => {
  const { DB_NAME, STORE_NAME, TOTAL, BATCH, columns } = e.data;

  const openDB = () =>
    new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);

      req.onupgradeneeded = (ev) => {
        const db = ev.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      };

      req.onsuccess = (ev) => resolve(ev.target.result);
      req.onerror = (ev) => reject(ev.target.error);
    });

  const db = await openDB();

  let inserted = 0;

  while (inserted < TOTAL) {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    for (let i = 0; i < BATCH && inserted < TOTAL; i++) {
      inserted++;

      const record = { id: inserted };

      columns.forEach((col) => {
        record[col.name] =
          col.type === "number" ? inserted : `${col.name}_${inserted}`;
      });

      store.put(record);
    }

    await new Promise((r) => setTimeout(r, 0));

    self.postMessage({ inserted });
  }

  self.postMessage({ done: true });
};