import React from "react";
import Image from "next/image";

interface RoundedImageWrapperProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean; // Optional, for eager loading
}

/**
 * RoundedImageWrapper component displays an optimized Next.js Image
 * with rounded corners and centered layout.
 */
export function RoundedImageWrapper({
  src,
  alt,
  width,
  height,
  priority = false,
}: RoundedImageWrapperProps) {
  return (
    <div
      style={{
        marginTop: "1rem",
        textAlign: "center",
        borderRadius: "12px",
        overflow: "hidden",
        display: "inline-block",
      }}
    >
      <Image
        src={src}
        alt={alt}
        layout="responsive"
        width={width}
        height={height}
        priority={priority}
      />
    </div>
  );
}

export default RoundedImageWrapper;
