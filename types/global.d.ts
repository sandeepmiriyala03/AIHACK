// Global typings for custom modules and browser APIs

declare module 'cropperjs/dist/cropper.css';

// add general module declarations to avoid TS errors for CSS or images
declare module '*.css';

declare module '*.png';
declare module '*.svg';

declare module '*.jpg';
declare module '*.jpeg';

declare module '*.gif';

declare module '*.webp';

// speech recognition types (non-standard)
interface Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

declare var SpeechRecognition: any;
declare var SpeechRecognitionEvent: any;
