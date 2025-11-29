"use client";

import ShareIcon from "@mui/icons-material/Share";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import FacebookIcon from "@mui/icons-material/Facebook";
import XIcon from "@mui/icons-material/X"; // Twitter/X Icon
import { IconButton, Button } from "@mui/material";

export default function ShareSection() {
  const currentUrl =
    typeof window !== "undefined"
      ? window.location.href
      : "https://aksharatantra.vercel.app";

  const shareData = {
    title: "AksharaTantra – Multilingual OCR & Vedic Engine",
    text: "Try AksharaTantra — Fast, private OCR for Telugu, Sanskrit & 34+ languages.",
    url: currentUrl,
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (e) {
        console.log("Share cancelled", e);
      }
    } else {
      alert("Sharing not supported on this device. Use buttons below.");
    }
  };

  return (
    <div className="mt-16 text-center">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-300">
        Share AksharaTantra
      </h3>

      <div className="flex justify-center items-center gap-4">

        {/* Native Share */}
        <Button
          variant="contained"
          color="primary"
          onClick={handleNativeShare}
          startIcon={<ShareIcon />}
          sx={{ borderRadius: "50px", paddingX: 3 }}
        >
          Share
        </Button>

        {/* WhatsApp */}
        <IconButton
          component="a"
          href={`https://wa.me/?text=${encodeURIComponent(
            shareData.text + " " + shareData.url
          )}`}
          target="_blank"
          sx={{ color: "#25D366" }}
        >
          <WhatsAppIcon fontSize="large" />
        </IconButton>

        {/* Facebook */}
        <IconButton
          component="a"
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            shareData.url
          )}`}
          target="_blank"
          sx={{ color: "#1877F2" }}
        >
          <FacebookIcon fontSize="large" />
        </IconButton>

        {/* X (Twitter) */}
        <IconButton
          component="a"
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
            shareData.text
          )}&url=${encodeURIComponent(shareData.url)}`}
          target="_blank"
          sx={{ color: "black" }}
        >
          <XIcon fontSize="large" />
        </IconButton>
      </div>
    </div>
  );
}
