"use client";

import React, { useRef, useEffect, useState, useCallback, ChangeEvent } from "react";
import { Box, Typography, Stack, Paper, Select, MenuItem, FormControl, InputLabel, TextField, Slider, Button, Chip, Divider } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Navbar from "@/components/Navbar";

// ── Clean white + black theme — no gold, no dark mode ────
const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#000000" },
    background: { default: "#ffffff", paper: "#ffffff" },
    text: { primary: "#000000", secondary: "#666666" },
    divider: "#e5e5e5",
  },
  typography: {
    fontFamily: `'Poppins', 'Noto Sans Telugu', sans-serif`,
    h5: { fontWeight: 700, letterSpacing: "-0.02em" },
    overline: { letterSpacing: "0.12em", fontSize: "0.65rem" },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none", boxShadow: "none", border: "1.5px solid #e5e5e5" },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600, borderRadius: 8, fontSize: "0.9rem" },
      },
    },
    MuiSelect: { styleOverrides: { root: { borderRadius: 8 } } },
    MuiTextField: {
      styleOverrides: { root: { "& .MuiOutlinedInput-root": { borderRadius: 8 } } },
    },
    MuiSlider: {
      styleOverrides: {
        root: { color: "#000" },
        thumb: { width: 16, height: 16 },
        track: { height: 3 },
        rail: { height: 3, color: "#e0e0e0" },
      },
    },
  },
});

const FONT_MAP: Record<string, string[]> = {
  te: ["Noto Sans Telugu","Ramabhadra","Gidugu","Mandali","NTR","RaviPrakash","Tenali Ramakrishna","Timmana","Ramaraja","Ponnala"],
  hi: ["Noto Sans Devanagari","Hind","Tiro Devanagari Hindi"],
  en: ["Poppins","Playfair Display","Oswald","Merriweather"],
};

const LANG_DEFAULTS: Record<string, { label: string; placeholder: string; guide: string }> = {
  te: { label: "తెలుగు",  placeholder: "మీ పేరు",   guide: "ఫోటో → పేరు → డౌన్‌లోడ్" },
  hi: { label: "हिन्दी",  placeholder: "अपना नाम",  guide: "फ़ोटो → नाम → डाउनलोड" },
  en: { label: "English", placeholder: "Your Name", guide: "Photo → Name → Download" },
};

const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Noto+Sans+Telugu:wght@400;700" +
  "&family=Ramabhadra&family=Gidugu&family=Mandali&family=NTR" +
  "&family=RaviPrakash&family=Tenali+Ramakrishna&family=Timmana" +
  "&family=Ramaraja&family=Ponnala" +
  "&family=Noto+Sans+Devanagari:wght@400;700&family=Hind:wght@400;700" +
  "&family=Poppins:wght@400;700&family=Playfair+Display:wght@700" +
  "&family=Oswald:wght@400;700&family=Merriweather:wght@700&display=swap";

type Position = "top" | "bottom" | "center";
type Lang = "te" | "hi" | "en";

function drawCurvedText(ctx: CanvasRenderingContext2D, text: string, cx: number, cy: number, radius: number, startAngle: number, fontSize: number, font: string) {
  if (!text) return;
  ctx.font = `bold ${fontSize}px "${font}"`;
  const chars = text.split("");
  const totalWidth = ctx.measureText(text).width;
  const angularWidth = totalWidth / radius;
  let currentAngle = startAngle - angularWidth / 2;
  chars.forEach((char) => {
    const w = ctx.measureText(char).width;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(currentAngle + w / (2 * radius));
    ctx.fillText(char, 0, -radius);
    ctx.restore();
    currentAngle += w / radius;
  });
}

