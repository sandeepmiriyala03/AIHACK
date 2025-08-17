import React, { useState } from 'react';
import Tesseract from 'tesseract.js';

const INDIAN_LANGS = [
  { code: 'eng', name: 'English' },
  { code: 'hin', name: 'Hindi' },
  { code: 'ben', name: 'Bengali' },
  { code: 'tel', name: 'Telugu' },
  { code: 'mar', name: 'Marathi' },
  { code: 'tam', name: 'Tamil' },
  { code: 'urd', name: 'Urdu' },
  { code: 'guj', name: 'Gujarati' },
  { code: 'mal', name: 'Malayalam' },
  { code: 'kan', name: 'Kannada' },
  { code: 'ori', name: 'Odia' },
  { code: 'pan', name: 'Punjabi' },
  { code: 'asm', name: 'Assamese' },
  { code: 'san', name: 'Sanskrit' },
  { code: 'snd', name: 'Sindhi' },
  { code: 'mai', name: 'Maithili' },
];

export default function FileLanguageAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [lang, setLang] = useState<string>('eng');
  const [progress, setProgress] = useState<string>('');
  const [fullText, setFullText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState<string>('');

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFullText('');
    setProgress('');
    setImageError('');
    const selectedFile = e.target.files?.[0] ?? null;
    if (!selectedFile) {
      setFile(null);
      return;
    }
    const img = new window.Image();
    const url = URL.createObjectURL(selectedFile);
    img.onload = () => {
      if (img.width < 10 || img.height < 10) {
        setFile(null);
        setImageError('Image too small. Please upload an image of at least 10x10 pixels.');
        URL.revokeObjectURL(url);
      } else {
        setFile(selectedFile);
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      setFile(null);
      setImageError('Could not read image file. Please upload a valid image.');
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const onLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLang(e.target.value);
  };

  const onAnalyze = async () => {
    if (!file) return;
    setProgress('Starting OCR...');
    setFullText('');
    setLoading(true);
    setImageError('');
    const url = URL.createObjectURL(file);
    try {
      const { data: { text } } = await Tesseract.recognize(
        url,
        lang,
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              setProgress(`OCR: ${Math.round(m.progress * 100)}%`);
            } else {
              setProgress(m.status);
            }
          }
        }
      );
      URL.revokeObjectURL(url);
      const cleanText = text.trim();
      setFullText(cleanText); // Show full text, no limit
      setProgress('Analysis Complete');
    } catch {
      setProgress('Error during OCR');
    } finally {
      setLoading(false);
    }
  };

  const onClear = () => {
    setFile(null);
    setLang('eng');
    setFullText('');
    setProgress('');
    setImageError('');
    setLoading(false);
    const input = document.getElementById('file-upload') as HTMLInputElement | null;
    if (input) input.value = '';
  };

  return (
    <div className="container" aria-live="polite">
      <h1 className="title">Indian Language OCR Analyzer</h1>

      <div className="instructions">
        <p>
          Upload an image file and select the appropriate language before clicking <strong>Analyze</strong>.
        </p>
        <p>
          <strong>Supported languages:</strong> English, Hindi, Bengali, Telugu, Marathi, Tamil, Urdu, Gujarati, Malayalam, Kannada, Odia, Punjabi, Assamese, Sanskrit, Sindhi, Maithili.
        </p>
      </div>

      <div className="uploadArea">
        <input
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="fileInput"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="fileInputLabel">
          {file ? file.name : 'Choose Image'}
        </label>
      </div>

      <select
        value={lang}
        onChange={onLangChange}
        className="fileInput"
        aria-label="Select OCR language"
      >
        {INDIAN_LANGS.map(l => (
          <option key={l.code} value={l.code}>{l.name}</option>
        ))}
      </select>

      <div style={{ marginTop: 20 }}>
        <button
          onClick={onAnalyze}
          disabled={!file || loading}
          className={`uploadButton${!file || loading ? ' disabled' : ''}`}
          aria-disabled={!file || loading}
          style={{ marginRight: 12 }}
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
        <button
          onClick={onClear}
          className="uploadButton"
          style={{ background: '#ccc', color: '#333' }}
          aria-label="Clear form"
          disabled={loading}
        >
          Clear
        </button>
      </div>

      {imageError && (
        <div className="errorMsg" style={{ marginTop: 20 }}>
          {imageError}
        </div>
      )}

      <div className="analysisSection" aria-live="polite" style={{ marginTop: 24 }}>
        {progress && <div className="fileDetails">{progress}</div>}

        {fullText && !loading && (
          <>
            <h3 className="analysisTitle">Extracted Text</h3>
            <div
              style={{
                background: '#fff5ec',
                color: '#333',
                borderRadius: '10px',
                padding: '15px',
                boxShadow: '0 2px 10px #ffdbe688',
                fontSize: '16px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: '350px',
                overflowY: 'auto'
              }}
            >
              {fullText}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
