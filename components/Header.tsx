import React from 'react';
import { Video, Sparkles } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-between py-6 border-b border-slate-800 mb-8">
      <div className="flex items-center gap-3">
        <div className="bg-blue-600 p-2 rounded-lg">
          <Video className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Gemini Video Narrator</h1>
          <p className="text-slate-400 text-sm">AI-powered scene analysis and commentary</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs font-medium text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
        <Sparkles className="w-3 h-3" />
        <span>Gemini 2.5 + 3 Pro</span>
      </div>
    </header>
  );
};

export default Header;