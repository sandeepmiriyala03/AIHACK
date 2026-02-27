📘 AksharaTantra – Multilingual OCR & Vedic Text Builder

AksharaTantra is a fast, offline-friendly, multilingual OCR engine built for extracting text from images and documents across 34+ global languages, including deep support for Telugu and Sanskrit (Vedic accents).

The entire engine runs inside the browser, using lightweight .gz OCR models — ensuring privacy, speed, and zero server dependency.

🚀 Key Features
✅ 34+ Language OCR (Offline-Ready)

Extract text from images, scanned documents, and camera photos.

Tesseract .traineddata.gz files loaded directly in the browser.

No backend, no API gateway, no server calls.

✅ Sanskrit & Vedic Accent Support

Users can select Vedic Mode for Telugu or Sanskrit.

Supports:

Udatta (High pitch)

Anudatta (Low pitch)

Svarita (Default)

User can apply, edit, delete pitch marks in the editor.

✅ Unlimited Page Builder (HTML Book Generator)

Users can upload unlimited images (bulk mode).

Each page is OCR-processed and editable.

Finally export as:

📄 HTML Book

📘 EPUB

📦 JSON dataset

All generated files are built inside the browser, ensuring:

No upload to server

100% privacy

Works offline

✅ Smart Editor

Supports:

Multiple pages

Page-wise edits

Manual fix for split letters

Merging / splitting lines

Pitch annotations (Vedic)

✅ PWA Installable

Works like a mobile app (Android, iOS, Desktop)

Offline OCR

IndexedDB caching

✅ Chatbot Assistance (Optional Module)

Users can ask:

"Fix OCR spacing"

"Convert to Vedic style"

"Summarize this page"

"Transliterate this"

This runs locally (no server).

🗂 Main Sections
🔹 About

What the engine does, supported languages, advantages.

🔹 Upload

Choose language → choose mode → upload single or bulk images → OCR.

🔹 Image to Text

Editable OCR workspace.

🔹 Install

Install the PWA version to your phone/desktop.

🧩 Tech Stack
Layer	Technology
UI Framework	Next.js (React)
OCR Engine	Tesseract.js + .gz model files
Storage	IndexedDB (browser database)
Styling	Tailwind CSS
Packaging	PWA with Service Workers
Export Formats	HTML, EPUB, JSON
Deployment	Vercel
🛠 How It Works

User selects language

Loads the corresponding .gz OCR model

User selects single or bulk upload mode

OCR engine extracts text per page

User edits/validates text

Vedic mode → user marks Udatta / Anudatta

User exports full book as

HTML

EPUB

JSON

All processing happens locally on the device.

🔐 Privacy First

No image or text is uploaded to any server.

Everything (OCR, editing, export) runs on user's device.

IndexedDB caching is used for:

OCR results

Page metadata

User settings

Users can clear all data anytime.

🌐 Live Application

👉 https://AksharaTantra.vercel.app/

🙌 Suggestions & Feedback

Your contributions, suggestions, and feature ideas are always welcome!

👨‍💻 Developed by Sandeep Miriyala