import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Sparkles,
  Timer,
} from 'lucide-react';
import { CommuteEvaluation, JourneyQuery } from '../types';

interface TrainResultsProps {
  evaluations: CommuteEvaluation[];
  query: JourneyQuery;
  onSelectTrain?: (trainId: string) => void;
}

interface CountdownInfo {
  hasDeparted: boolean;
  timeUntilArrivalFormatted: string;
  timeUntilDepartureFormatted: string;
  arrivalSecondsRemaining: number;
  departureSecondsRemaining: number;
}

function calculateTrainCountdown(
  departureTime: string,
  adjustedArrivalTime: string,
  currentDate: Date
): CountdownInfo {
  const currentHours = currentDate.getHours();
  const currentMinutes = currentDate.getMinutes();
  const currentSeconds = currentDate.getSeconds();
  const currentTotalSeconds = currentHours * 3600 + currentMinutes * 60 + currentSeconds;

  const depParts = departureTime.split(':').map((p) => parseInt(p, 10) || 0);
  const depTotalSeconds = depParts[0] * 3600 + depParts[1] * 60;

  const arrParts = adjustedArrivalTime.split(':').map((p) => parseInt(p, 10) || 0);
  let arrTotalSeconds = arrParts[0] * 3600 + arrParts[1] * 60;
  if (arrTotalSeconds < depTotalSeconds) {
    arrTotalSeconds += 86400; // Crossed midnight
  }

  const hasDeparted = currentTotalSeconds >= depTotalSeconds;
  const depDiffSeconds = Math.max(0, depTotalSeconds - currentTotalSeconds);
  const arrDiffSeconds = Math.max(0, arrTotalSeconds - currentTotalSeconds);

  const formatSecs = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) {
      return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
    }
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  };

  return {
    hasDeparted,
    timeUntilArrivalFormatted: formatSecs(arrDiffSeconds),
    timeUntilDepartureFormatted: formatSecs(depDiffSeconds),
    arrivalSecondsRemaining: arrDiffSeconds,
    departureSecondsRemaining: depDiffSeconds,
  };
}

