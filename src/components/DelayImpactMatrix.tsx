import React, { useState } from 'react';
import {
  Grid3X3,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
} from 'lucide-react';
import { JourneyQuery, TrainRecord } from '../types';
import { computeDelayMatrix } from '../utils/scheduler';

interface DelayImpactMatrixProps {
  matchingTrains: TrainRecord[];
  query: JourneyQuery;
}

export const DelayImpactMatrix: React.FC<DelayImpactMatrixProps> = ({
  matchingTrains,
  query,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const delaySteps = [0, 10, 20, 30];

  const matrixData = computeDelayMatrix(
    matchingTrains,
    {
      fromStation: query.fromStation,
      toStation: query.toStation,
      lectureTime: query.lectureTime,
      stationToCampusMinutes: query.stationToCampusMinutes,
      targetBufferMinutes: query.targetBufferMinutes,
    },
    delaySteps
  );

  if (matchingTrains.length === 0) return null;

  return (
    <div className="bg-[#0D1322] rounded-2xl border border-slate-800 shadow-xl shadow-black/40 overflow-hidden">
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 bg-[#090E1A]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-600 text-[#CCFF00] shadow-sm">
            <Grid3X3 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Delay Impact Matrix
              </h3>
              <span className="text-[11px] font-bold text-blue-300 bg-blue-950 border border-blue-700/80 px-2.5 py-0.5 rounded-full font-mono">
                Hackathon Analysis View
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Side-by-side resilience comparison across compounding railway delay scenarios.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer self-start sm:self-auto border border-slate-700"
        >
          {isExpanded ? 'Collapse Matrix' : 'Expand Matrix'}
        </button>
      </div>

      {isExpanded && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#070A12] border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 min-w-[200px]">Train Service</th>
                <th className="py-3 px-3 min-w-[120px] text-center">
                  0m Delay (On-time)
                </th>
                <th className="py-3 px-3 min-w-[120px] text-center">
                  +10m Delay
                </th>
                <th className="py-3 px-3 min-w-[120px] text-center">
                  +20m Delay
                </th>
                <th className="py-3 px-3 min-w-[120px] text-center">
                  +30m Severe Delay
                </th>
                <th className="py-3 px-4 min-w-[110px] text-center">
                  Resilience
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {matrixData.map(({ train, evaluations, isResilient }) => {
                return (
                  <tr
                    key={`matrix-${train.id}`}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Train Info */}
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-white">
                        {train.name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        Departs {train.departureTime} · Arrives {train.arrivalTime}
                      </div>
                    </td>

                    {/* Delay Columns */}
                    {delaySteps.map((delay) => {
                      const ev = evaluations[delay];
                      if (!ev) return <td key={delay} className="py-3 px-3 text-center text-slate-600">-</td>;

                      let cellBg = 'bg-[#CCFF00]/10 border border-[#CCFF00]/30 text-[#CCFF00]';
                      let icon = <CheckCircle2 className="w-3.5 h-3.5 text-[#CCFF00] shrink-0" />;

                      if (ev.suitability === 'tight') {
                        cellBg = 'bg-amber-950/70 border border-amber-700/80 text-amber-300';
                        icon = <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
                      } else if (ev.suitability === 'late') {
                        cellBg = 'bg-rose-950/70 border border-rose-700/80 text-rose-300';
                        icon = <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
                      }

                      return (
                        <td key={delay} className="py-3 px-3 text-center">
                          <div
                            className={`p-2 rounded-xl text-center inline-block min-w-[100px] transition-all ${cellBg}`}
                          >
                            <div className="flex items-center justify-center gap-1 font-mono font-bold text-xs">
                              {icon}
                              <span>ETA {ev.campusArrival}</span>
                            </div>
                            <div className="text-[10px] font-mono mt-0.5 opacity-90">
                              {ev.safetyBufferMinutes >= 0
                                ? `+${ev.safetyBufferMinutes}m buffer`
                                : `${ev.safetyBufferMinutes}m late`}
                            </div>
                          </div>
                        </td>
                      );
                    })}

                    {/* Resilience Verdict */}
                    <td className="py-3.5 px-4 text-center">
                      {isResilient ? (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#CCFF00] text-black font-black text-[11px] shadow-sm shadow-[#CCFF00]/20">
                          <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>All-Safe</span>
                        </div>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                          Delay-Prone
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
