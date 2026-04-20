"use client";

type LiveVedicPreviewProps = {
  text: string;
};

export default function LiveVedicPreview({ text }: LiveVedicPreviewProps) {
  return (
    <>
      {/* Component-scoped Vedic styles */}
      {/* @ts-ignore - 'jsx' attribute is not recognized by React 19 types but is handled by styled-jsx */}
      <style jsx>{`
        .vedic-high {
          text-decoration: overline;
          text-decoration-thickness: 2px;
        }

        .vedic-low {
          text-decoration: underline;
          text-decoration-thickness: 2px;
        }

        .vedic-svarita {
          background-color: rgba(79, 70, 229, 0.15);
          border-radius: 4px;
          padding: 0 2px;
        }

        /* Selection-friendly */
        .vedic-high::selection,
        .vedic-low::selection,
        .vedic-svarita::selection {
          background: #c7d2fe;
        }
      `}</style>

      <div
        contentEditable={false}
        style={{
          padding: "16px",
          border: "1px solid #ddd",
          borderRadius: 6,
          minHeight: "300px",
          background: "white",
          fontSize: "20px",
          lineHeight: 1.8,
          whiteSpace: "pre-wrap",
          userSelect: "text",
        }}
        dangerouslySetInnerHTML={{ __html: text }}
      />
    </>
  );
}