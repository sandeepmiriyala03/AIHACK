"use client";

import { useState, useRef, ChangeEvent } from "react";
import Navbar from "@/components/Navbar";
import {
  Button, TextField, Stack, Typography, Box, LinearProgress,
  Paper, Divider, Chip, Alert, IconButton, Tooltip
} from "@mui/material";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { pipeline, env, type ImageToTextPipeline } from "@xenova/transformers";

// 🛠️ CRITICAL CONFIG FOR 1GB+ MODELS
env.allowRemoteModels = false;
env.localModelPath = "/models/";
env.useBrowserCache = true;

// This helps the browser handle large memory offsets for the 1GB decoder
env.backends.onnx.wasm.numThreads = 1; 

export default function MicrosoftOCRPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
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
    }
  };

  const runOCR = async () => {
    if (!file || !preview) {
      setError("Please upload an image first.");
      return;
    }

    setLoading(true);
    setError("");
    setStatus("Initializing AI (1.3GB)...");

    try {
      if (!worker.current) {
        // Since your files are NOT named '_quantized.onnx', keep quantized: false
        worker.current = await pipeline(
          "image-to-text", 
          "microsoft/trocr-base-handwritten", 
          { 
            quantized: false,
          }
        ) as ImageToTextPipeline;
      }

      setStatus("Analyzing Manuscript...");
      const result = await worker.current(preview);
      
      // FIX: Cast result to satisfy TypeScript
      const output = result as unknown as Array<{ generated_text: string }>;

      if (Array.isArray(output) && output.length > 0 && output[0].generated_text) {
        setText(output[0].generated_text);
        setStatus("Complete!");
      } else {
        setError("AI could not read text from this image.");
      }
    } catch (err: unknown) {
      console.error("Full Error Info:", err);
      const msg = err instanceof Error ? err.message : String(err);
      
      if (msg.includes("bounds") || msg.includes("offset")) {
        setError("Memory Error: The 1GB model is too large for this browser tab. Try closing other apps/tabs.");
      } else {
        setError(`Extraction Failed: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
  };

  const downloadText = () => {
    if (!text) return;
    const element = document.createElement("a");
    const fileBlob = new Blob([text], { type: 'text/plain' });
    element.href = URL.createObjectURL(fileBlob);
    element.download = "handwriting_extract.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const resetAll = () => {
    setFile(null);
    setPreview(null);
    setText("");
    setError("");
    setStatus("");
  };

  return (
    <>
      <Navbar />
      <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom color="primary.main">
            ✍️ Manuscript & Handwriting OCR
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Secure browser-based extraction for historical documents.
          </Typography>
        </Box>

        <Paper elevation={4} sx={{ p: 4, borderRadius: 4, border: '1px solid #e0e0e0' }}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="overline" color="primary" fontWeight="bold">Step 1: Upload</Typography>
              <Button variant="contained" component="label" fullWidth size="large" sx={{ mt: 1, py: 1.5, borderRadius: 2 }}>
                {file ? "Change Image" : "Select Document"}
                <input hidden type="file" accept="image/*" onChange={handleFileChange} />
              </Button>
            </Box>

            {preview && (
              <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 2, textAlign: 'center', border: '1px dashed grey.400' }}>
                <Box component="img" src={preview} sx={{ maxWidth: '100%', maxHeight: 300, borderRadius: 1, boxShadow: 2 }} />
              </Box>
            )}

            <Divider />

            <Box>
              <Typography variant="overline" color="primary" fontWeight="bold">Step 2: AI Process</Typography>
              <Button
                variant="contained"
                color="secondary"
                fullWidth
                onClick={runOCR}
                disabled={loading || !file}
                size="large"
                sx={{ mt: 1, py: 1.5, borderRadius: 2, fontWeight: 'bold' }}
              >
                {loading ? status : "Run Extraction"}
              </Button>
            </Box>

            {loading && (
              <Box sx={{ width: '100%' }}>
                <LinearProgress color="secondary" sx={{ borderRadius: 1, height: 8 }} />
                <Typography variant="caption" sx={{ mt: 1, display: 'block', textAlign: 'center', color: 'text.secondary' }}>
                  {status} (Large models require significant RAM)
                </Typography>
              </Box>
            )}

            {error && <Alert severity="error" variant="filled" sx={{ borderRadius: 2 }}>{error}</Alert>}

            {text && (
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="overline" color="primary" fontWeight="bold">Result</Typography>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Copy">
                      <IconButton onClick={copyToClipboard} size="small" color="primary" sx={{ border: '1px solid' }}>
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Download">
                      <IconButton onClick={downloadText} size="small" color="primary" sx={{ border: '1px solid' }}>
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
                <TextField
                  multiline
                  minRows={6}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  fullWidth
                  variant="outlined"
                  sx={{ bgcolor: 'grey.50', '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                />
              </Box>
            )}

            <Button 
              startIcon={<DeleteSweepIcon />} 
              variant="text" 
              color="error" 
              onClick={resetAll} 
              disabled={loading}
              sx={{ alignSelf: 'center' }}
            >
              Clear Session
            </Button>
          </Stack>
        </Paper>
      </Box>
    </>
  );
}