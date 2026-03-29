"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Alert,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
  Fade,
  Collapse,
} from "@mui/material";

import {
  Add as AddIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  KeyboardArrowDown,
  KeyboardArrowUp,
  NavigateBefore,
  NavigateNext,
  PlayArrow as PlayArrowIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Storage as StorageIcon,
  Tune as TuneIcon,
} from "@mui/icons-material";

import Navbar from "@/components/Navbar";
// ─── Constants ────────────────────────────────────────────────────────────────
const DB_NAME = "CroreExperimentDB";
const STORE_NAME = "experimentStore";
const DB_VERSION = 1;
const TOTAL_ENTRIES = 10_000_000;
const BATCH_SIZE = 50_000;
const PAGE_SIZE = 100;

// ─── Types ────────────────────────────────────────────────────────────────────
interface ColumnDef {
  key: string;
  label: string;
  type: "text" | "number" | "email" | "date";
}

interface LogEntry {
  id: number;
  text: string;
  ts: string;
}

interface SnackState {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info" | "warning";
}

type InsertState = "idle" | "inserting" | "done";
type DmlOperation = "SELECT" | "UPDATE" | "DELETE";

// ─── Predefined column presets ─────────────────────────────────────────────
const COLUMN_PRESETS: ColumnDef[][] = [
  [
    { key: "firstName", label: "First Name", type: "text" },
    { key: "lastName", label: "Last Name", type: "text" },
    { key: "email", label: "Email", type: "email" },
  ],
  [
    { key: "productId", label: "Product ID", type: "number" },
    { key: "productName", label: "Product Name", type: "text" },
    { key: "price", label: "Price", type: "number" },
    { key: "category", label: "Category", type: "text" },
  ],
  [
    { key: "orderId", label: "Order ID", type: "number" },
    { key: "customer", label: "Customer", type: "text" },
    { key: "amount", label: "Amount", type: "number" },
    { key: "date", label: "Date", type: "date" },
    { key: "status", label: "Status", type: "text" },
  ],
];

// ─── Utilities ────────────────────────────────────────────────────────────────
function formatIndian(n: number): string {
  if (n >= 10_000_000) return (n / 10_000_000).toFixed(2) + " Cr";
  if (n >= 100_000) return (n / 100_000).toFixed(2) + " L";
  return n.toLocaleString("en-IN");
}

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h && `${h}h`, m && `${m}m`, `${sec}s`].filter(Boolean).join(" ");
}

function formatHHMMSS(ms: number): string {
  const s = Math.floor(ms / 1000);
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60]
    .map((v) => String(v).padStart(2, "0"))
    .join(":");
}

function generateRecord(id: number, columns: ColumnDef[]): Record<string, unknown> {
  const rec: Record<string, unknown> = { id };
  columns.forEach((col) => {
    switch (col.type) {
      case "number":
        rec[col.key] = Math.floor(Math.random() * 1_000_000);
        break;
      case "email":
        rec[col.key] = `user${id}@example.com`;
        break;
      case "date":
        rec[col.key] = new Date(Date.now() - Math.random() * 3.15e10)
          .toISOString()
          .slice(0, 10);
        break;
      default:
        rec[col.key] = `${col.label}_${id}`;
    }
  });
  return rec;
}

// ─── IndexedDB helpers ────────────────────────────────────────────────────────
function openDatabase(columns: ColumnDef[]): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        columns.forEach((col) => {
          if (col.type === "number") store.createIndex(col.key, col.key);
        });
      }
    };
    req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
    req.onerror = (e) => reject((e.target as IDBOpenDBRequest).error);
  });
}

function deleteDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function countRecords(db: IDBDatabase): Promise<number> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function selectPage(
  db: IDBDatabase,
  page: number
): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    const start = page * PAGE_SIZE + 1;
    const end = (page + 1) * PAGE_SIZE;
    const range = IDBKeyRange.bound(start, end);
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).openCursor(range);
    const rows: Record<string, unknown>[] = [];
    req.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest<IDBCursorWithValue | null>).result;
      if (cursor) {
        rows.push(cursor.value);
        cursor.continue();
      } else {
        resolve(rows);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

function selectByIdRange(
  db: IDBDatabase,
  fromId: number,
  toId: number
): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    const range = IDBKeyRange.bound(fromId, toId);
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).openCursor(range);
    const rows: Record<string, unknown>[] = [];
    req.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest<IDBCursorWithValue | null>).result;
      if (cursor) {
        rows.push(cursor.value);
        cursor.continue();
      } else {
        resolve(rows);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

function updateRecord(
  db: IDBDatabase,
  id: number,
  patch: Record<string, unknown>
): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const record = { ...getReq.result, ...patch };
      const putReq = store.put(record);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

function deleteRecord(db: IDBDatabase, id: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const req = tx.objectStore(STORE_NAME).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ─── Inline batch insert (no Web Worker) ──────────────────────────────────────
async function insertBatchInline(
  db: IDBDatabase,
  start: number,
  count: number,
  columns: ColumnDef[]
): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    for (let i = start; i < start + count; i++) {
      store.put(generateRecord(i, columns));
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CroreExperimentPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isMd = useMediaQuery(theme.breakpoints.down("md"));

  // ── Column designer state ──────────────────────────────────────────────────
  const [columns, setColumns] = useState<ColumnDef[]>([
    { key: "firstName", label: "First Name", type: "text" },
    { key: "lastName", label: "Last Name", type: "text" },
    { key: "email", label: "Email", type: "email" },
  ]);
  const [newColLabel, setNewColLabel] = useState("");
  const [newColType, setNewColType] = useState<ColumnDef["type"]>("text");
  const [colError, setColError] = useState("");

  // ── DB / insertion state ───────────────────────────────────────────────────
  const dbRef = useRef<IDBDatabase | null>(null);
  const cancelRef = useRef(false);
  const insertionRef = useRef<Promise<void> | null>(null);

  const [insertState, setInsertState] = useState<InsertState>("idle");
  const [inserted, setInserted] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [eta, setEta] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([{ id: 0, text: "Ready to start…", ts: "" }]);
  const logIdRef = useRef(1);
  const logsEndRef = useRef<HTMLDivElement | null>(null);

  // ── DML state ──────────────────────────────────────────────────────────────
  const [dmlTab, setDmlTab] = useState<DmlOperation>("SELECT");
  const [dmlResult, setDmlResult] = useState<Record<string, unknown>[]>([]);
  const [dmlTotal, setDmlTotal] = useState(0);
  const [dmlPage, setDmlPage] = useState(0);
  const [dmlLoading, setDmlLoading] = useState(false);

  // SELECT
  const [selectFrom, setSelectFrom] = useState("1");
  const [selectTo, setSelectTo] = useState("100");

  // UPDATE
  const [updateId, setUpdateId] = useState("");
  const [updateField, setUpdateField] = useState("");
  const [updateValue, setUpdateValue] = useState("");

  // DELETE
  const [deleteId, setDeleteId] = useState("");

  // ── Edit dialog ────────────────────────────────────────────────────────────
  const [editRow, setEditRow] = useState<Record<string, unknown> | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  // ── Confirm dialog ─────────────────────────────────────────────────────────
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMsg, setConfirmMsg] = useState("");
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});

  // ── Snack ──────────────────────────────────────────────────────────────────
  const [snack, setSnack] = useState<SnackState>({ open: false, message: "", severity: "info" });

  const showSnack = (message: string, severity: SnackState["severity"] = "info") =>
    setSnack({ open: true, message, severity });

  // ── Section open state ─────────────────────────────────────────────────────
  const [colDesignerOpen, setColDesignerOpen] = useState(true);

  // ── Elapsed timer ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (insertState !== "inserting" || !startTime) return;
    const interval = setInterval(() => {
      setElapsed(performance.now() - startTime);
    }, 500);
    return () => clearInterval(interval);
  }, [insertState, startTime]);

  // ── Auto-scroll logs ───────────────────────────────────────────────────────
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = useCallback((text: string) => {
    const now = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev.slice(-199), { id: logIdRef.current++, text, ts: now }]);
  }, []);

  // ─── Column designer helpers ───────────────────────────────────────────────
  function toKey(label: string): string {
    return label
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_]/g, "")
      .toLowerCase();
  }

  function addColumn() {
    const label = newColLabel.trim();
    if (!label) { setColError("Column name is required"); return; }
    const key = toKey(label);
    if (columns.find((c) => c.key === key)) { setColError("Column already exists"); return; }
    setColumns((prev) => [...prev, { key, label, type: newColType }]);
    setNewColLabel("");
    setColError("");
  }

  function removeColumn(key: string) {
    setColumns((prev) => prev.filter((c) => c.key !== key));
  }

  function applyPreset(preset: ColumnDef[]) {
    setColumns(preset);
    showSnack("Preset applied", "info");
  }

  // ─── Start insertion ───────────────────────────────────────────────────────
  async function startInsertion() {
    if (columns.length === 0) { showSnack("Add at least one column", "warning"); return; }
    if (insertState === "inserting") return;

    cancelRef.current = false;
    setInserted(0);
    setSpeed(0);
    setEta(0);
    setDmlResult([]);
    setDmlTotal(0);
    setLogs([{ id: logIdRef.current++, text: "Initialising database…", ts: new Date().toLocaleTimeString() }]);

    try {
      await deleteDatabase();
      const db = await openDatabase(columns);
      dbRef.current = db;
    } catch (e) {
      showSnack("Failed to open database: " + (e as Error).message, "error");
      return;
    }

    const t0 = performance.now();
    setStartTime(t0);
    setEndTime(null);
    setInsertState("inserting");
    setColDesignerOpen(false);
    addLog(`Started inserting ${formatIndian(TOTAL_ENTRIES)} records with columns: ${columns.map((c) => c.label).join(", ")}`);

    insertionRef.current = (async () => {
      const db = dbRef.current!;
      let done = 0;
      const total = TOTAL_ENTRIES;
      const batches = Math.ceil(total / BATCH_SIZE);

      for (let b = 0; b < batches; b++) {
        if (cancelRef.current) break;
        const batchStart = b * BATCH_SIZE + 1;
        const batchCount = Math.min(BATCH_SIZE, total - b * BATCH_SIZE);
        const bt0 = performance.now();

        try {
          await insertBatchInline(db, batchStart, batchCount, columns);
        } catch {
          if (cancelRef.current) break;
          addLog(`Batch ${b + 1} error, retrying…`);
          b--;
          await new Promise((r) => setTimeout(r, 300));
          continue;
        }

        done += batchCount;
        const elapsedSec = (performance.now() - t0) / 1000;
        const spd = done / elapsedSec;
        const etaSec = spd ? (total - done) / spd : 0;
        const batchMs = performance.now() - bt0;

        setInserted(done);
        setSpeed(spd);
        setEta(etaSec);

        if ((b + 1) % 5 === 0 || done >= total) {
          addLog(
            `Batch ${b + 1}/${batches} — ${formatIndian(done)} inserted — ${spd.toFixed(0)} rec/s — ETA ${Math.ceil(etaSec)}s — batch ${(batchMs / 1000).toFixed(2)}s`
          );
        }

        // yield to main thread
        await new Promise((r) => setTimeout(r, 0));
      }

      if (!cancelRef.current) {
        const totalMs = performance.now() - t0;
        setEndTime(performance.now());
        setInsertState("done");
        addLog(`✅ Done! ${formatIndian(TOTAL_ENTRIES)} records in ${formatHHMMSS(totalMs)} (${formatDuration(totalMs)})`);
        addLog(`Average speed: ${(TOTAL_ENTRIES / (totalMs / 1000)).toFixed(0)} records/sec`);
        showSnack("1 Crore records inserted successfully! 🎉", "success");

        // load first page for DML
        const total_count = await countRecords(db);
        setDmlTotal(total_count);
        loadDmlPage(0, db);
      }
    })();
  }

  // ─── Cancel insertion ──────────────────────────────────────────────────────
  async function cancelInsertion() {
    cancelRef.current = true;
    setInsertState("idle");
    addLog("Cancelling and clearing IndexedDB…");
    if (dbRef.current) {
      dbRef.current.close();
      dbRef.current = null;
    }
    try {
      await deleteDatabase();
      addLog("IndexedDB cleared.");
      showSnack("Cancelled and IndexedDB cleared", "warning");
    } catch {
      showSnack("Could not clear IndexedDB", "error");
    }
    setInserted(0);
    setSpeed(0);
    setEta(0);
    setDmlResult([]);
    setDmlTotal(0);
    setColDesignerOpen(true);
  }

  // ─── DML: load page (SELECT) ───────────────────────────────────────────────
  async function loadDmlPage(page: number, db?: IDBDatabase) {
    const d = db ?? dbRef.current;
    if (!d) return;
    setDmlLoading(true);
    try {
      const rows = await selectPage(d, page);
      setDmlResult(rows);
      setDmlPage(page);
    } catch (e) {
      showSnack("Error loading data: " + (e as Error).message, "error");
    }
    setDmlLoading(false);
  }

  // ─── DML: custom SELECT by id range ───────────────────────────────────────
  async function handleCustomSelect() {
    if (!dbRef.current) { showSnack("No database open", "error"); return; }
    const from = parseInt(selectFrom);
    const to = parseInt(selectTo);
    if (isNaN(from) || isNaN(to) || from < 1 || to < from) {
      showSnack("Invalid ID range", "warning"); return;
    }
    if (to - from > 9999) { showSnack("Max 10,000 records at once", "warning"); return; }
    setDmlLoading(true);
    try {
      const rows = await selectByIdRange(dbRef.current, from, to);
      setDmlResult(rows);
      showSnack(`${rows.length} records fetched`, "success");
    } catch (e) {
      showSnack("Select error: " + (e as Error).message, "error");
    }
    setDmlLoading(false);
  }

  // ─── DML: UPDATE ──────────────────────────────────────────────────────────
  async function handleUpdate() {
    if (!dbRef.current) { showSnack("No database open", "error"); return; }
    const id = parseInt(updateId);
    if (isNaN(id)) { showSnack("Invalid ID", "warning"); return; }
    if (!updateField) { showSnack("Select field to update", "warning"); return; }
    try {
      await updateRecord(dbRef.current, id, { [updateField]: updateValue });
      showSnack(`Record ${id} updated`, "success");
      addLog(`UPDATE id=${id} SET ${updateField}='${updateValue}'`);
      if (dmlTab === "SELECT") await loadDmlPage(dmlPage);
    } catch (e) {
      showSnack("Update error: " + (e as Error).message, "error");
    }
  }

  // ─── DML: DELETE ──────────────────────────────────────────────────────────
  async function handleDelete(idParam?: number) {
    const id = idParam ?? parseInt(deleteId);
    if (isNaN(id)) { showSnack("Invalid ID", "warning"); return; }
    setConfirmMsg(`Delete record with ID ${id}? This cannot be undone.`);
    setConfirmAction(() => async () => {
      try {
        await deleteRecord(dbRef.current!, id);
        setDmlTotal((t) => t - 1);
        showSnack(`Record ${id} deleted`, "success");
        addLog(`DELETE id=${id}`);
        await loadDmlPage(dmlPage);
      } catch (e) {
        showSnack("Delete error: " + (e as Error).message, "error");
      }
      setConfirmOpen(false);
    });
    setConfirmOpen(true);
  }

  // ─── Edit dialog ───────────────────────────────────────────────────────────
  function openEdit(row: Record<string, unknown>) {
    const vals: Record<string, string> = {};
    columns.forEach((c) => { vals[c.key] = String(row[c.key] ?? ""); });
    setEditValues(vals);
    setEditRow(row);
  }

  async function saveEdit() {
    if (!dbRef.current || !editRow) return;
    const patch: Record<string, unknown> = {};
    columns.forEach((c) => { patch[c.key] = editValues[c.key]; });
    try {
      await updateRecord(dbRef.current, editRow.id as number, patch);
      showSnack(`Record ${editRow.id} saved`, "success");
      addLog(`UPDATE id=${editRow.id} (inline edit)`);
      await loadDmlPage(dmlPage);
    } catch (e) {
      showSnack("Save error: " + (e as Error).message, "error");
    }
    setEditRow(null);
  }

  // ─── Progress ─────────────────────────────────────────────────────────────
  const progress = Math.min(100, (inserted / TOTAL_ENTRIES) * 100);
  const totalPages = Math.ceil(dmlTotal / PAGE_SIZE);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <Navbar />
    <Box sx={{ bgcolor: "#ffffff", minHeight: "100vh", pb: 8 }}>
      {/* ── Header ── */}
      <Box
        sx={{
          bgcolor: "#ffffff",
          borderBottom: "2px solid #000",
          py: { xs: 2, sm: 3 },
          px: { xs: 2, sm: 4 },
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <StorageIcon sx={{ fontSize: { xs: 28, sm: 36 }, color: "#000" }} />
          <Box>
            <Typography
              variant={isMobile ? "h6" : "h5"}
              fontWeight={800}
              color="#000"
              letterSpacing={-0.5}
            >
              1 Crore DB Experiment
            </Typography>
            <Typography variant="caption" color="text.secondary" fontSize={12}>
              Insert · Select · Update · Delete · IndexedDB
            </Typography>
          </Box>
          <Box flex={1} />
          {insertState === "done" && (
            <Chip
              icon={<CheckCircleIcon />}
              label={`${formatIndian(dmlTotal)} records`}
              color="success"
              variant="outlined"
              size={isMobile ? "small" : "medium"}
              sx={{ fontWeight: 700, color: "#000", borderColor: "#000" }}
            />
          )}
        </Stack>
      </Box>

      <Container maxWidth="xl" sx={{ pt: 3, px: { xs: 1, sm: 2, md: 3 } }}>
        <Stack spacing={3}>

          {/* ── Column Designer ── */}
          <Paper
            elevation={0}
            sx={{ border: "1.5px solid #000", borderRadius: 2, overflow: "hidden" }}
          >
            <Box
              sx={{
                px: 3, py: 2,
                bgcolor: "#000",
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                userSelect: "none",
              }}
              onClick={() => setColDesignerOpen((v) => !v)}
            >
              <TuneIcon sx={{ color: "#fff", mr: 1.5 }} />
              <Typography fontWeight={700} color="#fff" flex={1}>
                Step 1 — Design Your Columns
              </Typography>
              {colDesignerOpen ? (
                <KeyboardArrowUp sx={{ color: "#fff" }} />
              ) : (
                <KeyboardArrowDown sx={{ color: "#fff" }} />
              )}
            </Box>

            <Collapse in={colDesignerOpen}>
              <Box sx={{ p: { xs: 2, sm: 3 } }}>
                {/* Presets */}
                <Typography variant="caption" fontWeight={700} color="#000" mb={1} display="block">
                  QUICK PRESETS
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" mb={3}>
                  {["Person (Name, Email)", "Product Catalog", "Orders Table"].map((label, i) => (
                    <Chip
                      key={i}
                      label={label}
                      onClick={() => applyPreset(COLUMN_PRESETS[i])}
                      clickable
                      variant="outlined"
                      size="small"
                      sx={{ borderColor: "#000", color: "#000", fontWeight: 600, mb: 0.5 }}
                    />
                  ))}
                </Stack>

                {/* Current columns */}
                <Typography variant="caption" fontWeight={700} color="#000" mb={1} display="block">
                  COLUMNS ({columns.length})
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" mb={3}>
                  {columns.map((col) => (
                    <Chip
                      key={col.key}
                      label={`${col.label} (${col.type})`}
                      onDelete={() => removeColumn(col.key)}
                      sx={{
                        bgcolor: "#f5f5f5",
                        color: "#000",
                        fontWeight: 600,
                        mb: 0.5,
                        "& .MuiChip-deleteIcon": { color: "#000" },
                      }}
                    />
                  ))}
                  {columns.length === 0 && (
                    <Typography variant="body2" color="error">
                      Add at least one column
                    </Typography>
                  )}
                </Stack>

                {/* Add column */}
                <Stack
                  direction={isMobile ? "column" : "row"}
                  spacing={2}
                  alignItems={isMobile ? "stretch" : "flex-start"}
                >
                  <TextField
                    label="Column Name"
                    value={newColLabel}
                    onChange={(e) => { setNewColLabel(e.target.value); setColError(""); }}
                    onKeyDown={(e) => { if (e.key === "Enter") addColumn(); }}
                    error={!!colError}
                    helperText={colError || "e.g. First Name, Order ID"}
                    size="small"
                    sx={{ flex: 2, "& .MuiOutlinedInput-root": { borderRadius: 1 } }}
                    inputProps={{ style: { color: "#000", fontSize: 15 } }}
                    InputLabelProps={{ style: { color: "#555" } }}
                  />
                  <FormControl size="small" sx={{ flex: 1, minWidth: 130 }}>
                    <InputLabel sx={{ color: "#555" }}>Type</InputLabel>
                    <Select
                      value={newColType}
                      label="Type"
                      onChange={(e) => setNewColType(e.target.value as ColumnDef["type"])}
                      sx={{ color: "#000" }}
                    >
                      <MenuItem value="text">Text</MenuItem>
                      <MenuItem value="number">Number</MenuItem>
                      <MenuItem value="email">Email</MenuItem>
                      <MenuItem value="date">Date</MenuItem>
                    </Select>
                  </FormControl>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={addColumn}
                    sx={{
                      bgcolor: "#000",
                      color: "#fff",
                      fontWeight: 700,
                      borderRadius: 1,
                      "&:hover": { bgcolor: "#222" },
                      height: 40,
                      alignSelf: isMobile ? "flex-end" : "flex-start",
                      mt: isMobile ? 0 : 0.25,
                    }}
                  >
                    Add Column
                  </Button>
                </Stack>
              </Box>
            </Collapse>
          </Paper>

          {/* ── Control Panel ── */}
          <Paper
            elevation={0}
            sx={{ border: "1.5px solid #000", borderRadius: 2, overflow: "hidden" }}
          >
            <Box sx={{ bgcolor: "#000", px: 3, py: 2 }}>
              <Typography fontWeight={700} color="#fff">
                Step 2 — Insert 1 Crore Records
              </Typography>
            </Box>
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
              {/* Action buttons */}
              <Stack direction={isMobile ? "column" : "row"} spacing={2} mb={3}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={
                    insertState === "inserting" ? (
                      <CircularProgress size={18} sx={{ color: "#fff" }} />
                    ) : insertState === "done" ? (
                      <CheckCircleIcon />
                    ) : (
                      <PlayArrowIcon />
                    )
                  }
                  onClick={startInsertion}
                  disabled={insertState === "inserting" || insertState === "done"}
                  sx={{
                    bgcolor: insertState === "done" ? "#2e7d32" : "#000",
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: 16,
                    borderRadius: 1,
                    py: 1.5,
                    flex: 1,
                    "&:hover": { bgcolor: insertState === "done" ? "#1b5e20" : "#222" },
                    "&.Mui-disabled": { bgcolor: "#888", color: "#fff" },
                  }}
                >
                  {insertState === "idle"
                    ? "Start Insert 1Cr Records"
                    : insertState === "inserting"
                    ? "Inserting…"
                    : "Completed ✓"}
                </Button>

                {insertState === "inserting" && (
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<CancelIcon />}
                    onClick={() => {
                      setConfirmMsg("Cancel insertion? IndexedDB will be cleared immediately.");
                      setConfirmAction(() => cancelInsertion);
                      setConfirmOpen(true);
                    }}
                    sx={{
                      borderColor: "#d32f2f",
                      color: "#d32f2f",
                      fontWeight: 700,
                      fontSize: 16,
                      borderRadius: 1,
                      py: 1.5,
                      "&:hover": { bgcolor: "#fde8e8", borderColor: "#d32f2f" },
                    }}
                  >
                    Cancel &amp; Clear DB
                  </Button>
                )}

                {insertState === "done" && (
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<RefreshIcon />}
                    onClick={() => {
                      setConfirmMsg("Reset experiment? All 1Cr records will be deleted.");
                      setConfirmAction(() => async () => {
                        setConfirmOpen(false);
                        await cancelInsertion();
                        setInsertState("idle");
                        setColDesignerOpen(true);
                      });
                      setConfirmOpen(true);
                    }}
                    sx={{
                      borderColor: "#000",
                      color: "#000",
                      fontWeight: 700,
                      borderRadius: 1,
                      py: 1.5,
                    }}
                  >
                    Reset
                  </Button>
                )}
              </Stack>

              {/* Progress */}
              {insertState !== "idle" && (
                <Fade in>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" mb={0.5}>
                      <Typography variant="body2" fontWeight={700} color="#000">
                        {formatIndian(inserted)} / {formatIndian(TOTAL_ENTRIES)}
                      </Typography>
                      <Typography variant="body2" color="#000">
                        {progress.toFixed(2)}%
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={progress}
                      sx={{
                        height: 12,
                        borderRadius: 6,
                        bgcolor: "#f0f0f0",
                        "& .MuiLinearProgress-bar": { bgcolor: "#000", borderRadius: 6 },
                        mb: 2,
                      }}
                    />

                    {/* Stats grid */}
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: isMobile
                          ? "1fr 1fr"
                          : "repeat(4, 1fr)",
                        gap: 2,
                        mb: 2,
                      }}
                    >
                      {[
                        {
                          label: "Elapsed",
                          value: formatHHMMSS(startTime ? performance.now() - startTime : 0),
                        },
                        {
                          label: "Speed",
                          value: `${speed.toFixed(0)} rec/s`,
                        },
                        {
                          label: "ETA",
                          value: insertState === "done" ? "—" : `${Math.ceil(eta)}s`,
                        },
                        {
                          label: "Batches",
                          value: `${Math.floor(inserted / BATCH_SIZE)} / ${Math.ceil(TOTAL_ENTRIES / BATCH_SIZE)}`,
                        },
                      ].map((stat) => (
                        <Paper
                          key={stat.label}
                          elevation={0}
                          sx={{
                            border: "1px solid #e0e0e0",
                            borderRadius: 1.5,
                            p: 1.5,
                            textAlign: "center",
                          }}
                        >
                          <Typography variant="caption" color="text.secondary" display="block">
                            {stat.label}
                          </Typography>
                          <Typography fontWeight={800} fontSize={17} color="#000">
                            {stat.value}
                          </Typography>
                        </Paper>
                      ))}
                    </Box>

                    {startTime && endTime && (
                      <Paper
                        elevation={0}
                        sx={{ bgcolor: "#f9f9f9", border: "1px solid #e0e0e0", borderRadius: 1.5, p: 2, mb: 2 }}
                      >
                        <Typography variant="body2" color="#000" fontWeight={600}>
                          📊 Total Duration:{" "}
                          <strong>{formatHHMMSS(endTime - startTime)}</strong> (
                          {formatDuration(endTime - startTime)}) &nbsp;|&nbsp; Avg:{" "}
                          <strong>
                            {(TOTAL_ENTRIES / ((endTime - startTime) / 1000)).toFixed(0)} rec/s
                          </strong>
                        </Typography>
                      </Paper>
                    )}
                  </Box>
                </Fade>
              )}

              {/* Log window */}
              <Typography variant="caption" fontWeight={700} color="#000" mb={0.5} display="block">
                LIVE LOG
              </Typography>
              <Box
                sx={{
                  bgcolor: "#fafafa",
                  border: "1px solid #e0e0e0",
                  borderRadius: 1.5,
                  p: 2,
                  height: { xs: 160, sm: 200 },
                  overflowY: "auto",
                  fontFamily: "monospace",
                }}
              >
                {logs.map((l) => (
                  <Box key={l.id} sx={{ fontSize: 12, color: "#000", lineHeight: 1.7 }}>
                    {l.ts && (
                      <Box component="span" sx={{ color: "#999", mr: 1 }}>
                        [{l.ts}]
                      </Box>
                    )}
                    {l.text}
                  </Box>
                ))}
                <div ref={logsEndRef} />
              </Box>
            </Box>
          </Paper>

          {/* ── DML Operations ── */}
          {insertState === "done" && (
            <Fade in>
              <Paper
                elevation={0}
                sx={{ border: "1.5px solid #000", borderRadius: 2, overflow: "hidden" }}
              >
                <Box sx={{ bgcolor: "#000", px: 3, py: 2 }}>
                  <Typography fontWeight={700} color="#fff">
                    Step 3 — DML Operations on IndexedDB
                  </Typography>
                </Box>

                {/* Tab row */}
                <Stack
                  direction="row"
                  sx={{ borderBottom: "1.5px solid #000" }}
                >
                  {(["SELECT", "UPDATE", "DELETE"] as DmlOperation[]).map((op) => (
                    <Button
                      key={op}
                      onClick={() => setDmlTab(op)}
                      sx={{
                        flex: 1,
                        borderRadius: 0,
                        py: 1.5,
                        fontWeight: 800,
                        fontSize: 14,
                        color: dmlTab === op ? "#fff" : "#000",
                        bgcolor: dmlTab === op ? "#000" : "transparent",
                        borderRight: op !== "DELETE" ? "1px solid #e0e0e0" : "none",
                        "&:hover": { bgcolor: dmlTab === op ? "#222" : "#f5f5f5" },
                      }}
                    >
                      {op === "SELECT" && <SearchIcon sx={{ mr: 0.5, fontSize: 18 }} />}
                      {op === "UPDATE" && <EditIcon sx={{ mr: 0.5, fontSize: 18 }} />}
                      {op === "DELETE" && <DeleteIcon sx={{ mr: 0.5, fontSize: 18 }} />}
                      {op}
                    </Button>
                  ))}
                </Stack>

                <Box sx={{ p: { xs: 2, sm: 3 } }}>
                  {/* SELECT */}
                  {dmlTab === "SELECT" && (
                    <Box>
                      <Stack
                        direction={isMobile ? "column" : "row"}
                        spacing={2}
                        alignItems={isMobile ? "stretch" : "flex-end"}
                        mb={2}
                      >
                        <TextField
                          label="From ID"
                          value={selectFrom}
                          onChange={(e) => setSelectFrom(e.target.value)}
                          size="small"
                          type="number"
                          sx={{ width: isMobile ? "100%" : 130 }}
                          inputProps={{ style: { color: "#000" } }}
                          InputLabelProps={{ style: { color: "#555" } }}
                        />
                        <TextField
                          label="To ID"
                          value={selectTo}
                          onChange={(e) => setSelectTo(e.target.value)}
                          size="small"
                          type="number"
                          sx={{ width: isMobile ? "100%" : 130 }}
                          inputProps={{ style: { color: "#000" } }}
                          InputLabelProps={{ style: { color: "#555" } }}
                        />
                        <Button
                          variant="contained"
                          startIcon={<SearchIcon />}
                          onClick={handleCustomSelect}
                          sx={{
                            bgcolor: "#000",
                            color: "#fff",
                            fontWeight: 700,
                            borderRadius: 1,
                            "&:hover": { bgcolor: "#222" },
                          }}
                        >
                          Query
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<RefreshIcon />}
                          onClick={() => loadDmlPage(0)}
                          sx={{ borderColor: "#000", color: "#000", fontWeight: 700, borderRadius: 1 }}
                        >
                          Browse
                        </Button>
                        <Typography variant="body2" color="text.secondary" sx={{ ml: "auto" }}>
                          {formatIndian(dmlTotal)} total records
                        </Typography>
                      </Stack>
                    </Box>
                  )}

                  {/* UPDATE */}
                  {dmlTab === "UPDATE" && (
                    <Stack
                      direction={isMd ? "column" : "row"}
                      spacing={2}
                      alignItems={isMd ? "stretch" : "flex-end"}
                      mb={2}
                    >
                      <TextField
                        label="Record ID"
                        value={updateId}
                        onChange={(e) => setUpdateId(e.target.value)}
                        size="small"
                        type="number"
                        sx={{ width: isMd ? "100%" : 140 }}
                        inputProps={{ style: { color: "#000" } }}
                        InputLabelProps={{ style: { color: "#555" } }}
                      />
                      <FormControl size="small" sx={{ minWidth: 160 }}>
                        <InputLabel sx={{ color: "#555" }}>Field</InputLabel>
                        <Select
                          value={updateField}
                          label="Field"
                          onChange={(e) => setUpdateField(e.target.value)}
                          sx={{ color: "#000" }}
                        >
                          {columns.map((c) => (
                            <MenuItem key={c.key} value={c.key}>
                              {c.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <TextField
                        label="New Value"
                        value={updateValue}
                        onChange={(e) => setUpdateValue(e.target.value)}
                        size="small"
                        sx={{ flex: 1 }}
                        inputProps={{ style: { color: "#000" } }}
                        InputLabelProps={{ style: { color: "#555" } }}
                      />
                      <Button
                        variant="contained"
                        startIcon={<EditIcon />}
                        onClick={handleUpdate}
                        sx={{
                          bgcolor: "#000",
                          color: "#fff",
                          fontWeight: 700,
                          borderRadius: 1,
                          "&:hover": { bgcolor: "#222" },
                        }}
                      >
                        Update
                      </Button>
                    </Stack>
                  )}

                  {/* DELETE */}
                  {dmlTab === "DELETE" && (
                    <Stack
                      direction={isMobile ? "column" : "row"}
                      spacing={2}
                      alignItems={isMobile ? "stretch" : "flex-end"}
                      mb={2}
                    >
                      <TextField
                        label="Record ID to Delete"
                        value={deleteId}
                        onChange={(e) => setDeleteId(e.target.value)}
                        size="small"
                        type="number"
                        sx={{ width: isMobile ? "100%" : 220 }}
                        inputProps={{ style: { color: "#000" } }}
                        InputLabelProps={{ style: { color: "#555" } }}
                      />
                      <Button
                        variant="contained"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDelete()}
                        sx={{
                          bgcolor: "#d32f2f",
                          color: "#fff",
                          fontWeight: 700,
                          borderRadius: 1,
                          "&:hover": { bgcolor: "#b71c1c" },
                        }}
                      >
                        Delete
                      </Button>
                    </Stack>
                  )}

                  <Divider sx={{ my: 2 }} />

                  {/* Data table */}
                  {dmlLoading ? (
                    <Box sx={{ textAlign: "center", py: 4 }}>
                      <CircularProgress sx={{ color: "#000" }} />
                      <Typography mt={2} color="#000">
                        Loading records…
                      </Typography>
                    </Box>
                  ) : dmlResult.length === 0 ? (
                    <Box
                      sx={{
                        textAlign: "center",
                        py: 6,
                        border: "1px dashed #ccc",
                        borderRadius: 1.5,
                      }}
                    >
                      <Typography color="text.secondary">
                        No records to display. Use Browse or Query above.
                      </Typography>
                    </Box>
                  ) : (
                    <Box>
                      <TableContainer
                        sx={{
                          border: "1px solid #e0e0e0",
                          borderRadius: 1.5,
                          maxHeight: { xs: 320, sm: 480 },
                          overflowY: "auto",
                        }}
                      >
                        <Table size="small" stickyHeader>
                          <TableHead>
                            <TableRow>
                              <TableCell
                                sx={{
                                  fontWeight: 800,
                                  bgcolor: "#f5f5f5",
                                  color: "#000",
                                  fontSize: 13,
                                  borderBottom: "2px solid #000",
                                }}
                              >
                                ID
                              </TableCell>
                              {columns.map((col) => (
                                <TableCell
                                  key={col.key}
                                  sx={{
                                    fontWeight: 800,
                                    bgcolor: "#f5f5f5",
                                    color: "#000",
                                    fontSize: 13,
                                    borderBottom: "2px solid #000",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {col.label}
                                </TableCell>
                              ))}
                              <TableCell
                                sx={{
                                  fontWeight: 800,
                                  bgcolor: "#f5f5f5",
                                  color: "#000",
                                  fontSize: 13,
                                  borderBottom: "2px solid #000",
                                  width: 90,
                                }}
                              >
                                Actions
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {dmlResult.map((row) => (
                              <TableRow
                                key={String(row.id)}
                                hover
                                sx={{ "&:hover": { bgcolor: "#f9f9f9" } }}
                              >
                                <TableCell sx={{ color: "#000", fontWeight: 600, fontSize: 13 }}>
                                  {String(row.id)}
                                </TableCell>
                                {columns.map((col) => (
                                  <TableCell
                                    key={col.key}
                                    sx={{
                                      color: "#000",
                                      fontSize: 13,
                                      maxWidth: 180,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {String(row[col.key] ?? "")}
                                  </TableCell>
                                ))}
                                <TableCell>
                                  <Stack direction="row" spacing={0.5}>
                                    <Tooltip title="Edit">
                                      <IconButton
                                        size="small"
                                        onClick={() => openEdit(row)}
                                        sx={{ color: "#000" }}
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleDelete(row.id as number)}
                                        sx={{ color: "#d32f2f" }}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </Stack>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>

                      {/* Pagination */}
                      {dmlTab === "SELECT" && totalPages > 1 && (
                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent="center"
                          alignItems="center"
                          mt={2}
                        >
                          <IconButton
                            onClick={() => loadDmlPage(0)}
                            disabled={dmlPage === 0}
                            sx={{ color: "#000" }}
                          >
                            <NavigateBefore />
                          </IconButton>
                          <IconButton
                            onClick={() => loadDmlPage(dmlPage - 1)}
                            disabled={dmlPage === 0}
                            sx={{ color: "#000" }}
                          >
                            <NavigateBefore />
                          </IconButton>
                          <Typography variant="body2" fontWeight={700} color="#000" minWidth={120} textAlign="center">
                            Page {dmlPage + 1} / {totalPages}
                          </Typography>
                          <IconButton
                            onClick={() => loadDmlPage(dmlPage + 1)}
                            disabled={dmlPage >= totalPages - 1}
                            sx={{ color: "#000" }}
                          >
                            <NavigateNext />
                          </IconButton>
                          <IconButton
                            onClick={() => loadDmlPage(totalPages - 1)}
                            disabled={dmlPage >= totalPages - 1}
                            sx={{ color: "#000" }}
                          >
                            <NavigateNext />
                          </IconButton>
                        </Stack>
                      )}
                    </Box>
                  )}
                </Box>
              </Paper>
            </Fade>
          )}
        </Stack>
      </Container>

      {/* ── Edit Dialog ── */}
      <Dialog
        open={!!editRow}
        onClose={() => setEditRow(null)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 2, border: "1.5px solid #000" } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#000", borderBottom: "1px solid #e0e0e0" }}>
          Edit Record #{String(editRow?.id)}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2} mt={1}>
            {columns.map((col) => (
              <TextField
                key={col.key}
                label={col.label}
                value={editValues[col.key] ?? ""}
                onChange={(e) =>
                  setEditValues((v) => ({ ...v, [col.key]: e.target.value }))
                }
                fullWidth
                size="small"
                type={col.type === "number" ? "number" : col.type === "date" ? "date" : "text"}
                InputLabelProps={{ shrink: true, style: { color: "#555" } }}
                inputProps={{ style: { color: "#000" } }}
              />
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: "1px solid #e0e0e0" }}>
          <Button onClick={() => setEditRow(null)} sx={{ color: "#000", fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={saveEdit}
            sx={{ bgcolor: "#000", color: "#fff", fontWeight: 700, borderRadius: 1, "&:hover": { bgcolor: "#222" } }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Confirm Dialog ── */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        PaperProps={{ sx: { borderRadius: 2, border: "1.5px solid #000" } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#000" }}>Confirm Action</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: "#000" }}>{confirmMsg}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmOpen(false)} sx={{ color: "#000", fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={confirmAction}
            sx={{ bgcolor: "#d32f2f", color: "#fff", fontWeight: 700, borderRadius: 1, "&:hover": { bgcolor: "#b71c1c" } }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ── */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snack.severity}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          sx={{ fontWeight: 700, color: "#000", fontSize: 14, border: "1px solid #ccc" }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
   </>
  );
}