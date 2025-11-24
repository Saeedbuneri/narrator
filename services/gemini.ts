
import { GoogleGenAI } from "@google/genai";
import { 
  API_KEY,
  RATE_LIMIT_RPM, 
  REQUEST_INTERVAL_MS, 
  GEMINI_FLASH_MODEL, 
  GEMINI_PRO_MODEL, 
  GEMINI_TTS_MODEL,
  DAILY_FRAME_LIMIT,
  LANGUAGES,
  TONES
} from '../constants';
import { ProcessedFrame, CommentarySettings, APIUsageStats, CommentaryResult } from '../types';
import { generateSRT } from '../utils/subtitleUtils';

// --- CONFIGURATION ---
// Initialize SDK Client with the centralized key
const ai = new GoogleGenAI({ apiKey: API_KEY });

/* --- Quota Management --- */
const QUOTA_KEY = 'gemini_app_daily_quota';

export const getQuotaStats = (): APIUsageStats => {
  const today = new Date().toISOString().split('T')[0];
  const stored = localStorage.getItem(QUOTA_KEY);
  let data = { date: today, count: 0 };

  if (stored) {
    const parsed = JSON.parse(stored);
    if (parsed.date === today) {
      data = parsed;
    } else {
      // New day, reset count
      localStorage.setItem(QUOTA_KEY, JSON.stringify(data));
    }
  } else {
    localStorage.setItem(QUOTA_KEY, JSON.stringify(data));
  }

  return {
    usedFrames: data.count,
    dailyLimit: DAILY_FRAME_LIMIT,
    remainingFrames: Math.max(0, DAILY_FRAME_LIMIT - data.count),
    resetTime: 'Midnight Local Time'
  };
};

const incrementQuota = () => {
  const stats = getQuotaStats();
  const newData = { date: new Date().toISOString().split('T')[0], count: stats.usedFrames + 1 };
  localStorage.setItem(QUOTA_KEY, JSON.stringify(newData));
};

export const resetQuota = () => {
  const today = new Date().toISOString().split('T')[0];
  const newData = { date: today, count: 0 };
  localStorage.setItem(QUOTA_KEY, JSON.stringify(newData));
};

/* --- API Services --- */

export const analyzeFrame = async (base64Data: string): Promise<string> => {
  try {
    incrementQuota(); // Track usage
    const cleanBase64 = base64Data.split(',')[1];
    
    const response = await ai.models.generateContent({
      model: GEMINI_FLASH_MODEL,
      contents: [{
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
          { text: "Describe this scene in one short sentence. Focus on action, setting, or key objects." }
        ]
      }]
    });

    return response.text || "Analysis failed.";
  } catch (error) {
    console.error("Error analyzing frame:", error);
    return "Error: Analysis API failed";
  }
};

