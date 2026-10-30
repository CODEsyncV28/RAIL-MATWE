import React, { useState, useMemo } from 'react';
import { TrainProvider, useTrains } from './context/TrainContext';
import { Header } from './components/Header';
import { JourneyPlanner } from './components/JourneyPlanner';
import { DelaySimulator } from './components/DelaySimulator';
import { RecommendationSummary } from './components/RecommendationSummary';
import { TrainResults } from './components/TrainResults';
import { DelayImpactMatrix } from './components/DelayImpactMatrix';
import { ManageTrainDataModal } from './components/ManageTrainDataModal';
import { ClassPresetsModal } from './components/ClassPresetsModal';
import { StationTransitMapsIntelligence } from './components/StationTransitMapsIntelligence';
import { JourneyQuery, WeeklyClassPreset } from './types';
import { rankAndRecommendTrains } from './utils/scheduler';

function MainApp() {
  const { trains, allStations, allDestinations, isDemoMode } = useTrains();

  const [isDataManagerOpen, setIsDataManagerOpen] = useState(false);
  const [isClassPresetsOpen, setIsClassPresetsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<WeeklyClassPreset | null>(null);

  // Default journey query parameters
  const [query, setQuery] = useState<JourneyQuery>({
    fromStation: 'Thane',
    toStation: 'Campus Junction',
    lectureTime: '09:00',
    stationToCampusMinutes: 15,
    targetBufferMinutes: 15,
    simulatedDelayMinutes: 0,
  });

  // Keep fromStation and toStation valid if stations list changes
  React.useEffect(() => {
    if (allStations.length > 0 && !allStations.includes(query.fromStation)) {
      setQuery((prev) => ({ ...prev, fromStation: allStations[0] }));
    }
    if (allDestinations.length > 0 && !allDestinations.includes(query.toStation)) {
      setQuery((prev) => ({ ...prev, toStation: allDestinations[0] }));
    }
  }, [allStations, allDestinations, query.fromStation, query.toStation]);

  const handleChangeQuery = (updated: Partial<JourneyQuery>) => {
    setQuery((prev) => ({ ...prev, ...updated }));
  };

  const handleSelectDelay = (delayMins: number) => {
    setQuery((prev) => ({ ...prev, simulatedDelayMinutes: delayMins }));
  };

  // Find trains matching the selected route
  const matchingTrains = useMemo(() => {
    return trains.filter(
      (t) =>
        t.fromStation.trim().toLowerCase() === query.fromStation.trim().toLowerCase() &&
        t.toStation.trim().toLowerCase() === query.toStation.trim().toLowerCase()
    );
  }, [trains, query.fromStation, query.toStation]);

  // Compute recommendation and ranking
  const recommendation = useMemo(() => {
    return rankAndRecommendTrains(matchingTrains, query);
  }, [matchingTrains, query]);

  const handleSearch = () => {
    const el = document.getElementById('results-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070A12] text-slate-100">
      <Header
        onOpenDataManager={() => setIsDataManagerOpen(true)}
        onOpenClassPresets={() => setIsClassPresetsOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner strip for hackathon context */}
        <section className="bg-gradient-to-r from-[#0A0F1D] via-[#0E1528] to-[#070B14] text-white rounded-2xl p-5 sm:p-6 shadow-xl shadow-black/50 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#CCFF00] font-mono">
                College Commute Intelligence
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-blue-300">Hackathon Prototype</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Rail<span className="text-[#CCFF00]">Mate</span> Commute Assistant
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Never get locked out of morning labs. Cross-reference train schedules with college lecture start times, station-to-campus transit, and simulated railway delays.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsDataManagerOpen(true)}
              className="px-4 py-2 text-xs font-black text-black bg-[#CCFF00] hover:bg-[#D4FF00] rounded-xl transition-all shadow-md shadow-[#CCFF00]/20 cursor-pointer whitespace-nowrap"
            >
              {isDemoMode ? 'Replace with My Train Data' : 'Manage Custom Data'}
            </button>
            <button
              onClick={() => setIsClassPresetsOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-700 hover:text-white rounded-xl transition-all border border-slate-700/80 cursor-pointer whitespace-nowrap"
            >
              Class Presets
            </button>
          </div>
        </section>

        {/* Journey Planner Form */}
        <section>
          <JourneyPlanner
            query={query}
            onChangeQuery={handleChangeQuery}
            onSearch={handleSearch}
            selectedPresetId={selectedPreset?.id || null}
            onSelectPreset={(p) => setSelectedPreset(p)}
          />
        </section>

        {/* Google Maps Station-to-Campus Transit Intelligence */}
        <section>
          <StationTransitMapsIntelligence
            currentDestinationStation={query.toStation}
            onApplyTransitMinutes={(mins) =>
              handleChangeQuery({ stationToCampusMinutes: mins })
            }
          />
        </section>

        {/* Delay Simulator */}
        <section>
          <DelaySimulator
            currentDelay={query.simulatedDelayMinutes}
            onSelectDelay={handleSelectDelay}
          />
        </section>

        {/* Recommendation Summary & Results Section */}
        <section id="results-section" className="space-y-6">
          <RecommendationSummary
            recommended={recommendation.recommended}
            leastRiskyAlternative={recommendation.leastRiskyAlternative}
            hasSuitableTrain={recommendation.hasSuitableTrain}
            summaryReason={recommendation.summaryReason}
            query={query}
          />

          {/* Hackathon Delay Impact Matrix */}
          {matchingTrains.length > 0 && (
            <DelayImpactMatrix
              matchingTrains={matchingTrains}
              query={query}
            />
          )}

          {/* Matching Train Cards */}
          <TrainResults
            evaluations={recommendation.evaluations}
            query={query}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0A0F1D] py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            <span className="font-extrabold text-white">Rail<span className="text-[#CCFF00]">Mate</span></span> · College Train & Class Timetable Assistant.
            <span className="ml-2">Built for college hackathon demonstration.</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsDataManagerOpen(true)}
              className="text-blue-400 hover:text-[#CCFF00] transition-colors cursor-pointer underline"
            >
              Data Management & CSV
            </button>
            <button
              onClick={() => setIsClassPresetsOpen(true)}
              className="text-blue-400 hover:text-[#CCFF00] transition-colors cursor-pointer underline"
            >
              Weekly Timetable
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ManageTrainDataModal
        isOpen={isDataManagerOpen}
        onClose={() => setIsDataManagerOpen(false)}
      />

      <ClassPresetsModal
        isOpen={isClassPresetsOpen}
        onClose={() => setIsClassPresetsOpen(false)}
        onSelectPreset={(p) => {
          setSelectedPreset(p);
          handleChangeQuery({
            lectureTime: p.lectureTime,
            ...(p.defaultStationPair
              ? {
                  fromStation: p.defaultStationPair.from,
                  toStation: p.defaultStationPair.to,
                }
              : {}),
          });
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <TrainProvider>
      <MainApp />
    </TrainProvider>
  );
}
