import React from 'react';
import {
  MapPin,
  Clock,
  Navigation,
  Search,
  Sparkles,
  ArrowRightLeft,
} from 'lucide-react';
import { useTrains } from '../context/TrainContext';
import { JourneyQuery, WeeklyClassPreset } from '../types';

interface JourneyPlannerProps {
  query: JourneyQuery;
  onChangeQuery: (updated: Partial<JourneyQuery>) => void;
  onSearch: () => void;
  selectedPresetId: string | null;
  onSelectPreset: (preset: WeeklyClassPreset | null) => void;
}

export const JourneyPlanner: React.FC<JourneyPlannerProps> = ({
  query,
  onChangeQuery,
  onSearch,
  selectedPresetId,
  onSelectPreset,
}) => {
  const { allStations, allDestinations, classPresets } = useTrains();

  // Swap boarding and destination
  const handleSwapStations = () => {
    onChangeQuery({
      fromStation: query.toStation,
      toStation: query.fromStation,
    });
  };

  const handlePresetClick = (preset: WeeklyClassPreset) => {
    if (selectedPresetId === preset.id) {
      onSelectPreset(null);
    } else {
      onSelectPreset(preset);
      onChangeQuery({
        lectureTime: preset.lectureTime,
        ...(preset.defaultStationPair
          ? {
              fromStation: preset.defaultStationPair.from,
              toStation: preset.defaultStationPair.to,
            }
          : {}),
      });
    }
  };

  return (
    <div className="bg-[#0D1322] rounded-2xl border border-slate-800/90 shadow-xl shadow-black/40 p-5 sm:p-6 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>Journey Planner</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure your commute route and first class schedule to calculate arrival safety.
          </p>
        </div>

        {/* Quick Class Presets selector */}
        {classPresets.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-semibold text-slate-400 whitespace-nowrap flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#CCFF00]" />
              Classes:
            </span>
            <div className="flex items-center gap-1.5">
              {classPresets.slice(0, 4).map((p) => {
                const isSelected = selectedPresetId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handlePresetClick(p)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer border ${
                      isSelected
                        ? 'bg-[#CCFF00] text-black font-extrabold border-[#CCFF00] shadow-sm shadow-[#CCFF00]/30'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border-slate-700/80'
                    }`}
                    title={`${p.day}: ${p.courseName} at ${p.lectureTime}`}
                  >
                    {p.courseCode} ({p.lectureTime})
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSearch();
        }}
        className="mt-5 space-y-4"
      >
        {/* Stations Row */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-end">
          {/* Boarding Station */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Boarding Station
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-blue-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={query.fromStation}
                onChange={(e) => onChangeQuery({ fromStation: e.target.value })}
                className="w-full pl-9 pr-8 py-2.5 text-sm bg-[#070A12] border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all cursor-pointer font-medium text-white"
              >
                {allStations.length === 0 ? (
                  <option value="">No stations available</option>
                ) : (
                  allStations.map((station) => (
                    <option key={`from-${station}`} value={station} className="bg-[#070A12] text-white">
                      {station}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Swap Stations Button */}
          <div className="flex justify-center md:pb-1">
            <button
              type="button"
              onClick={handleSwapStations}
              className="p-2.5 text-slate-400 hover:text-[#CCFF00] hover:bg-slate-800 rounded-xl transition-colors border border-slate-700 cursor-pointer"
              title="Swap Origin and Destination"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Destination Station */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Destination Station
            </label>
            <div className="relative">
              <Navigation className="w-4 h-4 text-[#CCFF00] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={query.toStation}
                onChange={(e) => onChangeQuery({ toStation: e.target.value })}
                className="w-full pl-9 pr-8 py-2.5 text-sm bg-[#070A12] border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all cursor-pointer font-medium text-white"
              >
                {allDestinations.length === 0 ? (
                  <option value="">No destinations available</option>
                ) : (
                  allDestinations.map((station) => (
                    <option key={`to-${station}`} value={station} className="bg-[#070A12] text-white">
                      {station}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Timings & Buffer Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          {/* Lecture Start Time */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              First Lecture Time
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="time"
                value={query.lectureTime}
                onChange={(e) => onChangeQuery({ lectureTime: e.target.value })}
                className="w-full pl-9 pr-3 py-2 text-sm bg-[#070A12] border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-mono font-medium text-white"
                required
              />
            </div>
          </div>

          {/* Station-to-Campus Transit Time */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Station → Campus Transit
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="120"
                value={query.stationToCampusMinutes}
                onChange={(e) =>
                  onChangeQuery({
                    stationToCampusMinutes: Math.max(0, parseInt(e.target.value, 10) || 0),
                  })
                }
                className="w-full px-3 py-2 text-sm bg-[#070A12] border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-mono font-medium text-white text-center"
              />
              <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">mins</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              {[10, 15, 20].map((mins) => (
                <button
                  key={`transit-${mins}`}
                  type="button"
                  onClick={() => onChangeQuery({ stationToCampusMinutes: mins })}
                  className={`text-[11px] px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer border ${
                    query.stationToCampusMinutes === mins
                      ? 'bg-blue-600 text-white border-blue-500 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          {/* Minimum Desired Safety Buffer */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Safety Buffer Target</span>
              <span className="text-[11px] text-[#CCFF00] font-semibold">Default: 15m</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="90"
                value={query.targetBufferMinutes}
                onChange={(e) =>
                  onChangeQuery({
                    targetBufferMinutes: Math.max(0, parseInt(e.target.value, 10) || 0),
                  })
                }
                className="w-full px-3 py-2 text-sm bg-[#070A12] border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-mono font-medium text-white text-center"
              />
              <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">mins</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              {[10, 15, 20, 30].map((buf) => (
                <button
                  key={`buffer-${buf}`}
                  type="button"
                  onClick={() => onChangeQuery({ targetBufferMinutes: buf })}
                  className={`text-[11px] px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer border ${
                    query.targetBufferMinutes === buf
                      ? 'bg-[#CCFF00] text-black font-extrabold border-[#CCFF00]'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
                  }`}
                >
                  {buf}m
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-2.5 text-sm font-extrabold text-black bg-[#CCFF00] hover:bg-[#D4FF00] rounded-xl shadow-lg shadow-[#CCFF00]/20 transition-all cursor-pointer active:scale-98 border border-[#CCFF00]"
          >
            <Search className="w-4 h-4 stroke-[2.5]" />
            <span>Find My Train</span>
          </button>
        </div>
      </form>
    </div>
  );
};
