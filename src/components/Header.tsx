import React from 'react';
import { Train, Database, CalendarDays, Download } from 'lucide-react';
import { useTrains } from '../context/TrainContext';

interface HeaderProps {
  onOpenDataManager: () => void;
  onOpenClassPresets: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenDataManager,
  onOpenClassPresets,
}) => {
  const { isDemoMode, stats, exportToCSV } = useTrains();

  return (
    <header className="border-b border-slate-800/90 bg-[#0A0F1D]/95 backdrop-blur-md sticky top-0 z-30 shadow-lg shadow-black/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-[#CCFF00] flex items-center justify-center shadow-md shadow-blue-950">
              <Train className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-white">
                  Rail<span className="text-[#CCFF00]">Mate</span>
                </span>
                {isDemoMode ? (
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-blue-950/80 text-blue-300 border border-blue-800/60">
                    Sample Demo Data
                  </span>
                ) : (
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/30 font-mono">
                    Custom Schedule ({stats.totalTrains})
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Your commute, planned around your classes.
              </p>
            </div>
          </div>

          {/* Zone 2: Fast Action Nav */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={onOpenClassPresets}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-700 hover:text-white border border-slate-700/80 rounded-xl transition-all whitespace-nowrap cursor-pointer"
              title="View & select your weekly class timetable presets"
            >
              <CalendarDays className="w-3.5 h-3.5 text-[#CCFF00]" />
              <span>Weekly Classes</span>
            </button>

            <button
              onClick={exportToCSV}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 rounded-xl transition-all whitespace-nowrap cursor-pointer"
              title="Download current schedule as CSV"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Export CSV</span>
            </button>

            {/* Zone 3: Primary CTA */}
            <button
              onClick={onOpenDataManager}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-900/40 border border-blue-500 transition-all whitespace-nowrap cursor-pointer hover:shadow-blue-600/30"
            >
              <Database className="w-3.5 h-3.5 text-[#CCFF00]" />
              <span>Manage Train Data</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