export const TrainResults: React.FC<TrainResultsProps> = ({
  evaluations,
  query,
}) => {
  // Live system clock ticking every second
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [simulatedHourMinute, setSimulatedHourMinute] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute effective date based on whether user enabled simulated test time or live system time
  const effectiveDate = React.useMemo(() => {
    if (!simulatedHourMinute) return currentDate;
    const [h, m] = simulatedHourMinute.split(':').map((v) => parseInt(v, 10) || 0);
    const d = new Date(currentDate);
    d.setHours(h);
    d.setMinutes(m);
    return d;
  }, [currentDate, simulatedHourMinute]);

  const formattedSystemTime = effectiveDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  if (evaluations.length === 0) {
    return (
      <div className="bg-[#0D1322] rounded-2xl border border-slate-800 p-8 text-center">
        <p className="text-sm text-slate-400">
          No trains match the current search criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header bar with Live System Clock and Legend */}
      <div className="bg-[#0D1322] p-3.5 sm:p-4 rounded-2xl border border-slate-800 shadow-xl shadow-black/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-600 text-[#CCFF00] shadow-sm">
            <Timer className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Matching Trains ({evaluations.length})
              </h3>
              <span className="text-[11px] font-mono font-bold text-[#CCFF00] bg-[#070A12] px-2.5 py-0.5 rounded-md flex items-center gap-1.5 border border-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] animate-pulse" />
                System Time: <span className="text-white">{formattedSystemTime}</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live countdown timers active for upcoming trains based on scheduled departure.
            </p>
          </div>
        </div>

        {/* Demo Time Test Controls for Hackathon evaluation */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 mr-1 hidden md:inline">
            Clock Source:
          </span>
          <button
            type="button"
            onClick={() => setSimulatedHourMinute(null)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
              simulatedHourMinute === null
                ? 'bg-blue-600 text-white border-blue-400 shadow-xs'
                : 'bg-[#070A12] text-slate-300 hover:bg-slate-800 border-slate-700'
            }`}
          >
            Live Device Clock
          </button>
          <button
            type="button"
            onClick={() => setSimulatedHourMinute('07:30')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
              simulatedHourMinute === '07:30'
                ? 'bg-[#CCFF00] text-black border-[#CCFF00] shadow-xs'
                : 'bg-[#070A12] text-slate-300 hover:bg-slate-800 border-slate-700'
            }`}
            title="Simulate 07:30 AM morning commuter rush to inspect all countdowns"
          >
            Demo 07:30 AM
          </button>
          <button
            type="button"
            onClick={() => setSimulatedHourMinute('08:05')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
              simulatedHourMinute === '08:05'
                ? 'bg-[#CCFF00] text-black border-[#CCFF00] shadow-xs'
                : 'bg-[#070A12] text-slate-300 hover:bg-slate-800 border-slate-700'
            }`}
            title="Simulate 08:05 AM to see both departed and remaining trains"
          >
            Demo 08:05 AM
          </button>
        </div>
      </div>

      {/* Train Cards List */}
      <div className="grid grid-cols-1 gap-3">
        {evaluations.map((evalItem) => {
          const { train } = evalItem;
          const isRec = evalItem.isRecommended;

          // Countdown calculation
          const countdown = calculateTrainCountdown(
            train.departureTime,
            evalItem.adjustedArrival,
            effectiveDate
          );

          let statusTheme = {
            border: 'border-slate-800 hover:border-slate-700',
            bg: 'bg-[#0D1322]',
            badgeBg: 'bg-[#CCFF00]/15 text-[#CCFF00] border-[#CCFF00]/40',
            badgeText: 'Suitable',
            badgeIcon: CheckCircle2,
            bufferColor: 'text-[#CCFF00]',
          };

          if (evalItem.suitability === 'tight') {
            statusTheme = {
              border: 'border-amber-900/60 hover:border-amber-700',
              bg: 'bg-[#141008]',
              badgeBg: 'bg-amber-950 text-amber-300 border-amber-700',
              badgeText: 'Tight Buffer',
              badgeIcon: AlertTriangle,
              bufferColor: 'text-amber-400',
            };
          } else if (evalItem.suitability === 'late') {
            statusTheme = {
              border: 'border-rose-900/60 hover:border-rose-700',
              bg: 'bg-[#16080A]',
              badgeBg: 'bg-rose-950 text-rose-300 border-rose-700',
              badgeText: 'Late Arrival',
              badgeIcon: XCircle,
              bufferColor: 'text-rose-400',
            };
          }

          if (isRec) {
            statusTheme.border = 'ring-2 ring-[#CCFF00] border-transparent shadow-xl shadow-[#CCFF00]/10';
          }

          const BadgeIcon = statusTheme.badgeIcon;

          return (
            <div
              key={train.id}
              className={`rounded-2xl p-4 sm:p-5 border transition-all ${statusTheme.bg} ${statusTheme.border}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3 pb-3 border-b border-slate-800">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-base font-extrabold text-white tracking-tight">
                      {train.name}
                    </h4>
                    {train.number && (
                      <span className="text-xs font-mono font-medium text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700">
                        #{train.number}
                      </span>
                    )}
                    {isRec && (
                      <span className="text-xs font-black text-black bg-[#CCFF00] px-2.5 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                        <Sparkles className="w-3 h-3 stroke-[2.5]" />
                        Top Recommendation
                      </span>
                    )}
                  </div>
                  {train.notes && (
                    <p className="text-xs text-slate-400 mt-1 leading-normal">
                      {train.notes}
                    </p>
                  )}
                </div>

                {/* Status indicator & Countdown container */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {/* Countdown Timer for trains that have NOT yet departed */}
                  {!countdown.hasDeparted ? (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-950 text-white font-mono shadow-xs border border-blue-500/40">
                      <Clock className="w-3.5 h-3.5 text-[#CCFF00] shrink-0" />
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-blue-200 font-sans text-[11px] font-medium">
                          Time until departure:
                        </span>
                        <span className="font-extrabold text-[#CCFF00] tabular-nums">
                          {countdown.timeUntilDepartureFormatted}
                        </span>
                      </div>
                      <span className="text-blue-400 text-xs">·</span>
                      <span className="text-[11px] font-sans text-slate-300">
                        arrives in {countdown.timeUntilArrivalFormatted}
                      </span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 font-mono text-[11px] border border-slate-700">
                      <span>Departed at {evalItem.scheduledDeparture}</span>
                    </div>
                  )}

                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${statusTheme.badgeBg}`}
                  >
                    <BadgeIcon className="w-3.5 h-3.5" />
                    <span>{statusTheme.badgeText}</span>
                  </div>
                </div>
              </div>

              {/* Commute Details Row */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
                {/* Boarding Departure */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block">
                    Departs {train.fromStation}
                  </span>
                  <div className="text-base font-mono font-bold text-white tabular-nums mt-0.5">
                    {evalItem.scheduledDeparture}
                  </div>
                  {!countdown.hasDeparted && (
                    <span className="text-[10px] font-mono text-[#CCFF00] font-semibold block mt-0.5">
                      in {countdown.timeUntilDepartureFormatted}
                    </span>
                  )}
                </div>

                {/* Destination Arrival */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block">
                    Station Arrival
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-base font-mono font-bold text-white tabular-nums">
                      {evalItem.adjustedArrival}
                    </span>
                    {evalItem.delayMinutes > 0 && (
                      <span className="text-[11px] font-mono text-slate-500 line-through">
                        {evalItem.scheduledArrival}
                      </span>
                    )}
                  </div>
                </div>

                {/* Journey Duration */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block">
                    Train Duration
                  </span>
                  <div className="text-base font-mono font-bold text-slate-200 tabular-nums mt-0.5">
                    {evalItem.journeyDurationMinutes} mins
                  </div>
                </div>

                {/* Campus ETA */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block">
                    Campus ETA
                  </span>
                  <div className="text-base font-mono font-extrabold text-[#CCFF00] tabular-nums mt-0.5">
                    {evalItem.campusArrival}
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    +{query.stationToCampusMinutes}m transit
                  </span>
                </div>

                {/* Safety Buffer */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block">
                    Class Buffer
                  </span>
                  <div className={`text-base font-mono font-black tabular-nums mt-0.5 ${statusTheme.bufferColor}`}>
                    {evalItem.safetyBufferMinutes >= 0
                      ? `+${evalItem.safetyBufferMinutes}m`
                      : `${evalItem.safetyBufferMinutes}m`}
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    vs. {query.lectureTime} lecture
                  </span>
                </div>
              </div>

              {/* Rationale strip */}
              {evalItem.rationale && (
                <div className="mt-3 pt-2.5 border-t border-slate-800 text-xs text-slate-300 flex items-start gap-1.5">
                  <span className="font-semibold text-blue-400 whitespace-nowrap">Assessment:</span>
                  <span>{evalItem.rationale}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
