"use client";

type Props = {
  text: string;
  onChange: (value: string) => void;
};

export default function OcrEditor({ text, onChange }: Props) {
  return (
    <div className="is-04b57f5">
      <h3>📝 OCR Editor</h3>

      <textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        className="is-e5dea4a"
      />
    </div>
  );
}
