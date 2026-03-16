AksharaTantra

Privacy-First Indic AI Toolkit for Text, Voice, OCR & Digital Preservation

🔗 https://aksharatantra.vercel.app

AksharaTantra is a privacy-focused, browser-based AI platform designed to process, digitize, and create multilingual Indic content. Built as a Progressive Web App (PWA), it runs mostly offline in the browser, ensuring that user data never leaves the device.

The platform combines OCR, handwriting recognition, document analysis, voice generation, multilingual poster creation, and Vedic text digitization into a single integrated toolkit.

Developed under Yuktishaalaa AI Lab by Sandeep Miriyala, AksharaTantra explores how open-source AI, WebAssembly, and modern web technologies can empower Indian languages and digital knowledge preservation.

Core Modules
1. Document Upload & Analysis

Upload and analyze documents directly in the browser.

Features

Supports PDF, DOCX, XLSX, PPTX

OCR-ready document analysis

Works with 34+ languages

Handwritten and printed text support

Privacy-first processing (no file storage)

2. Searchable Language OCR

Convert images and scanned documents into editable text.

Workflow

Upload image or scan

Automatic script detection

Instant text extraction

Technology

Tesseract OCR (primary engine)

PaddleOCR (fallback for complex text)

Supports

Images, scans, handwritten text

Multi-language documents

3. HTR Engine (Handwritten Text Recognition)

An advanced handwriting recognition module.

Key Features

Fully offline processing

No API keys required

Open-source models

Engines

Tesseract.js

TrOCR (ONNX in browser)

Includes preprocessing

Otsu binarization

Grayscale normalization

Image resizing for better recognition

4. RajaTantra OCR Engine

A powerful multi-language OCR engine designed for large scanned collections.

Capabilities

32+ languages including Telugu, Sanskrit, Hindi, English

Bulk OCR processing

Built-in editor for correction

Automatic spacing & Unicode cleanup

Vedic pitch mark support

Export formats

HTML

EPUB

JSON

5. Sanskrit OCR Tool

A dedicated OCR workflow for Sanskrit digitization.

Combines:

Document Upload & Analysis

Searchable Language OCR

Features

Fully offline Sanskrit OCR

Designed for Sanskrit manuscripts and printed texts

No cloud APIs required

6. AksharaTantra Voice

Create multilingual audio, video, and visual content instantly.

Capabilities

33 language support

Voice input transcription

Real Indic voices via TTS

Automatic MP4 video generation

Outputs

MP3 / WAV audio

MP4 video

PNG visual slide

Optimized for platforms

WhatsApp

Instagram Reels

YouTube Shorts

7. Vedha Telugu

A specialized module for digitizing Telugu Vedic texts with pitch marks.

Features

OCR extraction from mantra images

Vedic pitch mark tools

Structured book creation

Chapter organization

Output

Download as HTML Vedic text book

8. AksharaNama

A simple creative tool to generate personalized circular name badges.

Steps

Upload photo

Enter name

Download generated badge

9. AksharaChitra

An AI-powered multilingual poster maker designed for Indian languages.

Features

8+ Indian languages

52+ built-in Indic fonts

35+ templates

QR code generator

Image effects and cropping

Voice input

Smart OCR text extraction

Runs fully offline as a PWA.

Technology Stack

Next.js

WebAssembly (WASM)

Tesseract.js

PaddleOCR

TrOCR (ONNX runtime)

Google TTS integration

PWA architecture

Open-source AI models

Key Principles

Privacy First
All processing happens inside the browser.

Offline Capability
Many modules work without internet.

Open Ecosystem
Built using open-source AI technologies.

Indic Language Focus
Designed to support Indian linguistic diversity.

Vision

AksharaTantra aims to become a complete digital infrastructure for Indic knowledge systems, enabling tools for:

language preservation

manuscript digitization

AI-powered education

creative multilingual media

—all while keeping user privacy and open technology at the center.

Project

Yuktishaalaa AI Lab
Created by Sandeep Miriyala

🔗 https://aksharatantra.vercel.app

If you want, I can also create:

Short X (Twitter) post version

GitHub README version

IIIT-H R&D showcase style description

AI research paper abstract version

Those will help your project get more visibility.

Documentaiton 

Below is a clean documentation structure for AksharaTantra. You can use this for GitHub README, website docs, or project documentation.

AksharaTantra Documentation

AksharaTantra is a privacy-first AI toolkit for Indic languages that runs mostly inside your browser.
It provides tools for OCR, handwriting recognition, document analysis, voice generation, poster creation, and Vedic text digitization.

🌐 Project URL
https://aksharatantra.vercel.app

👨‍💻 Developed by
Sandeep Miriyala — Yuktishaalaa AI Lab

