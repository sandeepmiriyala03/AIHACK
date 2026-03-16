import FileUpload from "@/components/FileUpload";
import FileInfo from "@/components/FileInfo";
import ErrorMessage from "@/components/ErrorMessage";
import AnalysisSummary from "@/components/AnalysisSummary";
import GoToTopButton from "@/components/GoToTopButton";
import { useFileUpload } from "@/hooks/useFileUpload";

export default function FileUploadManager() {
  const {
    file,
    error,
    result,
    loading,
    dragOver,
    elapsedTime,
    handleFileChange,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleUpload,
  } = useFileUpload();

  return (
    <>
      <FileUpload
        file={file}
        loading={loading}
        onFileChange={handleFileChange}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onUpload={handleUpload}
        dragOver={dragOver}
      />
      <FileInfo file={file} />
      {error && <ErrorMessage message={error} />}
      {result && (
        <AnalysisSummary result={result} loading={loading} elapsedTime={elapsedTime} />
      )}
      <GoToTopButton />
    </>
  );
}