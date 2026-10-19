"use client";

type LiveVedicPreviewProps = {
  text: string;
};

export default function LiveVedicPreview({ text }: LiveVedicPreviewProps) {
  return (
    <>
      {/* Component-scoped Vedic styles */}
      {/* @ts-ignore - 'jsx' attribute is not recognized by React 19 types but is handled by styled-jsx */}


      <div
        contentEditable={false}
        className="is-8ed5307"
        dangerouslySetInnerHTML={{ __html: text }}
      />
    </>
  );
}