"use client";

// =====================================================
// AksharaChitra — CropModal Component (FIXED)
// =====================================================
// Fix 1: import cropperjs CSS at top level (required for styles to apply)
// Fix 2: guard cropperRef destruction safely
// Fix 3: mobile drag mode correctly typed

import { useEffect, useRef, useState } from "react";
import "cropperjs/dist/cropper.css";

interface CropModalProps {
  isOpen: boolean;
  imageUrl: string;
  target: "main" | "logo";
  onApply: (dataUrl: string, target: "main" | "logo") => void;
  onCancel: () => void;
}

export function CropModal({
  isOpen,
  imageUrl,
  target,
  onApply,
  onCancel,
}: CropModalProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const cropperRef = useRef<any>(null);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(1);

  useEffect(() => {
    if (!isOpen || !imgRef.current || !imageUrl) return;

    let cropperInstance: any = null;
    let destroyed = false;

    const initCropper = async () => {
      try {
        // Dynamic import — works in both dev and prod
        const CropperModule = await import("cropperjs");
        const Cropper = CropperModule.default ?? CropperModule;

        // Guard: component may have unmounted during async import
        if (destroyed || !imgRef.current) return;

        const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

        cropperInstance = new Cropper(imgRef.current, {
          viewMode: 1,
          autoCropArea: 0.9,
          background: false,
          responsive: true,
          movable: true,
          zoomable: true,
          rotatable: true,
          scalable: true,
          restore: false,
          checkOrientation: true,
          dragMode: isMobile ? "move" : "crop",
          wheelZoomRatio: isMobile ? 0.05 : 0.1,
          minContainerWidth: isMobile ? 280 : 400,
          minContainerHeight: isMobile ? 280 : 400,
        });

        cropperRef.current = cropperInstance;
      } catch (err) {
        console.error("Cropper init error:", err);
      }
    };

    initCropper();

    return () => {
      destroyed = true;
      try {
        cropperInstance?.destroy();
      } catch {}
      // Also destroy any instance that was assigned after the timeout
      try {
        cropperRef.current?.destroy();
      } catch {}
      cropperRef.current = null;
    };
  }, [isOpen, imageUrl]);

  const handleApply = () => {
    if (!cropperRef.current) {
      // Cropper not ready — fall back to raw image
      onCancel();
      return;
    }

    try {
      const isLogo = target === "logo";
      const maxWidth =
        isLogo ? 800 :
        typeof window !== "undefined" && window.innerWidth < 768 ? 1600 : 2400;

      const canvas = cropperRef.current.getCroppedCanvas({
        maxWidth,
        maxHeight: maxWidth,
        fillColor: "#fff",
        imageSmoothingEnabled: true,
        imageSmoothingQuality: "high",
      });

      if (!canvas) { onCancel(); return; }

      const out = document.createElement("canvas");
      out.width = canvas.width;
      out.height = canvas.height;

      const ctx = out.getContext("2d");
      if (!ctx) { onCancel(); return; }

      ctx.filter = `brightness(${1 + brightness / 100}) contrast(${contrast})`;
      ctx.drawImage(canvas, 0, 0);

      const quality = isLogo ? 0.9 : 0.92;
      const dataUrl = out.toDataURL("image/jpeg", quality);

      onApply(dataUrl, target);
    } catch (err) {
      console.error("Crop apply error:", err);
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="is-acc9bb9"
      // Allow clicking backdrop to cancel
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="is-a3f05bc"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="is-948e6d6">
          <h3 className="is-90ad8e9">
            ✂️ Crop Image
          </h3>
          <button
            onClick={onCancel}
            className="is-1dac47d"
          >
            ✖
          </button>
        </div>

        {/* Cropper container */}
        <div
          className="is-aba8988"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={imageUrl}
            alt="Crop target"
            className="is-8d28da2"
          />
        </div>

        {/* Brightness / Contrast sliders */}
        <div className="is-cffe664">
          <label className="is-f0eca2c">
            ☀️ Brightness
            <input
              type="range"
              min={-100}
              max={100}
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
            />
          </label>
          <label className="is-f0eca2c">
            ◑ Contrast
            <input
              type="range"
              min={0}
              max={3}
              step={0.1}
              value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
            />
          </label>
        </div>

        {/* Action buttons */}
        <div className="is-73a42a3">
          <button
            onClick={onCancel}
            className="is-58354fe"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="is-7acae03"
          >
            ✅ Apply
          </button>
        </div>
      </div>
    </div>
  );
}