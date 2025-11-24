
export interface ProcessedFrame {
  id: number;
  time: number; // Timestamp in seconds
  dataUrl: string; // Base64 image data
  description?: string;
  status: 'pending' | 'analyzing' | 'completed' | 'error';
}

export interface ProcessingStats {
  totalFrames: number;
  analyzedFrames: number;
  queuedFrames: number;
  isProcessing: boolean;
  estimatedTimeRemaining: number; // seconds
}

export interface APIUsageStats {
  usedFrames: number;
  dailyLimit: number;
  remainingFrames: number;
  resetTime: string;
}

export interface CommentarySettings {
  language: string;
  theme: string;
  tone: string;
  voiceGender?: 'male' | 'female';
  videoContext: string; // e.g. "A vlog", "CCTV footage"
  movieConfig?: {
    title: string;
    characterName: string;
  };
}

export interface CommentaryResult {
  text: string;
  subtitles?: string; // SRT formatted string
  audioBase64?: string;
}