export const generateCommentary = async (
  descriptions: {time: number, text: string}[], 
  settings: CommentarySettings
): Promise<CommentaryResult> => {
  try {
    const duration = descriptions.length > 0 ? descriptions[descriptions.length - 1].time : 60;
    const wordsPerSecond = settings.tone === 'asmr' ? 1.5 : 2.2;
    const targetWordCount = Math.min(Math.max(30, Math.floor(duration * wordsPerSecond)), 800); 

    const descriptionsText = descriptions
      .map(d => `[${d.time}s]: ${d.text}`)
      .join('\n');

    const langPrompt = LANGUAGES.find(l => l.id === settings.language)?.prompt || 'English';
    const toneLabel = TONES.find(t => t.id === settings.tone)?.label || 'Assertive';
    
    let contextInstruction = "";
    if (settings.tone === 'asmr') {
        contextInstruction = `
        STYLE: ASMR. 
        - Speak slowly, clearly, and softly, as if whispering.
        - Describe the scene in detail, including visual elements, motion, and subtle ambient details.
        - Add sensory words (e.g., "gentle rustle," "soft glow," "delicate movement").
        - Include slight pauses or phrasing that encourages a relaxed, immersive listening experience.
        - Avoid sudden loud words or abrupt statements.
        `;
    } else if (settings.theme === 'movie' && settings.movieConfig) {
      contextInstruction = `CONTEXT: Cinematic Movie "${settings.movieConfig.title}" starring "${settings.movieConfig.characterName}". Narrate plot details.`;
    } else if (settings.videoContext) {
      contextInstruction = `CONTEXT: ${settings.videoContext}`;
    } else {
      contextInstruction = `
      CONTEXT INFERENCE:
      - Analyze the provided frame descriptions to infer the setting (e.g., indoors, nature, city), the mood (e.g., calm, chaotic, joyful), and the flow of action.
      - Use this inferred context to build a coherent narrative structure.
      `;
    }

    let langInstruction = `Output strictly in ${langPrompt}.`;
    if (settings.language === 'ps-AF') {
        langInstruction += " Use Peshawari (Pakistani) dialect Pashto/Pukhto.";
    }

    const prompt = `
      ROLE: Expert video narrator.
      TASK: Generate a JSON response containing a cohesive voice-over script and a subtitle segmentation.
      
      INPUT DATA (Timeline):
      ${descriptionsText}

      SETTINGS:
      - Language: ${langInstruction}
      - Tone: ${toneLabel}
      - Theme: ${settings.theme}
      - Length: ~${targetWordCount} words
      - Context Instruction: ${contextInstruction}

      INSTRUCTIONS:
      1. Infer the story, mood, and setting from the input frames.
      2. Create a continuous 'script' text for the voice over.
      3. Create 'segments' for subtitles. Each segment must have a start time (seconds), end time (seconds), and text.
      4. Align segments roughly with the input timeline provided.

      IMPORTANT:
      - The output MUST be valid JSON.
      - Do not include markdown code blocks (like \`\`\`json). Just the raw JSON object.

      OUTPUT FORMAT (JSON ONLY):
      {
        "script": "Full narration text...",
        "segments": [
          { "start": 0, "end": 3, "text": "..." },
          ...
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: GEMINI_PRO_MODEL,
      contents: [{ parts: [{ text: prompt }] }],
      config: { responseMimeType: 'application/json' }
    });

    const rawText = response.text || "{}";
    let parsed;
    try {
        // Clean potential markdown code blocks if the model adds them despite instructions
        const cleanText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleanText);
    } catch (e) {
        console.error("Failed to parse JSON commentary:", rawText);
        // Fallback if JSON fails
        return { text: rawText, subtitles: "" };
    }

    const script = parsed.script || "Generation failed";
    const subtitles = parsed.segments ? generateSRT(parsed.segments) : "";

    return { text: script, subtitles };

  } catch (error) {
    console.error("Error generating commentary:", error);
    throw error;
  }
};

export const generateSpeech = async (text: string, settings: CommentarySettings): Promise<string> => {
  try {
    if (!text || text.trim().length === 0) {
      throw new Error("Cannot generate speech: Commentary text is empty.");
    }

    let voiceName = 'Fenrir'; 
    
    // Voice Selection Logic
    if (settings.voiceGender === 'female') {
        // Female Voices
        if (settings.tone === 'asmr' || settings.tone === 'calm') {
             voiceName = 'Kore'; // Soft, calm female
        } else if (settings.tone === 'excited' || settings.tone === 'dramatic') {
             voiceName = 'Puck'; // More energetic (closest approximation available)
             // Note: Gemini TTS currently has limited voices. Kore/Puck/Fenrir/Charon.
             // Kore = Female Calm, Puck = Female/Neutral Energetic? (Actually Puck is often listed as male-ish or neutral, but serves as a lighter alternative to Fenrir)
             // Let's map strictly:
             // Kore (Female), Fenrir (Male Deep), Puck (Male/Neutral), Charon (Male Deep)
             voiceName = 'Kore';
        } else {
             voiceName = 'Kore';
        }
    } else {
        // Male Voices
        if (settings.tone === 'asmr' || settings.tone === 'calm') {
             voiceName = 'Charon'; // Deep and steady
        } else if (settings.tone === 'excited') {
             voiceName = 'Puck'; // Lighter male
        } else {
             voiceName = 'Fenrir'; // Standard Assertive Male
        }
    }

    // ASMR Override for softest voices
    if (settings.tone === 'asmr') {
         voiceName = settings.voiceGender === 'female' ? 'Kore' : 'Charon';
    }

    const response = await ai.models.generateContent({
      model: GEMINI_TTS_MODEL,
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const audioPart = response.candidates?.[0]?.content?.parts?.[0];
    if (audioPart?.inlineData?.data) {
      return audioPart.inlineData.data;
    }

    throw new Error("No audio data received from Gemini API.");
  } catch (error) {
    console.error("TTS Error:", error);
    throw error;
  }
};

export class FrameQueueManager {
  private queue: ProcessedFrame[] = [];
  private isProcessing = false;
  private onFrameCompleted: (frameId: number, description: string) => void;

  constructor(onFrameCompleted: (frameId: number, description: string) => void) {
    this.onFrameCompleted = onFrameCompleted;
  }

  addToQueue(frames: ProcessedFrame[]) {
    this.queue.push(...frames);
    this.processQueue();
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const stats = getQuotaStats();
      if (stats.remainingFrames <= 0) {
        this.onFrameCompleted(-1, "DAILY QUOTA EXCEEDED");
        this.queue = [];
        break;
      }

      const frame = this.queue.shift();
      if (!frame) break;

      const startTime = Date.now();
      try {
        const description = await analyzeFrame(frame.dataUrl);
        this.onFrameCompleted(frame.id, description);
      } catch (err) {
        this.onFrameCompleted(frame.id, "Error: Analysis queue failed");
      }

      const elapsed = Date.now() - startTime;
      const waitTime = Math.max(0, REQUEST_INTERVAL_MS - elapsed);
      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    this.isProcessing = false;
  }

  clear() {
    this.queue = [];
    this.isProcessing = false;
  }
}
