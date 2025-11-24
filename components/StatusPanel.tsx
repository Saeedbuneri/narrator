
import React, { useEffect, useState } from 'react';
import { ProcessingStats, APIUsageStats } from '../types';
import { Clock, Images, Loader2, Battery, BatteryWarning, Zap, RotateCcw } from 'lucide-react';
import { getQuotaStats, resetQuota } from '../services/gemini';

interface Props {
  stats: ProcessingStats;
}

const StatusPanel: React.FC<Props> = ({ stats }) => {
  const [quota, setQuota] = useState<APIUsageStats>(getQuotaStats());

  // Refresh quota stats periodically or when processing updates
  useEffect(() => {
    setQuota(getQuotaStats());
  }, [stats.analyzedFrames]);

  const handleReset = () => {
      resetQuota();
      setQuota(getQuotaStats());
  };

  const progress = stats.totalFrames > 0 
    ? (stats.analyzedFrames / stats.totalFrames) * 100 
    : 0;

  const quotaPercent = Math.min(100, (quota.usedFrames / quota.dailyLimit) * 100);

  return (
    <div className="space-y-6 mb-8">
      {/* Processing Progress */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            {stats.isProcessing && <Loader2 className="w-5 h-5 animate-spin text-blue-400" />}
            Processing Status
          </h3>
          <span className="text-slate-400 text-sm font-mono">
            {stats.analyzedFrames} / {stats.totalFrames} Frames
          </span>
        </div>

        <div className="w-full bg-slate-700 h-2 rounded-full mb-6 overflow-hidden">
          <div 
            className="bg-blue-500 h-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
            <div className="flex items-center gap-3 mb-1">
              <Images className="w-4 h-4 text-purple-400" />
              <span className="text-slate-400 text-xs uppercase tracking-wider">Queued</span>
            </div>
            <span className="text-2xl font-bold text-white">{stats.queuedFrames}</span>
          </div>
          
          <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
            <div className="flex items-center gap-3 mb-1">
              <Clock className="w-4 h-4 text-yellow-400" />
              <span className="text-slate-400 text-xs uppercase tracking-wider">Est. Wait</span>
            </div>
            <span className="text-2xl font-bold text-white">
              {stats.isProcessing ? `~${Math.ceil(stats.queuedFrames * 2.4)}s` : '--'}
            </span>
          </div>
        </div>
      </div>

      {/* Daily Quota Dashboard */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Daily API Quota
          </h3>
          <button 
            onClick={handleReset}
            className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-white"
            title="Reset Quota Limit"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex justify-between items-end mb-2">
            <span className={`text-sm font-mono ${quota.remainingFrames < 100 ? 'text-red-400' : 'text-green-400'}`}>
                {quota.remainingFrames.toLocaleString()} frames left
            </span>
        </div>

        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-200 bg-blue-900/50">
              Usage
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold inline-block text-blue-200">
                {Math.round(quotaPercent)}%
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-slate-700">
            <div 
              style={{ width: `${quotaPercent}%` }} 
              className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${quotaPercent > 90 ? 'bg-red-500' : 'bg-green-500'}`}
            ></div>
          </div>
        </div>

        <div className="flex justify-between items-center text-xs text-slate-500">
          <span className="flex items-center gap-1">
            {quotaPercent > 90 ? <BatteryWarning className="w-3 h-3" /> : <Battery className="w-3 h-3" />}
            Limit: {quota.dailyLimit.toLocaleString()} frames/day
          </span>
          <span>Resets at Midnight</span>
        </div>
      </div>
    </div>
  );
};

export default StatusPanel;
