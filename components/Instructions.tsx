export default function Instructions() {
  return (
    <section className="max-w-5xl mx-auto space-y-10">

      {/* HEADER */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          📑 Before You Upload
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Follow these simple guidelines for the best experience with{" "}
          <span className="text-blue-600 font-semibold">AksharaTantra</span>
        </p>
      </div>

      {/* GUIDELINES GRID */}
      <div className="grid md:grid-cols-2 gap-6">

        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow border">
          <h3 className="font-semibold text-lg mb-2">📦 Upload Limits</h3>
          <p>Keep files under <b>50 MB</b> for best performance.</p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow border">
          <h3 className="font-semibold text-lg mb-2">📄 Supported Files</h3>
          <p>PDF, DOCX, XLSX, PPTX formats are supported.</p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow border">
          <h3 className="font-semibold text-lg mb-2">🔍 Text Quality</h3>
          <p>Use clear, well-scanned documents for accurate OCR.</p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow border">
          <h3 className="font-semibold text-lg mb-2">🌍 Language Support</h3>
          <p>Supports <b>34+ languages</b>, optimized for multilingual text.</p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow border">
          <h3 className="font-semibold text-lg mb-2">✍️ Handwriting</h3>
          <p>Best results with neat and readable handwriting.</p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow border">
          <h3 className="font-semibold text-lg mb-2">⚡ Pro Tip</h3>
          <p>Upload only relevant sections for faster processing.</p>
        </div>

      </div>

      {/* PRIVACY CARD */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-green-100 to-blue-100 dark:from-gray-800 dark:to-gray-900 border shadow">
        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
          🔒 Privacy First
        </h3>

        <p className="text-gray-800 dark:text-gray-300">
          Your data is processed entirely in your browser. 
          <b> Nothing is uploaded, stored, or shared.</b>  
          Your files and extracted text always stay on your device.
        </p>
      </div>

      {/* LOCAL AI CARD */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-100 to-purple-100 dark:from-gray-800 dark:to-gray-900 border shadow">
        <h3 className="text-xl font-semibold mb-2 text-blue-700 dark:text-blue-400">
          ⚡ Powered by Local AI
        </h3>

        <p className="text-gray-800 dark:text-gray-300 leading-relaxed">
          AksharaTantra runs on <b>local AI models</b> using{" "}
          <span className="font-semibold">Xenova Transformers</span>.  
          This enables intelligent document understanding, semantic search, 
          and question answering directly in your browser.
        </p>

        <ul className="mt-3 space-y-1 text-gray-700 dark:text-gray-300">
          <li>✅ No API keys required</li>
          <li>✅ No cloud processing</li>
          <li>✅ Fully private & secure</li>
          <li>✅ Works even offline (after initial load)</li>
        </ul>
      </div>

    </section>
  );
}
