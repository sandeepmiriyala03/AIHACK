export default function Instructions() {
  return (
    <section className="instructions space-y-4 text-gray-700 dark:text-gray-300 text-lg leading-relaxed max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
        📑 Before You Upload
      </h2>

      <p>
        Please follow these guidelines to ensure the best experience while using{" "}
        <span className="text-blue-600 font-semibold">MultiDecode</span>.
      </p>

      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>Upload Limitations:</strong> For best performance, please upload
          files under <strong>50 MB</strong>.
        </li>
        <li>
          <strong>Supported File Types:</strong> PDF, DOCX, XLSX, PPTX. Other formats may not process correctly.
        </li>
        <li>
          <strong>Text Clarity:</strong> For accurate OCR, make sure your documents
          are clear, well-scanned, and free from heavy noise or blur.
        </li>
        <li>
          <strong>Language Support:</strong> We support <b>34+ languages</b>. By default, detection
          works best on English text, but multi-language documents are also supported.
        </li>
        <li>
          <strong>Handwritten Notes:</strong> Handwriting recognition works best
          with clear, legible writing.
        </li>
      </ul>

      <p>
        🔒 <strong>Privacy Note:</strong> Your uploads are processed instantly and 
        securely. We <b>never save or store</b> your documents or extracted text — your 
        data stays private to you.
      </p>

      <p className="font-semibold text-blue-600">
        ✅ Tip: For faster results, crop or upload only the relevant pages 
        containing the text you need.
      </p>
    </section>
  );
}
