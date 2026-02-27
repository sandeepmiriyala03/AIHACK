"use client";

import { useState, useRef, ChangeEvent, useEffect } from "react";
import Navbar from "@/components/Navbar";
import {
  Button, TextField, Stack, Typography, Box, LinearProgress,
  Paper, Alert, Divider, Chip
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
  const [systemError, setSystemError] = useState(""); 
  const [text, setText] = useState("");
  const [isOfflineReady, setIsOfflineReady] = useState(false);

  const worker = useRef<ImageToTextPipeline | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
      } catch {
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
      setSystemError("");
      setStatus("");
      setProgress(0);
    }
  };

  const runMicrosoftOCR = async () => {
    if (!file || !preview) {
      setSystemError("Please upload an image first.");
      return;
    }
    setLoading(true);
    setSystemError("");
    setStatus("Enhancing image quality...");

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
    } catch {
      setSystemError(`System Error: Ensure model is in /public/models/Xenova`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <Box sx={{ maxWidth: 900, mx: "auto", p: 3 }}>
        <canvas ref={canvasRef} style={{ display: "none" }} />

        {/* HEADER SECTION */}
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2} mb={4}>
          <Box>
            <Typography variant="h4" fontWeight="bold" color="primary">
              ✍️ Microsoft TrOCR
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Local English Handwriting-to-Text
            </Typography>
          </Box>
          {isOfflineReady && (
            <Chip 
              icon={<SignalWifiOffIcon />} 
              label="Offline Ready" 
              color="success" 
              variant="outlined" 
            />
          )}
        </Stack>

        {/* MAIN CONTENT BOX - REPLACES GRID */}
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' }, 
            gap: 4 
          }}
        >
          {/* Left Side: Interaction (70% width on desktop) */}
          <Box sx={{ flex: 7 }}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
              <Stack spacing={3}>
                <Button variant="outlined" component="label" fullWidth size="large">
                  {file ? "Change Image" : "Upload Note"}
                  <input hidden type="file" accept="image/*" onChange={handleFileChange} />
                </Button>

                {preview && (
                  <Box sx={{ textAlign: 'center', bgcolor: 'grey.50', p: 2, borderRadius: 2, border: '1px dotted #ccc' }}>
                    <Box component="img" src={preview} sx={{ maxHeight: 300, maxWidth: '100%', borderRadius: 1 }} />
                  </Box>
                )}

                <Button variant="contained" fullWidth size="large" onClick={runMicrosoftOCR} disabled={loading || !file}>
                  {loading ? "AI is Thinking..." : "Start Conversion"}
                </Button>

                {loading && (
                  <Box>
                    <LinearProgress variant="determinate" value={progress} sx={{ height: 10, borderRadius: 5 }} />
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>{status}</Typography>
                  </Box>
                )}

                {systemError && <Alert severity="error">{systemError}</Alert>}

                {text && (
                  <TextField multiline fullWidth minRows={5} value={text} variant="filled" label="Extracted Result" />
                )}
                
                <Button 
                  startIcon={<DeleteSweepIcon />} 
                  color="error" 
                  onClick={() => { setFile(null); setPreview(null); setText(""); }} 
                  sx={{ alignSelf: 'center' }}
                >
                  Reset
                </Button>
              </Stack>
            </Paper>
          </Box>

          {/* Right Side: Instructions (30% width on desktop) */}
          <Box sx={{ flex: 3 }}>
            <Paper sx={{ p: 3, bgcolor: '#fafafa', borderRadius: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <InfoIcon color="primary" /> Quick Guide
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Stack spacing={2}>
                <Typography variant="body2">
                  <strong>1. Capture:</strong> Use a clear image with minimal shadows.
                </Typography>
                <Typography variant="body2">
                  <strong>2. Pen Type:</strong> Works with Blue, Black, and Red ink.
                </Typography>
                <Typography variant="body2">
                  <strong>3. Privacy:</strong> AI runs in your browser. No data is sent to any server.
                </Typography>
                <Typography variant="body2">
                  <strong>4. Offline:</strong> Once loaded, you can disconnect your internet!
                </Typography>
              </Stack>
            </Paper>
          </Box>
        </Box>
      </Box>
    </>
  );
}