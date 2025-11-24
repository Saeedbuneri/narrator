
import React, { useEffect, useRef, useState } from 'react';
import { CommentaryResult } from '../types';
import { Play, Pause, Download, Sparkles, Edit2, Save, X, RefreshCw, FileText } from 'lucide-react';
import { decodeAudioData, decodeBase64, createWavBlob } from '../utils/audioUtils';

interface Props {
  result: CommentaryResult | null;
  isGenerating: boolean;
  onUpdateCommentary?: (newText: string) => Promise<void>;
}

const CommentaryResultDisplay: React.FC<Props> = ({ result, isGenerating, onUpdateCommentary }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [isRegeneratingAudio, setIsRegeneratingAudio] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [subtitleUrl, setSubtitleUrl] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    if (result) {
      setEditedText(result.text);
      if (result.subtitles) {
        const blob = new Blob([result.subtitles], { type: 'text/srt' });
        const url = URL.createObjectURL(blob);
        setSubtitleUrl(url);
      }
    }
    return () => {
        if (subtitleUrl) URL.revokeObjectURL(subtitleUrl);
    }
  }, [result]);

  useEffect(() => {
    if (result?.audioBase64 && !isPlaying && !isEditing && !isRegeneratingAudio) {
      const timer = setTimeout(() => {
         playAudio();
      }, 500);
      
      const wavBlob = createWavBlob(result.audioBase64, 24000);
      const url = URL.createObjectURL(wavBlob);
      setDownloadUrl(url);
      
      return () => {
        clearTimeout(timer);
        URL.revokeObjectURL(url);
      };
    }
  }, [result?.audioBase64]);

  const playAudio = async () => {
    if (!result?.audioBase64) return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      }

      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') await ctx.resume();

      stopAudio();

      const audioBytes = decodeBase64(result.audioBase64);
      const audioBuffer = await decodeAudioData(audioBytes, ctx, 24000, 1);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      
      source.onended = () => setIsPlaying(false);
      
      source.start(0);
      sourceNodeRef.current = source;
      setIsPlaying(true);

    } catch (error) {
      console.error("Playback failed", error);
      setIsPlaying(false);
    }
  };

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch (e) { /* ignore */ }
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
  };

  const handleSaveEdit = async () => {
    if (!onUpdateCommentary) return;
    
    stopAudio();
    setIsEditing(false);
    setIsRegeneratingAudio(true);
    
    try {
      await onUpdateCommentary(editedText);
    } catch (err) {
      console.error("Failed to regenerate audio", err);
    } finally {
      setIsRegeneratingAudio(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedText(result?.text || '');
  };

  if (!result && !isGenerating) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-xl p-8 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-400" />
          <h2 className="text-xl font-bold text-white">AI Commentary</h2>
        </div>
        
        {!isGenerating && !isRegeneratingAudio && !isEditing && result && (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 text-xs font-medium text-indigo-300 hover:text-white bg-indigo-500/20 hover:bg-indigo-500/40 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Edit2 className="w-3 h-3" />
            Edit Script
          </button>
        )}
      </div>

      {isGenerating || isRegeneratingAudio ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-indigo-300 animate-pulse" />
            </div>
          </div>
          <p className="text-indigo-200 animate-pulse">
            {isGenerating ? "Synthesizing narrative & subtitles..." : "Regenerating voice-over..."}
          </p>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {isEditing ? (
            <div className="bg-black/40 p-4 rounded-lg border border-indigo-500/50 backdrop-blur-sm">
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="w-full h-48 bg-transparent text-indigo-100 font-serif text-lg leading-relaxed outline-none resize-y"
                placeholder="Edit the commentary script here..."
              />
              <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-white/10">
                <button 
                  onClick={handleCancelEdit}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
                <button 
                  onClick={handleSaveEdit}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all"
                >
                  <RefreshCw className="w-4 h-4" /> Regenerate Audio
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-black/20 p-6 rounded-lg border border-white/5 backdrop-blur-sm">
              <p className="text-lg text-indigo-100 leading-relaxed font-serif italic">
                "{result?.text}"
              </p>
            </div>
          )}

          {!isEditing && (
            <div className="flex items-center gap-4 flex-wrap">
              <button
                onClick={isPlaying ? stopAudio : playAudio}
                disabled={!result?.audioBase64}
                className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white px-6 py-3 rounded-full font-medium transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                {isPlaying ? 'Stop' : 'Play'}
              </button>

              {downloadUrl && (
                <a
                  href={downloadUrl}
                  download="commentary.wav" 
                  className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-full font-medium transition-all shadow-lg"
                >
                  <Download className="w-5 h-5" />
                  Audio
                </a>
              )}

              {subtitleUrl && (
                <a
                    href={subtitleUrl}
                    download="subtitles.srt"
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-6 py-3 rounded-full font-medium transition-all shadow-lg border border-slate-600"
                >
                    <FileText className="w-5 h-5" />
                    SRT
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentaryResultDisplay;
