"use client";

export default function LiveVedicPreview({ text }: { text: string }) {
  return (
    <>
      {/* Vedic Pitch CSS — Component Scoped */}
      <style jsx>{`
        .hp-wrap, .lp-wrap {
          position: relative;
          display: inline-block;
          padding: 0 2px;
        }

        .hp-wrap::before {
          content: "|";
          position: absolute;
          top: -22px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 20px;
          line-height: 1;
          font-weight: 400;
        }

        .lp-wrap::after {
          content: "‾";
          position: absolute;
          bottom: -12px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 18px;
          line-height: 1;
          font-weight: 300;
        }
      `}</style>

      <div
        style={{
          padding: "16px",
          border: "1px solid #ddd",
          borderRadius: 6,
          minHeight: "300px",
          background: "white",
          fontSize: "20px",
          lineHeight: 1.8,
          whiteSpace: "pre-wrap",
        }}
        dangerouslySetInnerHTML={{ __html: text }}
      />
    </>
  );
}