function drawBadge(ctx: CanvasRenderingContext2D, size: number, opts: { userImg: HTMLImageElement | null; zoom: number; text: string; font: string; pos: Position; textColor: string; borderColor: string }) {
  const { userImg, zoom, text, font, pos, textColor, borderColor } = opts;
  const mid = size / 2;
  const bSize = size * 0.022;
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = borderColor;
  ctx.beginPath();
  ctx.arc(mid, mid, mid, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.arc(mid, mid, mid - bSize, 0, Math.PI * 2);
  ctx.clip();
  if (userImg) {
    const min = Math.min(userImg.naturalWidth, userImg.naturalHeight);
    const dSize = size * zoom;
    const off = (dSize - size) / 2;
    ctx.drawImage(userImg, (userImg.naturalWidth - min) / 2, (userImg.naturalHeight - min) / 2, min, min, -off, -off, dSize, dSize);
  } else {
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#cccccc";
    ctx.beginPath(); ctx.arc(mid, mid * 0.85, mid * 0.28, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(mid, mid * 1.65, mid * 0.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = textColor;
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = size * 0.006;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const fontSize = size * 0.065;
  if (pos === "bottom") {
    drawCurvedText(ctx, text, mid, mid, mid - bSize - size * 0.045, Math.PI / 2, fontSize, font);
  } else if (pos === "top") {
    drawCurvedText(ctx, text, mid, mid, mid - bSize - size * 0.045, -Math.PI / 2, fontSize, font);
  } else {
    ctx.font = `bold ${fontSize}px "${font}"`;
    ctx.fillText(text, mid, mid);
  }
  ctx.shadowBlur = 0;
}

export default function RoundBadgePage() {
  const previewRef = useRef<HTMLCanvasElement>(null);
  const exportRef  = useRef<HTMLCanvasElement>(null);
  const [lang,        setLang]        = useState<Lang>("te");
  const [name,        setName]        = useState("పేరు");
  const [font,        setFont]        = useState(FONT_MAP.te[0]);
  const [pos,         setPos]         = useState<Position>("center");
  const [textColor,   setTextColor]   = useState("#000000");
  const [borderColor, setBorderColor] = useState("#000000");
  const [zoom,        setZoom]        = useState(1);
  const [userImg,     setUserImg]     = useState<HTMLImageElement | null>(null);
  const [uploading,   setUploading]   = useState(false);
  const [downloaded,  setDownloaded]  = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!document.querySelector("link[data-badge-fonts]")) {
      const link = document.createElement("link");
      link.rel = "stylesheet"; link.href = GOOGLE_FONTS_URL;
      link.setAttribute("data-badge-fonts", "1");
      document.head.appendChild(link);
    }
  }, []);

  const redraw = useCallback(() => {
    const canvas = previewRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    drawBadge(ctx, 320, { userImg, zoom, text: name, font, pos, textColor, borderColor });
  }, [userImg, zoom, name, font, pos, textColor, borderColor]);

  useEffect(() => { document.fonts.ready.then(redraw); }, [redraw]);

  const handleLangChange = (newLang: Lang) => {
    setLang(newLang); setFont(FONT_MAP[newLang][0]); setName(LANG_DEFAULTS[newLang].placeholder);
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => { setUserImg(img); setUploading(false); };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = () => {
    const canvas = exportRef.current; if (!canvas) return;
    if (!userImg) { alert("Please pick a photo first!"); return; }
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    drawBadge(ctx, 1080, { userImg, zoom, text: name, font, pos, textColor, borderColor });
    const link = document.createElement("a");
    link.download = "badge.png";
    link.href = canvas.toDataURL("image/png", 1.0);
    link.click();
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  const handleReset = () => {
    setUserImg(null); setName(LANG_DEFAULTS[lang].placeholder);
    setZoom(1); setTextColor("#000000"); setBorderColor("#000000");
    setPos("center"); setFont(FONT_MAP[lang][0]);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Navbar />

      <Box sx={{ minHeight: "100vh", bgcolor: "#fff", py: { xs: 3, md: 5 }, px: 2 }}>
        <Box sx={{ maxWidth: 500, mx: "auto", display: "flex", flexDirection: "column", gap: 2 }}>

          {/* Header */}
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="overline" sx={{ color: "#999" }}>ROUND BADGE STUDIO</Typography>
              <Typography variant="h5">AksharaNama</Typography>
            </Box>
            <Chip label="Privacy First" size="small" variant="outlined"
              sx={{ borderColor: "#e0e0e0", color: "#aaa", fontSize: "0.68rem" }} />
          </Stack>

          <Divider />

          {/* Language */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="overline" sx={{ color: "#999" }}>Language / భాష</Typography>
            <Stack direction="row" spacing={1} mt={1}>
              {(["te", "hi", "en"] as Lang[]).map((l) => (
                <Button key={l} size="small"
                  variant={lang === l ? "contained" : "outlined"}
                  onClick={() => handleLangChange(l)}
                  sx={{
                    flex: 1,
                    bgcolor: lang === l ? "#000" : "#fff",
                    color: lang === l ? "#fff" : "#555",
                    borderColor: lang === l ? "#000" : "#ddd",
                    "&:hover": { bgcolor: lang === l ? "#222" : "#f5f5f5", borderColor: "#000" },
                  }}
                >
                  {LANG_DEFAULTS[l].label}
                </Button>
              ))}
            </Stack>
          </Paper>

          {/* Preview */}
          <Paper sx={{ p: 3, display: "flex", flexDirection: "column", alignItems: "center", gap: 2.5, bgcolor: "#fafafa" }}>
            <Box sx={{ width: 260, height: 260, borderRadius: "50%", overflow: "hidden", border: "1.5px solid #ddd", position: "relative", flexShrink: 0 }}>
              <canvas ref={previewRef} width={320} height={320} style={{ width: "100%", height: "100%", display: "block" }} />
              {uploading && (
                <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "rgba(255,255,255,0.75)", borderRadius: "50%" }}>
                  <Typography sx={{ fontSize: "1.5rem" }}>⏳</Typography>
                </Box>
              )}
            </Box>
            <Box sx={{ width: "100%", px: 1 }}>
              <Stack direction="row" justifyContent="space-between" mb={0.5}>
                <Typography variant="overline" sx={{ color: "#999" }}>Zoom</Typography>
                <Typography variant="overline" sx={{ color: "#000", fontWeight: 700 }}>{zoom.toFixed(2)}×</Typography>
              </Stack>
              <Slider min={1} max={3} step={0.05} value={zoom} onChange={(_, v) => setZoom(v as number)} />
            </Box>
          </Paper>

          {/* Controls */}
          <Paper sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 2 }}>

            {/* Photo */}
            <Box>
              <Typography variant="overline" sx={{ color: "#999" }}>1. Photo</Typography>
              <Button component="label" variant="outlined" fullWidth
                sx={{
                  mt: 0.75, py: 1.5, borderStyle: "dashed",
                  borderColor: userImg ? "#000" : "#ddd",
                  color: userImg ? "#000" : "#aaa",
                  bgcolor: "#fff",
                  "&:hover": { borderColor: "#000", bgcolor: "#fafafa" },
                }}
              >
                {userImg ? "✅ Photo loaded — tap to change" : "📁 Choose photo from device"}
                <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
              </Button>
            </Box>

            <Divider />

            {/* Name */}
            <Box>
              <Typography variant="overline" sx={{ color: "#999" }}>2. Name / పేరు</Typography>
              <TextField fullWidth variant="outlined" value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={LANG_DEFAULTS[lang].placeholder}
                sx={{
                  mt: 0.75,
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "#ddd" },
                    "&:hover fieldset": { borderColor: "#999" },
                    "&.Mui-focused fieldset": { borderColor: "#000", borderWidth: "1.5px" },
                  },
                }}
                inputProps={{ style: { fontFamily: font, fontSize: "1.05rem", color: "#000" } }}
              />
            </Box>

            <Divider />

            {/* Font & Position */}
            <Stack direction="row" spacing={1.5}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: "#999", "&.Mui-focused": { color: "#000" } }}>Font</InputLabel>
                <Select value={font} label="Font" onChange={(e) => setFont(e.target.value)}
                  sx={{ "& .MuiOutlinedInput-notchedOutline": { borderColor: "#ddd" }, "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#999" }, "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#000" } }}>
                  {FONT_MAP[lang].map((f) => <MenuItem key={f} value={f} style={{ fontFamily: f, color: "#000" }}>{f}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: "#999", "&.Mui-focused": { color: "#000" } }}>Position</InputLabel>
                <Select value={pos} label="Position" onChange={(e) => setPos(e.target.value as Position)}
                  sx={{ "& .MuiOutlinedInput-notchedOutline": { borderColor: "#ddd" }, "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#999" }, "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#000" } }}>
                  <MenuItem value="center">Center</MenuItem>
                  <MenuItem value="top">Arc Top</MenuItem>
                  <MenuItem value="bottom">Arc Bottom</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <Divider />

            {/* Colors */}
            <Stack direction="row" spacing={1.5}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="overline" sx={{ color: "#999", display: "block", mb: 0.75 }}>Text Color</Typography>
                <Box component="label" sx={{ border: "1.5px solid #e0e0e0", borderRadius: 2, height: 44, display: "flex", alignItems: "center", px: 1.5, gap: 1, bgcolor: "#fafafa", cursor: "pointer", position: "relative", overflow: "hidden", "&:hover": { borderColor: "#999" } }}>
                  <Box sx={{ width: 18, height: 18, borderRadius: "50%", bgcolor: textColor, border: "1.5px solid #ddd", flexShrink: 0 }} />
                  <Typography sx={{ fontSize: "0.73rem", color: "#555", fontFamily: "monospace" }}>{textColor.toUpperCase()}</Typography>
                  <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} style={{ position: "absolute", inset: 0, opacity: 0, width: "100%", height: "100%", cursor: "pointer" }} />
                </Box>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="overline" sx={{ color: "#999", display: "block", mb: 0.75 }}>Ring Color</Typography>
                <Box component="label" sx={{ border: "1.5px solid #e0e0e0", borderRadius: 2, height: 44, display: "flex", alignItems: "center", px: 1.5, gap: 1, bgcolor: "#fafafa", cursor: "pointer", position: "relative", overflow: "hidden", "&:hover": { borderColor: "#999" } }}>
                  <Box sx={{ width: 18, height: 18, borderRadius: "50%", bgcolor: borderColor, border: "1.5px solid #ddd", flexShrink: 0 }} />
                  <Typography sx={{ fontSize: "0.73rem", color: "#555", fontFamily: "monospace" }}>{borderColor.toUpperCase()}</Typography>
                  <input type="color" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} style={{ position: "absolute", inset: 0, opacity: 0, width: "100%", height: "100%", cursor: "pointer" }} />
                </Box>
              </Box>
            </Stack>
          </Paper>

          {/* Actions */}
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1.5}>
              <Button variant="outlined" fullWidth onClick={handleReset}
                sx={{ borderColor: "#ddd", color: "#666", "&:hover": { borderColor: "#999", bgcolor: "#fafafa" } }}>
                Reset
              </Button>
              <Button variant="contained" fullWidth onClick={handleDownload}
                sx={{ bgcolor: downloaded ? "#2e7d32" : "#000", color: "#fff", "&:hover": { bgcolor: downloaded ? "#276826" : "#222" } }}>
                {downloaded ? "✅ Saved!" : "⬇ Download PNG"}
              </Button>
            </Stack>
            <Button variant="outlined" fullWidth
              onClick={() => alert("Download the image first, then attach it to your WhatsApp status!")}
              sx={{ borderColor: "#ddd", color: "#555", "&:hover": { borderColor: "#999", bgcolor: "#fafafa" } }}>
              📲 Share on WhatsApp
            </Button>
          </Stack>

          {/* Hint */}
          <Box sx={{ textAlign: "center", pb: 1 }}>
            <Typography sx={{ fontSize: "0.73rem", color: "#bbb" }}>
              {LANG_DEFAULTS[lang].guide} &nbsp;·&nbsp; 1080×1080 HD export
            </Typography>
          </Box>

        </Box>
      </Box>

      <canvas ref={exportRef} width={1080} height={1080} style={{ display: "none" }} />
    </ThemeProvider>
  );
}