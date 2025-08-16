interface FileInfoProps {
  file: File | null;
}

export default function FileInfo({ file }: FileInfoProps) {
  if (!file) return null;

  return (
    <div className="fileInfo">
      <b>Selected file:</b> {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
    </div>
  );
}
