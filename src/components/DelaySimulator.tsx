import React from 'react';
import { AlertCircle, SlidersHorizontal } from 'lucide-react';

interface DelaySimulatorProps {
  currentDelay: number;
  onSelectDelay: (minutes: number) => void;
}

export const DelaySimulator: React.FC<DelaySimulatorProps> = ({
  currentDelay,
  onSelectDelay,
}) => {
  const delayOptions = [
    { value: 0, label: '0m', desc: 'On-time schedule' },
    { value: 10, label: '+10m', desc: 'Minor congestion' },
    { value: 20, label: '+20m', desc: 'Moderate slowdown' },
    { value: 30, label: '+30m', desc: 'Severe disruption' },
  ];

  return (
    <div className="bg-[#0D1322] rounded-2xl border border-slate-800/90 shadow-xl shadow-black/40 p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-600/20 text-[#CCFF00] border border-blue-500/30">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              Delay Simulator
              {currentDelay > 0 && (
                <span className="text-xs font-mono font-bold text-black bg-[#CCFF00] px-2 py-0.5 rounded-md shadow-2xs">
                  +{currentDelay} min delay applied
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Test how unexpected track delays impact your campus arrival time and safety buffer.
            </p>
          </div>
        </div>

        {/* Disclaimer Note */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-[#070A12] px-2.5 py-1 rounded-lg border border-slate-800 shrink-0">
          <AlertCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span>Simulation model only · Not a live railway status feed</span>
        </div>
      </div>

      {/* Delay options button segmented grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {delayOptions.map((opt) => {
          const isActive = currentDelay === opt.value;
          return (
            <button
              key={`delay-${opt.value}`}
              type="button"
              onClick={() => onSelectDelay(opt.value)}
              className={`p-2.5 rounded-xl text-left transition-all cursor-pointer border ${
                isActive
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-900/50'
                  : 'bg-[#070A12] hover:bg-slate-800 text-slate-200 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span
                  className={`text-sm font-mono font-extrabold ${
                    isActive ? 'text-[#CCFF00]' : 'text-white'
                  }`}
                >
                  {opt.label}
                </span>
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-[#CCFF00] shadow-xs shadow-[#CCFF00]" />
                )}
              </div>
              <div
                className={`text-[11px] font-medium leading-tight ${
                  isActive ? 'text-blue-100' : 'text-slate-400'
                }`}
              >
                {opt.desc}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