1. Overview

AksharaTantra is built to support Indian languages, manuscripts, and digital content creation while ensuring user privacy and offline capability.

Key goals:

Enable Indic language AI tools without cloud dependency

Provide offline OCR and AI utilities

Support digital preservation of manuscripts

Offer creative tools for multilingual content

2. Key Features

✔ Privacy-first processing
✔ Works inside the browser
✔ Many modules work offline
✔ Supports 32+ languages
✔ Open-source AI models
✔ No API keys required for most tools
✔ Progressive Web App (PWA)

3. System Requirements

Recommended:

RAM: 8 GB or more

CPU: 8 cores recommended

Modern Browser: Chrome / Edge / Firefox

File Size Limits:

Documents: 50 MB

Images: 8 MB each

4. Module Documentation
Module 1
Document Upload & Analysis

This module allows users to upload and analyze documents directly in the browser.

Supported formats:

PDF

DOCX

XLSX

PPTX

Features:

Extract text from documents

Prepare files for OCR

Multi-language document detection

Works with 34+ languages

Guidelines:

Upload documents under 50MB

Ensure scanned documents are clear

Avoid blurry or noisy images

Privacy:

All files are processed instantly and never stored on servers.

Module 2
Searchable Language OCR

Converts images and scanned documents into editable and searchable text.

Workflow:

1 Upload image
2 AI recognizes the script
3 Extracted text appears instantly

Supported Inputs:

JPG

PNG

BMP

TIFF

Scanned documents

Handwritten images

OCR Engines:

Tesseract OCR

Primary OCR engine optimized for printed text.

PaddleOCR

Automatically used when recognition confidence is low.

Privacy:

All processing happens inside your browser.

Module 3
HTR Engine (Handwritten Text Recognition)

Recognizes handwritten text using open-source models.

Features:

Fully offline recognition

No API keys

Open-source AI models

Limits:

Maximum 5 images

Maximum 8MB per image

Engines Used:

Tesseract.js
TrOCR (ONNX runtime)

Preprocessing:

Otsu binarization

Grayscale conversion

Image resizing

Noise reduction

Module 4
RajaTantra OCR Engine

Advanced OCR system for large scanned collections.

Features:

Supports 32+ languages

Bulk OCR processing

Smart Unicode cleanup

Built-in editor

Page reordering

Special Feature:

Vedic pitch marks

▲ High
▼ Low

Export Formats:

HTML

EPUB

JSON

Module 5
Sanskrit OCR Tool

Dedicated OCR workflow for Sanskrit texts and manuscripts.

Combines:

Document Upload & Analysis

Searchable Language OCR

Features:

Offline OCR

Supports Sanskrit scripts

Searchable Sanskrit text

Ideal for:

Sanskrit books

Manuscripts

Printed texts

Module 6
AksharaTantra Voice

Generates audio, video, and visual content from text or speech.

Supported Languages:

33 languages

Workflow:

1 Choose language
2 Speak or type text
3 Select platform format
4 Generate video/audio
5 Download output

Outputs:

MP3 audio

WAV audio

MP4 video

PNG image slide

Platforms supported:

WhatsApp

Instagram Reels

YouTube Shorts

Module 7
Vedha Telugu

A specialized tool for digitizing Telugu Vedic texts.

Features:

OCR extraction from mantra images

Add Vedic pitch marks

Organize chapters

Build structured digital books

Pitch Marks:

▲ High
▼ Low
⌒ Rising
〰 Extended

Export:

Download complete text as HTML book.

Module 8
AksharaNama

Create personalized circular name badges.

Steps:

1 Select photo
2 Type name
3 Download badge

Output:

Rounded badge image.

Module 9
AksharaChitra

AI-powered multilingual poster maker.

Features:

8+ Indian languages

52+ Indic fonts

35+ poster templates

QR code generator

Image cropping and effects

Voice input

OCR text extraction

Runs as a fully offline PWA.

5. Technology Stack

Frontend

Next.js

React

WebAssembly

AI & OCR

Tesseract.js

PaddleOCR

TrOCR

ONNX runtime

Other Technologies

Google TTS

PWA architecture

Client-side processing

6. Privacy & Security

AksharaTantra follows Privacy First Design.

Files are never uploaded to servers

All AI processing runs locally in the browser

No user data is stored

7. Use Cases

Digital Manuscript Preservation
Indic Language Research
Vedic Text Digitization
Multilingual Poster Creation
Voice Content Creation
Handwritten Document Digitization

8. Project Information

Project Name
AksharaTantra

Developed By
Sandeep Miriyala

Organization
Yuktishaalaa AI Lab

Project URL
https://aksharatantra.vercel.app
