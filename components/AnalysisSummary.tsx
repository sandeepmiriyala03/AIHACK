import AccordionChunk from "./AccordionChunk";

interface Analysis {
  chunk_number: number;
  keywords: string[];
  highlights: string[];
  summary: string[];
}

interface Result {
  total_chunks: number;
  file_type?: string;
  analysis: Analysis[];
}

interface Props {
  result: Result;
  loading: boolean;
  elapsedTime: number | null;
}

export default function AnalysisSummary({ result, loading, elapsedTime }: Props) {
  return (
    <section className="analysisSection">
      <h2 className="analysisTitle">Analysis Summary</h2>

      {result.file_type && (
        <p className="fileDetails">
          <b>File Type:</b> {result.file_type.toUpperCase()} &nbsp;|&nbsp;
          <b>Chunks:</b> {result.total_chunks}
        </p>
      )}

      {result.analysis.length === 0 ? (
        <p className="noResults">No analysis results returned.</p>
      ) : (
        result.analysis.map((chunk) => (
          <AccordionChunk key={chunk.chunk_number} chunk={chunk} />
        ))
      )}

      {loading && elapsedTime !== null && (
        <p className="processingTime">
          Processing time: {elapsedTime.toFixed(2)} seconds
        </p>
      )}
    </section>
  );
}
