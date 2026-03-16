"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Stack,
  Typography,
  Chip,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

interface ShareSectionProps {
  selectedLanguage?: {
    value: string;
    label: string;
    nativeLabel: string;
    googleCode: string;
  };
}

interface ShareTranslations {
  title: string;
  description: string;
  shareText: string;
  installPWA: string;
  shareNative: string;
  copyLink: string;
  copied: string;
  whatsapp: string;
  facebook: string;
  twitter: string;
}

const SHARE_TRANSLATIONS: Record<string, ShareTranslations> = {
  en: {
    title: "Share AksharaTantra",
    description: "Help preserve Indic languages—share with friends!",
    shareText:
      "🎯 AksharaTantra – Offline OCR for 34+ Languages\n\n📱 Works as a PWA on any device. Download now: {url}",
    installPWA: "Install App",
    shareNative: "Share",
    copyLink: "Copy Link",
    copied: "Link copied! ✅",
    whatsapp: "WhatsApp",
    facebook: "Facebook",
    twitter: "X/Twitter",
  },
};

export default function ShareSection({ selectedLanguage }: ShareSectionProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  const [copied, setCopied] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [installDialogOpen, setInstallDialogOpen] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState("");

  const currentUrl =
    typeof window !== "undefined"
      ? window.location.href
      : "https://aksharatantra.vercel.app";

  const langCode = selectedLanguage?.googleCode?.split("-")[0] || "en";
  const translations =
    SHARE_TRANSLATIONS[langCode] || SHARE_TRANSLATIONS["en"];

  const customShareText = translations.shareText.replace("{url}", currentUrl);

  const canShare =
    typeof navigator !== "undefined" && "share" in navigator;

  useEffect(() => {
    if (typeof navigator === "undefined") return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    const ua = navigator.userAgent;

    if (/iPhone|iPad|iPod/.test(ua)) setDeviceInfo("iOS");
    else if (/Android/.test(ua)) setDeviceInfo("Android");
    else setDeviceInfo("Desktop");

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () =>
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
  }, []);

  const handleNativeShare = async () => {
    if (!canShare) return;

    try {
      await navigator.share({
        title: "AksharaTantra",
        text: customShareText,
        url: currentUrl,
      });
    } catch {
      console.log("Share cancelled");
    }
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareButtons = [
    {
      name: translations.whatsapp,
      icon: "🟢",
      href: `https://wa.me/?text=${encodeURIComponent(customShareText)}`,
    },
    {
      name: translations.facebook,
      icon: "📘",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        currentUrl
      )}`,
    },
    {
      name: translations.twitter,
      icon: "🐦",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        customShareText
      )}&url=${encodeURIComponent(currentUrl)}`,
    },
  ];

  return (
    <>
      <Box
        sx={{
          py: 6,
          px: 3,
          background: "#ffffff",
          borderTop: "1px solid #e5e7eb",
        }}
      >
        <Box sx={{ maxWidth: "900px", mx: "auto" }}>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, textAlign: "center", mb: 1 }}
          >
            {translations.title}
          </Typography>

          <Typography
            variant="body2"
            sx={{ textAlign: "center", color: "#6b7280", mb: 4 }}
          >
            {translations.description}
          </Typography>

          {deviceInfo && (
            <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
              <Chip label={`📱 ${deviceInfo}`} />
            </Box>
          )}

          <Stack
            spacing={2}
            sx={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "1fr"
                : isTablet
                ? "repeat(2,1fr)"
                : "repeat(4,1fr)",
              gap: 2,
            }}
          >
            {canShare && (
              <Button
                variant="contained"
                color="success"
                onClick={handleNativeShare}
              >
                🔗 {translations.shareNative}
              </Button>
            )}

            <Button variant="outlined" onClick={handleCopyLink}>
              📋 {copied ? translations.copied : translations.copyLink}
            </Button>

            {shareButtons.map((btn) => (
              <Button
                key={btn.name}
                component="a"
                href={btn.href}
                target="_blank"
                rel="noopener noreferrer"
                variant="outlined"
              >
                {btn.icon} {btn.name}
              </Button>
            ))}
          </Stack>
        </Box>
      </Box>

      <Dialog
        open={installDialogOpen}
        onClose={() => setInstallDialogOpen(false)}
      >
        <DialogTitle>{translations.installPWA}</DialogTitle>

        <DialogContent>
          <Typography>
            Install AksharaTantra as an app on your {deviceInfo} device.
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setInstallDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}