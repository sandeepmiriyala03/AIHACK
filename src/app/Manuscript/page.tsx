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

// 🛠️ OCR ENGINE CONFIGURATION
env.allowLocalModels = true;
env.localModelPath = "/models/"; 
env.allowRemoteModels = true; 
env.useBrowserCache = true;
env.backends.onnx.wasm.proxy = true; 
env.backends.onnx.wasm.numThreads = 1;

// Define specific types to satisfy ESLint
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
    setStatus("Waking up Microsoft TrOCR...");

    try {
      if (!worker.current) {
        // This explicitly loads the Microsoft Transformer-based OCR
        worker.current = await pipeline(
          "image-to-text",
          "Xenova/trocr-base-handwritten", 
          {
            quantized: true,
            progress_callback: (data: ProgressData) => {
              if (data.status === 'downloading') {
                setStatus(`Loading AI Weights: ${Math.round(data.progress || 0)}%`);
                setProgress(Math.round(data.progress || 0));
              } else if (data.status === 'ready') {
                setStatus("AI Engine Ready!");
                setProgress(100);
              }
            }
          }
        ) as ImageToTextPipeline;
      }

      setStatus("Analyzing Handwriting...");
      
      // TrOCR processing happens here
      const result = await worker.current(preview);
      
      const output = result as unknown as MicrosoftOCRResult[];
      const extractedText = output[0]?.generated_text;

      if (extractedText) {
        setText(extractedText);
        setStatus("Conversion Complete!");
      } else {
        setError("Microsoft TrOCR couldn't resolve the text in this image.");
      }
    } catch (err: unknown) {
      console.error("Microsoft OCR Error:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(`OCR Engine Error: ${errMsg}`);
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
    a.download = "microsoft_ocr_output.txt";
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
            Advanced Handwritten Recognition powered by Transformers.js
          </Typography>
        </Box>

        <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
          <Stack spacing={3}>
            <Button variant="outlined" component="label" fullWidth size="large" sx={{ borderRadius: 2 }}>
              {file ? "Change Manuscript" : "Upload Handwriting Sample"}
              <input hidden type="file" accept="image/*" onChange={handleFileChange} />
            </Button>

            {preview && (
              <Box sx={{ textAlign: 'center', bgcolor: 'grey.50', p: 2, borderRadius: 2, border: '1px dashed #ccc' }}>
                <Box component="img" src={preview} sx={{ maxHeight: 300, maxWidth: '100%', borderRadius: 1, boxShadow: 1 }} />
              </Box>
            )}

            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={runMicrosoftOCR}
              disabled={loading || !file}
              size="large"
              sx={{ py: 1.5, fontWeight: 'bold' }}
            >
              {loading ? "AI is Thinking..." : "Start Microsoft OCR"}
            </Button>

            {loading && (
              <Box>
                <LinearProgress variant="determinate" value={progress} color="primary" sx={{ height: 10, borderRadius: 5 }} />
                <Typography variant="caption" display="block" textAlign="center" sx={{ mt: 1, fontWeight: 'medium' }}>
                  {status}
                </Typography>
              </Box>
            )}

            {error && <Alert severity="error" variant="outlined">{error}</Alert>}

            {text && (
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="subtitle2" color="primary">Detected Text:</Typography>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Copy Text"><IconButton onClick={copyToClipboard} size="small"><ContentCopyIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Download .txt"><IconButton onClick={downloadText} size="small"><DownloadIcon fontSize="small" /></IconButton></Tooltip>
                  </Stack>
                </Stack>
                <TextField
                  multiline
                  fullWidth
                  minRows={6}
                  value={text}
                  variant="filled"
                  onChange={(e) => setText(e.target.value)}
                  sx={{ bgcolor: '#f9f9f9' }}
                />
              </Box>
            )}

            <Button startIcon={<DeleteSweepIcon />} color="inherit" onClick={resetAll} sx={{ alignSelf: 'center', opacity: 0.7 }}>
              Clear Canvas
            </Button>
          </Stack>
        </Paper>
      </Box>
    </>
  );
}