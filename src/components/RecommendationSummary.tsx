import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Info,
} from 'lucide-react';
import { CommuteEvaluation, JourneyQuery } from '../types';

interface RecommendationSummaryProps {
  recommended: CommuteEvaluation | null;
  leastRiskyAlternative: CommuteEvaluation | null;
  hasSuitableTrain: boolean;
  summaryReason: string;
  query: JourneyQuery;
}

export const RecommendationSummary: React.FC<RecommendationSummaryProps> = ({
  recommended,
  leastRiskyAlternative,
  hasSuitableTrain,
  summaryReason,
  query,
}) => {
  const activePick = recommended || leastRiskyAlternative;

  if (!activePick) {
    return (
      <div className="bg-[#0D1322] rounded-2xl border border-dashed border-slate-700 p-8 text-center text-slate-400">
        <Info className="w-8 h-8 text-blue-400 mx-auto mb-2" />
        <h3 className="text-base font-semibold text-white">No Matching Trains Found</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
          No trains are scheduled between <span className="font-semibold text-white">{query.fromStation}</span> and{' '}
          <span className="font-semibold text-white">{query.toStation}</span>. Try changing your boarding station or add this route in "Manage Train Data".
        </p>
      </div>
    );
  }

  const isSafe = hasSuitableTrain && recommended !== null;
  const isTight = !isSafe && activePick.suitability === 'tight';
  const isLate = !isSafe && activePick.suitability === 'late';

  return (
    <div
      className={`rounded-2xl border transition-all p-5 sm:p-6 shadow-xl ${
        isSafe
          ? 'bg-gradient-to-br from-[#0B101D] via-[#090D18] to-[#04060B] border-blue-500/40 text-white shadow-blue-950/30'
          : isTight
          ? 'bg-gradient-to-br from-[#1C1608] to-[#0A0702] text-amber-50 border-amber-600/40 shadow-amber-950/30'
          : 'bg-gradient-to-br from-[#1F0A0D] to-[#0A0304] text-rose-50 border-rose-600/40 shadow-rose-950/30'
      }`}
    >
      {/* Top Banner Tag */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          {isSafe && (
            <div className="flex items-center gap-1.5 text-xs font-black text-black bg-[#CCFF00] px-3 py-1 rounded-lg border border-[#CCFF00] shadow-md shadow-[#CCFF00]/20">
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>Recommended Commute Pick</span>
            </div>
          )}
          {isTight && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950 bg-amber-400 px-3 py-1 rounded-lg border border-amber-300">
              <AlertTriangle className="w-4 h-4" />
              <span>Caution: Tight Commute Window</span>
            </div>
          )}
          {isLate && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-white bg-rose-600 px-3 py-1 rounded-lg border border-rose-500">
              <XCircle className="w-4 h-4" />
              <span>Critical: Reaches Campus After Lecture</span>
            </div>
          )}

          {activePick.delayMinutes > 0 && (
            <span className="text-xs font-mono font-bold text-blue-200 bg-blue-950/80 px-2 py-0.5 rounded-md border border-blue-800">
              Simulated +{activePick.delayMinutes}m delay
            </span>
          )}
        </div>

        <div className="text-xs text-slate-300 font-mono">
          First Lecture at <span className="font-extrabold text-[#CCFF00]">{query.lectureTime}</span>
        </div>
      </div>

      {/* Main Train Details & Metrics */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Column: Train Identity */}
        <div className="lg:col-span-5">
          <div className="text-xs text-blue-300 font-medium mb-1 flex items-center gap-2">
            <span>{activePick.train.number ? `Train #${activePick.train.number}` : 'Local Commuter'}</span>
            <span>·</span>
            <span className="text-slate-300">{activePick.train.fromStation} → {activePick.train.toStation}</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">
            {activePick.train.name}
          </h2>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            {summaryReason}
          </p>

          {/* Quick countdown badge if not yet departed */}
          {(() => {
            const now = new Date();
            const currSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
            const depParts = activePick.scheduledDeparture.split(':').map((p) => parseInt(p, 10) || 0);
            const depSeconds = depParts[0] * 3600 + depParts[1] * 60;
            const arrParts = activePick.adjustedArrival.split(':').map((p) => parseInt(p, 10) || 0);
            let arrSeconds = arrParts[0] * 3600 + arrParts[1] * 60;
            if (arrSeconds < depSeconds) arrSeconds += 86400;

            if (currSeconds < depSeconds) {
              const diffSec = arrSeconds - currSeconds;
              const h = Math.floor(diffSec / 3600);
              const m = Math.floor((diffSec % 3600) / 60);
              const s = diffSec % 60;
              const countdownStr = h > 0 ? `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s` : `${m}m ${s.toString().padStart(2, '0')}s`;

              return (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-950/70 border border-blue-500/40 text-xs font-mono text-[#CCFF00]">
                  <Clock className="w-3.5 h-3.5 text-[#CCFF00] shrink-0" />
                  <span className="text-slate-300 font-sans text-[11px]">Time until arrival:</span>
                  <span className="font-extrabold text-white tabular-nums">{countdownStr}</span>
                </div>
              );
            }
            return null;
          })()}
        </div>

        {/* Right Column: Time Breakdown Strip */}
        <div className="lg:col-span-7 bg-black/40 rounded-xl p-4 border border-white/10 backdrop-blur-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {/* Boarding Departure */}
            <div className="p-2">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-0.5">
                Departs {activePick.train.fromStation}
              </span>
              <span className="text-lg font-mono font-bold text-white tabular-nums">
                {activePick.scheduledDeparture}
              </span>
            </div>

            {/* Station Arrival (Scheduled vs Adjusted) */}
            <div className="p-2">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-0.5">
                Station Arrival
              </span>
              <span className="text-lg font-mono font-bold text-white tabular-nums">
                {activePick.adjustedArrival}
              </span>
              {activePick.delayMinutes > 0 && (
                <span className="text-[10px] font-mono text-slate-400 block line-through">
                  Sched: {activePick.scheduledArrival}
                </span>
              )}
            </div>

            {/* Campus Arrival */}
            <div className="p-2">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-0.5">
                Campus ETA
              </span>
              <span className="text-lg font-mono font-extrabold text-[#CCFF00] tabular-nums">
                {activePick.campusArrival}
              </span>
              <span className="text-[10px] text-slate-400 block">
                +{query.stationToCampusMinutes}m transit
              </span>
            </div>

            {/* Safety Buffer */}
            <div className={`p-2 rounded-lg ${
              isSafe
                ? 'bg-blue-950/80 border border-blue-600/50'
                : isTight
                ? 'bg-amber-950/80 border border-amber-600/50'
                : 'bg-rose-950/80 border border-rose-600/50'
            }`}>
              <span className="text-[11px] uppercase tracking-wider font-semibold block mb-0.5 text-slate-300">
                Safety Buffer
              </span>
              <span
                className={`text-lg font-mono font-black tabular-nums ${
                  isSafe
                    ? 'text-[#CCFF00]'
                    : isTight
                    ? 'text-amber-300'
                    : 'text-rose-300'
                }`}
              >
                {activePick.safetyBufferMinutes >= 0
                  ? `${activePick.safetyBufferMinutes}m`
                  : `-${Math.abs(activePick.safetyBufferMinutes)}m`}
              </span>
              <span className="text-[10px] block opacity-80">
                {activePick.safetyBufferMinutes >= query.targetBufferMinutes
                  ? 'Safe Margin'
                  : activePick.safetyBufferMinutes >= 0
                  ? 'Risky Margin'
                  : 'Missed Class'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
