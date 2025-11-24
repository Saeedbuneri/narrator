
import React from 'react';
import { CommentarySettings } from '../types';
import { LANGUAGES, THEMES, TONES } from '../constants';
import { Sliders, Clapperboard, Globe, MessageSquare } from 'lucide-react';

interface Props {
  settings: CommentarySettings;
  onSettingsChange: (newSettings: CommentarySettings) => void;
  onRegenerate: () => void;
  isGenerating: boolean;
  hasAnalyzedFrames: boolean;
}

const CommentaryOptions: React.FC<Props> = ({ 
  settings, 
  onSettingsChange, 
  onRegenerate,
  isGenerating,
  hasAnalyzedFrames
}) => {
  
  const handleChange = (key: keyof CommentarySettings, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const handleMovieConfigChange = (key: string, value: string) => {
    onSettingsChange({
      ...settings,
      movieConfig: {
        title: key === 'title' ? value : settings.movieConfig?.title || '',
        characterName: key === 'characterName' ? value : settings.movieConfig?.characterName || ''
      }
    });
  };

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 mb-8">
      <div className="flex items-center gap-2 mb-6 text-white">
        <Sliders className="w-5 h-5 text-blue-400" />
        <h3 className="font-semibold">Commentary Configuration</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Language */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <Globe className="w-4 h-4" /> Language
          </label>
          <select 
            value={settings.language}
            onChange={(e) => handleChange('language', e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
          >
            {LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
        </div>

        {/* Tone */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <MessageSquare className="w-4 h-4" /> Tone
          </label>
          <select 
            value={settings.tone}
            onChange={(e) => handleChange('tone', e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
          >
            {TONES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>

        {/* Theme */}
        <div className="space-y-2 md:col-span-2">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
            <Clapperboard className="w-4 h-4" /> Theme
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {THEMES.map(t => (
              <button
                key={t.id}
                onClick={() => handleChange('theme', t.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  settings.theme === t.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' 
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Context Inputs */}
        {settings.theme === 'movie' ? (
          <div className="md:col-span-2 bg-indigo-900/20 p-4 rounded-lg border border-indigo-500/30 animate-in fade-in slide-in-from-top-2">
            <h4 className="text-indigo-300 text-sm font-semibold mb-3">Movie Mode Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Movie Title</label>
                <input 
                  type="text"
                  placeholder="e.g. The Matrix"
                  value={settings.movieConfig?.title}
                  onChange={(e) => handleMovieConfigChange('title', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Main Character Name</label>
                <input 
                  type="text"
                  placeholder="e.g. Neo"
                  value={settings.movieConfig?.characterName}
                  onChange={(e) => handleMovieConfigChange('characterName', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="md:col-span-2">
             <label className="block text-sm font-medium text-slate-300 mb-2">
                Video Context (Optional)
             </label>
             <input 
                type="text"
                placeholder="e.g. CCTV footage of a robbery, A family vacation vlog..."
                value={settings.videoContext}
                onChange={(e) => handleChange('videoContext', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:border-blue-500 outline-none"
             />
          </div>
        )}
      </div>

      {hasAnalyzedFrames && (
        <button
          onClick={onRegenerate}
          disabled={isGenerating}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Regenerating...' : 'Regenerate Commentary'}
        </button>
      )}
    </div>
  );
};

export default CommentaryOptions;
