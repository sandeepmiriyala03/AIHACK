// components/FileInfo.tsx

interface FileInfoProps {
  file: File | null;
}

export default function FileInfo({ file }: FileInfoProps) {
  if (!file) return null;
  return (
    <div
      style={{
        backgroundColor: "#f0f0f0",
        borderRadius: 6,
        padding: "8px 12px",
        marginBottom: 12,
        fontSize: 14,
      }}
    >
      <b>Selected file:</b> {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
    </div>
  );
}
