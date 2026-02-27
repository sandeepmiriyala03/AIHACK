"use client";

import { useState, useRef, ChangeEvent } from "react";
import Navbar from "@/components/Navbar";
import {
  Button, TextField, Stack, Typography, Box, LinearProgress,
  Paper, Tooltip, IconButton, Alert
} from "@mui/material";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { pipeline, env, type ImageToTextPipeline } from "@xenova/transformers";

// 🛠️ ENGINE CONFIGURATION
env.allowLocalModels = true;
env.localModelPath = "/models/"; 
env.allowRemoteModels = true; 
env.useBrowserCache = true;
env.backends.onnx.wasm.proxy = true; 
env.backends.onnx.wasm.numThreads = 1;

interface ProgressData {
  status: string;
  file: string;
  progress?: number;
}

interface MicrosoftOCRResult {
  generated_text: string;
}

export default function MicrosoftOCRPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [text, setText] = useState("");

  const worker = useRef<ImageToTextPipeline | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setText("");
      setError("");
      setStatus("");
      setProgress(0);
    }
  };

  const runMicrosoftOCR = async () => {
    if (!file || !preview) {
      setError("Please upload an image first.");
      return;
    }

    setLoading(true);
    setError("");
    setStatus("Loading Microsoft TrOCR...");

    try {
      if (!worker.current) {
        // We use the Xenova path because that is what Transformers.js expects
        worker.current = await pipeline(
          "image-to-text",
          "Xenova/trocr-base-handwritten", 
          {
            quantized: true,
            progress_callback: (data: ProgressData) => {
              if (data.status === 'downloading') {
                setStatus(`Loading Weights: ${Math.round(data.progress || 0)}%`);
                setProgress(Math.round(data.progress || 0));
              } else if (data.status === 'ready') {
                setStatus("AI Engine Ready!");
                setProgress(100);
              }
            }
          }
        ) as ImageToTextPipeline;
      }

      setStatus("Reading Manuscript...");
      const result = await worker.current(preview);
      
      const output = result as unknown as MicrosoftOCRResult[];
      const extractedText = output[0]?.generated_text;

      if (extractedText) {
        setText(extractedText);
        setStatus("Success!");
      } else {
        setError("AI could not extract text. Please ensure the folder is 'public/models/Xenova'.");
      }
    } catch (err: unknown) {
      console.error("OCR Error:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(`System Error: ${errMsg}. Ensure local folder is renamed to 'Xenova'.`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (text) navigator.clipboard.writeText(text);
  };

  const downloadText = () => {
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "ocr_output.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetAll = () => {
    setFile(null);
    setPreview(null);
    setText("");
    setError("");
    setStatus("");
    setProgress(0);
  };

  return (
    <>
      <Navbar />
      <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" fontWeight="bold" color="primary.main">
            ✍️ Microsoft TrOCR Integration
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Secure, browser-side handwriting recognition.
          </Typography>
        </Box>

        <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
          <Stack spacing={3}>
            <Button variant="outlined" component="label" fullWidth size="large">
              {file ? "Change Image" : "Upload Handwriting Sample"}
              <input hidden type="file" accept="image/*" onChange={handleFileChange} />
            </Button>

            {preview && (
              <Box sx={{ textAlign: 'center', bgcolor: 'grey.50', p: 2, borderRadius: 2 }}>
                <Box component="img" src={preview} sx={{ maxHeight: 300, maxWidth: '100%', borderRadius: 1 }} />
              </Box>
            )}

            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={runMicrosoftOCR}
              disabled={loading || !file}
              size="large"
            >
              {loading ? "AI is Processing..." : "Start Microsoft OCR"}
            </Button>

            {loading && (
              <Box>
                <LinearProgress variant="determinate" value={progress} color="primary" sx={{ height: 8, borderRadius: 5 }} />
                <Typography variant="caption" display="block" textAlign="center" sx={{ mt: 1 }}>
                  {status} ({progress}%)
                </Typography>
              </Box>
            )}

            {error && <Alert severity="error">{error}</Alert>}

            {text && (
              <Box>
                <Stack direction="row" justifyContent="space-between" mb={1}>
                  <Typography variant="overline" fontWeight="bold">Result:</Typography>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Copy"><IconButton onClick={copyToClipboard} size="small"><ContentCopyIcon /></IconButton></Tooltip>
                    <Tooltip title="Download"><IconButton onClick={downloadText} size="small"><DownloadIcon /></IconButton></Tooltip>
                  </Stack>
                </Stack>
                <TextField
                  multiline
                  fullWidth
                  minRows={5}
                  value={text}
                  variant="filled"
                  onChange={(e) => setText(e.target.value)}
                  sx={{ bgcolor: 'white' }}
                />
              </Box>
            )}

            <Button startIcon={<DeleteSweepIcon />} color="error" onClick={resetAll} sx={{ alignSelf: 'center' }}>
              Clear
            </Button>
          </Stack>
        </Paper>
      </Box>
    </>
  );
}