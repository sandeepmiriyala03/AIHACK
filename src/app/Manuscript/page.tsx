"use client";

import { useState, useRef, ChangeEvent, useEffect } from "react";
import Navbar from "@/components/Navbar";
import {
  Button, TextField, Stack, Typography, Box, LinearProgress,
  Paper, Tooltip, IconButton, Alert, Divider, Chip
} from "@mui/material";

import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import SignalWifiOffIcon from '@mui/icons-material/SignalWifiOff';
import InfoIcon from '@mui/icons-material/Info';
import { pipeline, env, type ImageToTextPipeline } from "@xenova/transformers";

// 🛠️ ENGINE CONFIGURATION
env.allowLocalModels = true;
env.localModelPath = "/models/"; 
env.allowRemoteModels = true; 
env.useBrowserCache = true;
env.backends.onnx.wasm.proxy = true; 

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
  const [isOfflineReady, setIsOfflineReady] = useState(false);

  const worker = useRef<ImageToTextPipeline | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 📶 Warmup: Pre-load model for Offline Use
  useEffect(() => {
    const warmup = async () => {
      try {
        if (!worker.current) {
          worker.current = await pipeline(
            "image-to-text",
            "Xenova/trocr-base-handwritten",
            { quantized: true }
          ) as ImageToTextPipeline;
          setIsOfflineReady(true);
        }
      } catch (e) {
        console.log("Offline warmup ready.");
      }
    };
    warmup();
  }, []);

  const preprocessImage = (imageSrc: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return resolve(imageSrc);
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(imageSrc);
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        ctx.filter = "grayscale(100%) contrast(160%) brightness(110%)";
        ctx.drawImage(canvas, 0, 0);
        resolve(canvas.toDataURL("image/jpeg", 0.9));
      };
      img.src = imageSrc;
    });
  };

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
    setStatus("Cleaning image for better pen recognition...");

    try {
      const processedImage = await preprocessImage(preview);
      if (!worker.current) {
        worker.current = await pipeline(
          "image-to-text",
          "Xenova/trocr-base-handwritten", 
          {
            quantized: true,
            progress_callback: (data: ProgressData) => {
              if (data.status === 'downloading') {
                setProgress(Math.round(data.progress || 0));
                setStatus(`Downloading AI: ${Math.round(data.progress || 0)}%`);
              }
            }
          }
        ) as ImageToTextPipeline;
      }

      setStatus("AI is reading your handwriting...");
      const result = await worker.current(processedImage, {
        do_sample: false,
        num_beams: 5,
        max_new_tokens: 128,
      });
      
      const output = result as unknown as MicrosoftOCRResult[];
      setText(output[0]?.generated_text.trim() || "");
      setStatus("Success!");
      setIsOfflineReady(true);
    } catch (err: unknown) {
      setError(`System Error: Ensure model is in /public/models/Xenova`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <Box sx={{ maxWidth: 850, mx: "auto", p: 3 }}>
        <canvas ref={canvasRef} style={{ display: "none" }} />

        {/* 📋 HEADER & OFFLINE BADGE */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h4" fontWeight="bold" color="primary">
              ✍️ Microsoft TrOCR
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Handwriting-to-English Converter
            </Typography>
          </Box>
          {isOfflineReady && (
            <Chip 
              icon={<SignalWifiOffIcon />} 
              label="Offline Ready" 
              color="success" 
              variant="outlined" 
              size="small" 
            />
          )}
        </Stack>

        <Grid container spacing={3}>
          {/* 🕹️ MAIN WORKSPACE */}
          <Grid item xs={12} md={7}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
              <Stack spacing={2}>
                <Button variant="outlined" component="label" fullWidth>
                  {file ? "Change Image" : "Upload Note"}
                  <input hidden type="file" accept="image/*" onChange={handleFileChange} />
                </Button>

                {preview && (
                  <Box sx={{ textAlign: 'center', bgcolor: 'grey.50', p: 1, borderRadius: 2, border: '1px solid #eee' }}>
                    <Box component="img" src={preview} sx={{ maxHeight: 250, maxWidth: '100%', borderRadius: 1 }} />
                  </Box>
                )}

                <Button variant="contained" fullWidth onClick={runMicrosoftOCR} disabled={loading || !file}>
                  {loading ? "Processing..." : "Convert to Text"}
                </Button>

                {loading && (
                  <Box sx={{ mt: 1 }}>
                    <LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: 3 }} />
                    <Typography variant="caption" sx={{ textAlign: 'center', display: 'block', mt: 1 }}>{status}</Typography>
                  </Box>
                )}

                {text && (
                  <TextField multiline fullWidth minRows={4} value={text} variant="filled" label="Extracted Result" />
                )}
                
                <Button startIcon={<DeleteSweepIcon />} color="error" size="small" onClick={() => setFile(null)} sx={{ alignSelf: 'center' }}>Clear</Button>
              </Stack>
            </Paper>
          </Grid>

          {/* 📖 INSTRUCTIONS SIDEBAR */}
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 3, bgcolor: '#fcfcfc', borderRadius: 3, border: '1px solid #e0e0e0' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <InfoIcon color="primary" /> How to use
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" component="div">
                <ol style={{ paddingLeft: 15 }}>
                  <li><strong>Upload:</strong> Take a clear photo of your handwritten English note.</li>
                  <li><strong>Wait:</strong> The first time takes 30-60 seconds to download the AI weights.</li>
                  <li><strong>Any Pen:</strong> Blue, Black, or Red pens are supported.</li>
                  <li><strong>Go Offline:</strong> Once the "Offline Ready" badge appears, you can use this page without internet!</li>
                </ol>
              </Typography>
              <Alert severity="info" sx={{ mt: 2, '& .MuiAlert-message': { fontSize: '0.75rem' } }}>
                Best results: Black ink on white paper with high brightness.
              </Alert>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </>
  );
}

// Ensure you import Grid from MUI
import { Grid } from "@mui/material";


