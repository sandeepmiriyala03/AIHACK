"use client";

type Props = {
  pages: string[];
  onSelect: (index: number) => void;
  onDelete: (index: number) => void;
};

export default function OcrPreviewList({
  pages,
  onSelect,
  onDelete,
}: Props) {
  return (
    <div className="is-04b57f5">
      <h3>📄 OCR Pages Preview</h3>

      {pages.length === 0 && <p>No pages extracted yet.</p>}

      {pages.map((page, i) => (
        <div
          key={i}
          className="is-3ab122c"
        >
          <p className="is-4f5f61b">
            {page.substring(0, 100)}...
          </p>

          <div className="is-3e193d5">
            <button
              onClick={() => onSelect(i)}
              className="is-ad9405f"
            >
              Edit
            </button>

            <button
              onClick={() => onDelete(i)}
              className="is-e6e654d"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
