import React from 'react';
import { ProcessedFrame } from '../types';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface Props {
  frames: ProcessedFrame[];
}

const FrameGrid: React.FC<Props> = ({ frames }) => {
  if (frames.length === 0) return null;

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-white mb-4">Frame Analysis</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-96 overflow-y-auto p-2 bg-slate-900/50 rounded-xl border border-slate-800">
        {frames.map((frame) => (
          <div 
            key={frame.id} 
            className={`relative group aspect-video rounded-md overflow-hidden border ${
              frame.status === 'completed' ? 'border-green-500/50' : 
              frame.status === 'analyzing' ? 'border-blue-500' : 'border-slate-700'
            }`}
          >
            <img 
              src={frame.dataUrl} 
              alt={`Frame at ${frame.time}s`} 
              className="w-full h-full object-cover opacity-75 group-hover:opacity-100 transition-opacity" 
            />
            
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-1 text-[10px] text-white font-mono truncate">
              {frame.time}s
            </div>

            {/* Status Indicator Overlay */}
            <div className="absolute top-1 right-1">
              {frame.status === 'analyzing' && <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />}
              {frame.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-green-400" />}
            </div>

            {/* Tooltip for description */}
            {frame.description && (
              <div className="absolute inset-0 bg-black/90 p-2 text-[10px] text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity overflow-hidden flex items-center justify-center text-center">
                {frame.description}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FrameGrid;