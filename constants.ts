
// --- API KEY MANAGEMENT ---
// Change this single variable when your quota is exceeded
export const API_KEY = "AIzaSyC8WH8un77U6K2T9wt7WHa5wvawPBPberQ";

// Rate limiting: 25 requests per minute
export const RATE_LIMIT_RPM = 25;
export const REQUEST_INTERVAL_MS = (60000 / RATE_LIMIT_RPM) + 100; 

// Daily Quota (Increased to 50,000 to effectively remove limit for testing)
export const DAILY_FRAME_LIMIT = 50000; 

export const GEMINI_FLASH_MODEL = 'gemini-2.5-flash';
export const GEMINI_PRO_MODEL = 'gemini-3-pro-preview';
export const GEMINI_TTS_MODEL = 'gemini-2.5-flash-preview-tts';

export const LANGUAGES = [
  { id: 'en-US', label: 'English (US)', prompt: 'English' },
  { id: 'hi-IN', label: 'Hindi (हिंदी)', prompt: 'Hindi (Devanagari script)' },
  { id: 'ur-PK', label: 'Urdu (اردو)', prompt: 'Urdu' },
  { id: 'ps-AF', label: 'Pashto (پښتو)', prompt: 'Pashto' },
];

export const GENDER_OPTIONS = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
];

export const THEMES = [
  { id: 'standard', label: 'Standard Narration' },
  { id: 'movie', label: 'Movie / Cinematic' },
  { id: 'documentary', label: 'Nature Documentary' },
  { id: 'sports', label: 'Sports Commentary' },
  { id: 'horror', label: 'Horror / Thriller' },
  { id: 'comedy', label: 'Comedy / Roasting' },
];

export const TONES = [
  { id: 'assertive', label: 'Assertive & Deep' },
  { id: 'excited', label: 'Excited & High Energy' },
  { id: 'calm', label: 'Calm & Soothing' },
  { id: 'sarcastic', label: 'Sarcastic & Witty' },
  { id: 'dramatic', label: 'Dramatic & Intense' },
  { id: 'asmr', label: 'ASMR / Soft Whisper' },
];
