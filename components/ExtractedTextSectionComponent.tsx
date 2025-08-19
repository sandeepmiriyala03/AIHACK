import React from "react";

interface ExtractedTextSectionComponentProps {
  progress?: string;
  fullText?: string;
  loading: boolean;
}

export function ExtractedTextSectionComponent({ progress, fullText, loading }: ExtractedTextSectionComponentProps) {
  return (
    <div className="analysisSection" aria-live="polite">
      {progress && <div className="fileDetails">{progress}</div>}
      {fullText && !loading && (
        <>
          <h3 className="analysisTitle">Extracted Text</h3>
          <div className="extractedText">{fullText}</div>
        </>
      )}
    </div>
  );
}
