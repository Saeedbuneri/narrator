
import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import StatusPanel from './components/StatusPanel';
import FrameGrid from './components/FrameGrid';
import CommentaryResultDisplay from './components/CommentaryResult';
import CommentaryOptions from './components/CommentaryOptions';
import { extractFrames } from './utils/videoUtils';
import { FrameQueueManager, generateCommentary, generateSpeech } from './services/gemini';
import { ProcessedFrame, ProcessingStats, CommentaryResult, CommentarySettings } from './types';
import { Upload, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [frames, setFrames] = useState<ProcessedFrame[]>([]);
  const [commentary, setCommentary] = useState<CommentaryResult | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finalizationAttempted, setFinalizationAttempted] = useState(false);

  // Default Settings
  const [settings, setSettings] = useState<CommentarySettings>({
    language: 'en-US',
    theme: 'standard',
    tone: 'assertive',
    voiceGender: 'male',
    videoContext: '',
    movieConfig: { title: '', characterName: '' }
  });

  const queueManagerRef = useRef<FrameQueueManager | null>(null);

  useEffect(() => {
    queueManagerRef.current = new FrameQueueManager((id, description) => {
      if (id === -1 && description === "DAILY QUOTA EXCEEDED") {
        setError("You have reached your daily API quota limit. Please come back tomorrow!");
        return;
      }

      setFrames(prev => prev.map(f => 
        f.id === id ? { ...f, status: 'completed', description } : f
      ));
    });

    return () => {
      queueManagerRef.current?.clear();
    };
  }, []);

  useEffect(() => {
    const allCompleted = frames.length > 0 && frames.every(f => f.status === 'completed');
    const hasNoCommentary = !commentary && !isSynthesizing;
    const hasError = !!error;

    if (allCompleted && hasNoCommentary && !hasError && !finalizationAttempted) {
      finalizeCommentary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frames, commentary, isSynthesizing, error, finalizationAttempted]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setError("Please upload a valid video file.");
      return;
    }

    setError(null);
    setIsExtracting(true);
    setFrames([]);
    setCommentary(null);
    setFinalizationAttempted(false);
    queueManagerRef.current?.clear();

    try {
      const extractedFrames = await extractFrames(file, (progress) => {
        console.log(`Extraction progress: ${progress}%`);
      });
      setFrames(extractedFrames);
      queueManagerRef.current?.addToQueue(extractedFrames);
    } catch (err) {
      console.error(err);
      setError("Failed to process video.");
    } finally {
      setIsExtracting(false);
    }
  };

  const finalizeCommentary = async () => {
    setFinalizationAttempted(true);
    setIsSynthesizing(true);
    setError(null);
    
    try {
      const validFrames = frames.filter(f => f.description && !f.description.includes("Error"));
      
      if (validFrames.length === 0) {
        if (frames.length > 0) {
             throw new Error("Analysis Failed: The API could not interpret the frames. Please check your internet connection.");
        } else {
             throw new Error("No frames were extracted to analyze.");
        }
      }

      const descriptions = validFrames.map(f => ({ time: f.time, text: f.description || '' }));
      
      // 1. Generate Text & Subtitles (JSON)
      const result = await generateCommentary(descriptions, settings);
      
      // 2. Generate Audio
      const audioBase64 = await generateSpeech(result.text, settings);

      setCommentary({ ...result, audioBase64 });

    } catch (err: any) {
      console.error("Finalization Error:", err);
      let message = "Failed to generate final commentary.";
      
      if (typeof err === 'string') {
          message = err;
      } else if (err.message) {
          if (err.message.includes("API key")) {
            message = "API Key Error: The provided API key is invalid or expired.";
          } else if (err.message.includes("Analysis Failed")) {
            message = err.message;
          } else if (err.message.includes("No frames")) {
            message = "Video Error: Could not extract frames from this video.";
          }
      }
      setError(message);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleUpdateCommentary = async (newText: string) => {
      if (!newText.trim()) return;
      try {
          const audioBase64 = await generateSpeech(newText, settings);
          // Keep existing subtitles if text changes, though they might be slightly out of sync
          setCommentary(prev => prev ? { ...prev, text: newText, audioBase64 } : null);
      } catch (err) {
          console.error("Error regenerating audio:", err);
          setError("Failed to regenerate audio.");
      }
  };

  const handleRegenerate = () => {
     setCommentary(null);
     setFinalizationAttempted(false);
  };

  const stats: ProcessingStats = {
    totalFrames: frames.length,
    analyzedFrames: frames.filter(f => f.status === 'completed').length,
    queuedFrames: frames.filter(f => f.status === 'pending').length,
    isProcessing: frames.some(f => f.status === 'pending'),
    estimatedTimeRemaining: 0
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 pb-20">
      <div className="max-w-6xl mx-auto px-6">
        <Header />

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-lg mb-6 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 shadow-lg shadow-red-900/20">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 border-dashed hover:border-blue-500/50 transition-colors group relative">
              <input 
                type="file" 
                accept="video/*"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                disabled={isExtracting || stats.isProcessing}
              />
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="bg-slate-700 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="font-semibold text-white mb-1">Upload Video</h3>
                <p className="text-sm text-slate-400">Any length accepted</p>
              </div>
            </div>
            <StatusPanel stats={stats} />
          </div>

          <div className="lg:col-span-2">
             <CommentaryOptions 
                settings={settings} 
                onSettingsChange={setSettings} 
                onRegenerate={handleRegenerate}
                isGenerating={isSynthesizing}
                hasAnalyzedFrames={stats.analyzedFrames > 0 && stats.analyzedFrames === stats.totalFrames}
             />

             {frames.length === 0 && !isExtracting && (
               <div className="h-64 flex items-center justify-center bg-slate-900/30 rounded-xl border border-slate-800/50 p-12 text-center">
                 <div className="max-w-md">
                   <h2 className="text-xl font-semibold text-slate-300 mb-2">Ready to Narrate</h2>
                   <p className="text-slate-500">Upload a video, customize your settings, and let AI tell the story.</p>
                 </div>
               </div>
             )}

             {isExtracting && (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                  <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                  <p className="text-blue-300 animate-pulse">Extracting frames...</p>
                </div>
             )}

             {frames.length > 0 && (
               <>
                <CommentaryResultDisplay 
                    result={commentary} 
                    isGenerating={isSynthesizing} 
                    onUpdateCommentary={handleUpdateCommentary}
                />
                <div className="mt-8">
                  <FrameGrid frames={frames} />
                </div>
               </>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
