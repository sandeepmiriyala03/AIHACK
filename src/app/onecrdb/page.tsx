"use client";

import { useState, useRef } from "react";
import Navbar from "@/components/Navbar";

// MUI
import {
  Box,
  Button,
  TextField,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Chip,
  Stack,
  Divider,
} from "@mui/material";

// Icons
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import AddIcon from "@mui/icons-material/Add";
import StorageIcon from "@mui/icons-material/Storage";
import SpeedIcon from "@mui/icons-material/Speed";
import DataObjectIcon from "@mui/icons-material/DataObject";

type Column = {
  name: string;
  type: "string" | "number";
};

const DB_NAME = "DynamicDB";
const STORE_NAME = "records";
const TOTAL = 10_000_000;
const BATCH = 50_000;
const PAGE_SIZE = 5000;

export default function Page() {
  const [columns, setColumns] = useState<Column[]>([]);
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [count, setCount] = useState(0);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [data, setData] = useState<any[]>([]);

  const workerRef = useRef<Worker | null>(null);
  const startTimeRef = useRef<number>(0);

  const $openDB = (): Promise<IDBDatabase> =>
    new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onsuccess = (e) =>
        resolve((e.target as IDBOpenDBRequest).result);
      req.onerror = (e) =>
        reject((e.target as IDBOpenDBRequest).error);
    });

  const addColumn = () => {
    if (!input.trim()) return;
    setColumns([...columns, { name: input.trim(), type: "string" }]);
    setInput("");
  };

  const startInsert = () => {
    if (columns.length === 0) return;

    const worker = new Worker("/insertWorker.js");
    workerRef.current = worker;

    setRunning(true);
    setProgress(0);
    setCount(0);
    startTimeRef.current = performance.now();

    worker.postMessage({ DB_NAME, STORE_NAME, TOTAL, BATCH, columns });

    worker.onmessage = (e) => {
      if (e.data.inserted) {
        setCount(e.data.inserted);
        setProgress((e.data.inserted / TOTAL) * 100);
      }

      if (e.data.done) {
        setRunning(false);
        worker.terminate();

        const pages = Math.ceil(TOTAL / PAGE_SIZE);
        setTotalPages(pages);

        loadPage(0);
      }
    };
  };

  const cancelInsert = () => {
    workerRef.current?.terminate();
    workerRef.current = null;
    setRunning(false);
    indexedDB.deleteDatabase(DB_NAME);
  };

  const loadPage = async (pageNumber: number) => {
    const db = await $openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);

    const start = pageNumber * PAGE_SIZE + 1;
    const end = (pageNumber + 1) * PAGE_SIZE;

    const range = IDBKeyRange.bound(start, end);
    const req = store.openCursor(range);

    const result: any[] = [];

    return new Promise<void>((resolve) => {
      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest).result;
        if (cursor) {
          result.push(cursor.value);
          cursor.continue();
        } else {
          setData(result);
          setPage(pageNumber);
          resolve();
        }
      };
    });
  };

  const getETA = () => {
    if (!count) return "--";
    const elapsed = (performance.now() - startTimeRef.current) / 1000;
    const speed = count / elapsed;
    const remaining = (TOTAL - count) / speed;
    return `${Math.floor(remaining)} sec`;
  };

  return (
    <>
      <Navbar />

      <Box p={3}>
        <Typography variant="h3" fontWeight="bold" mb={4}>
          Data Generator Dashboard
        </Typography>

<Card sx={{ mb: 3 }}>
  <CardContent>
    {/* Header */}
    <Stack direction="row" spacing={1} alignItems="center" mb={2}>
    
      <Typography variant="h6" fontWeight="bold">
        About This Tool
      </Typography>
    </Stack>

    {/* About */}
    <Typography variant="body2" mb={2}>
      This tool allows you to generate a large dataset (up to{" "}
      <b>1 Crore records</b>) dynamically in your browser using IndexedDB.
      You can define your own column names like <b>empname</b>,{" "}
      <b>surname</b>, <b>age</b> and the system will automatically generate
      and store data locally.
    </Typography>

    {/* Privacy Highlight */}
    <Typography variant="body2" color="success.main" mb={2}>
      🔒 We do NOT store or send any data to any server. Everything stays
      securely in your browser.
    </Typography>

    <Divider sx={{ my: 2 }} />

    {/* Grid Layout */}
    <Grid container spacing={2}>
      {/* How it works */}
      <Grid item xs={12} md={4}>
        <Typography fontWeight="bold" mb={1}>
          ⚙️ How It Works
        </Typography>
        <ul style={{ paddingLeft: 18, margin: 0 }}>
          <li>Define custom columns</li>
          <li>Click Start to generate data</li>
          <li>Worker inserts data in batches</li>
          <li>Track progress & ETA</li>
          <li>View data using pagination</li>
        </ul>
      </Grid>

      {/* How to use */}
      <Grid item xs={12} md={4}>
        <Typography fontWeight="bold" mb={1}>
          🧭 How To Use
        </Typography>
        <ol style={{ paddingLeft: 18, margin: 0 }}>
          <li>Add column names</li>
          <li>Click Start</li>
          <li>Monitor progress</li>
          <li>View data after completion</li>
          <li>Use pagination</li>
          <li>Cancel anytime if needed</li>
        </ol>
      </Grid>

      {/* Notes */}
      <Grid item xs={12} md={4}>
        <Typography fontWeight="bold" mb={1}>
          ⚠️ Important Notes
        </Typography>
        <ul style={{ paddingLeft: 18, margin: 0 }}>
          <li>Runs fully in browser</li>
          <li>No backend required</li>
          <li>Large data may take time</li>
          <li>Do not close during insert</li>
          <li>Cancel clears all data</li>
        </ul>
      </Grid>
    </Grid>
  </CardContent>
</Card>

        {/* KPI CARDS */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center">
                  <StorageIcon color="primary" />
                  <Typography>Inserted</Typography>
                </Stack>
                <Typography variant="h5">
                  {count.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={1}>
                  <SpeedIcon color="success" />
                  <Typography>ETA</Typography>
                </Stack>
                <Typography variant="h5">{getETA()}</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={1}>
                  <DataObjectIcon color="secondary" />
                  <Typography>Columns</Typography>
                </Stack>
                <Typography variant="h5">
                  {columns.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* COLUMN BUILDER */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography fontWeight="bold" mb={1}>
              🧱 Build Schema
            </Typography>

            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="Column name"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={addColumn}
              >
                Add
              </Button>
            </Stack>

            <Stack direction="row" spacing={1} mt={2} flexWrap="wrap">
              {columns.map((c, i) => (
                <Chip key={i} label={c.name} />
              ))}
            </Stack>
          </CardContent>
        </Card>

        {/* CONTROLS */}
        <Stack direction="row" spacing={2} mb={3}>
          <Button
            variant="contained"
            color="success"
            startIcon={<PlayArrowIcon />}
            onClick={startInsert}
            disabled={running}
          >
            Start
          </Button>

          <Button
            variant="contained"
            color="error"
            startIcon={<StopIcon />}
            onClick={cancelInsert}
            disabled={!running}
          >
            Cancel
          </Button>
        </Stack>

        {/* PROGRESS */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography fontWeight="bold">Progress</Typography>
            <LinearProgress variant="determinate" value={progress} />
            <Typography mt={1}>{progress.toFixed(2)}%</Typography>
          </CardContent>
        </Card>

        {/* TABLE */}
        {totalPages > 0 && (
          <Card>
            <CardContent>
              <Typography fontWeight="bold">
                Page {page + 1} / {totalPages}
              </Typography>

              <Stack direction="row" spacing={1} mt={1}>
                <Button onClick={() => loadPage(0)}>First</Button>
                <Button onClick={() => loadPage(page - 1)}>Prev</Button>
                <Button onClick={() => loadPage(page + 1)}>Next</Button>
                <Button onClick={() => loadPage(totalPages - 1)}>
                  Last
                </Button>
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ overflowX: "auto" }}>
                <table style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      {columns.map((c, i) => (
                        <th key={i}>{c.name}</th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {data.map((row, i) => (
                      <tr key={i}>
                        <td>{row.id}</td>
                        {columns.map((c, j) => (
                          <td key={j}>{row[c.name]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    </>
  );
}