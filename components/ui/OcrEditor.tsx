"use client";

type Props = {
  text: string;
  onChange: (value: string) => void;
};

export default function OcrEditor({ text, onChange }: Props) {
  return (
    <div style={{ padding: "16px" }}>
      <h3>📝 OCR Editor</h3>

      <textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          minHeight: "200px",
          padding: "12px",
          borderRadius: "8px",
          border: "1px solid #ccc",
        }}
      />
    </div>
  );
}
