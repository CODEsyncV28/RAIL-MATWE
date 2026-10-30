import React, { useState } from 'react';
import {
  MapPin,
  ExternalLink,
  Compass,
  Sparkles,
  Check,
  AlertCircle,
  Loader2,
  Navigation,
} from 'lucide-react';

interface MapsGroundingLink {
  title: string;
  uri: string;
  reviewSnippet?: string;
}

interface TransitIntelligenceResponse {
  summary: string;
  suggestedMinutes: number;
  mapsLinks: MapsGroundingLink[];
  source: string;
  error?: string;
}

interface StationTransitMapsIntelligenceProps {
  currentDestinationStation: string;
  onApplyTransitMinutes: (minutes: number) => void;
}

export const StationTransitMapsIntelligence: React.FC<StationTransitMapsIntelligenceProps> = ({
  currentDestinationStation,
  onApplyTransitMinutes,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [stationName, setStationName] = useState(currentDestinationStation || 'Campus Junction Station');
  const [collegeName, setCollegeName] = useState('Somaiya Vidyavihar University');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TransitIntelligenceResponse | null>(null);
  const [appliedMinutes, setAppliedMinutes] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync if current destination changes
  React.useEffect(() => {
    if (currentDestinationStation && (!stationName || stationName === 'Campus Junction Station')) {
      setStationName(`${currentDestinationStation} Railway Station`);
    }
  }, [currentDestinationStation]);

  const handleFetchTransitData = async () => {
    setLoading(true);
    setErrorMsg(null);
    setAppliedMinutes(null);

    let userLocation: { latitude: number; longitude: number } | undefined = undefined;

    // Optional client geolocation if granted
    if ('geolocation' in navigator) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
        });
        userLocation = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
      } catch {
        // Continue without exact coordinates
      }
    }

    try {
      const resp = await fetch('/api/maps/transit-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toStation: stationName,
          campusOrCollegeName: collegeName,
          userLocation,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'Failed to fetch transit intelligence.');
      }

      setResult(data);
    } catch (err: any) {
      console.error('Google Maps Grounding Error:', err);
      setErrorMsg(err?.message || 'Unable to load Google Maps data. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (mins: number) => {
    onApplyTransitMinutes(mins);
    setAppliedMinutes(mins);
  };

  return (
    <div className="bg-[#0D1322] rounded-2xl border border-slate-800 shadow-xl shadow-black/40 overflow-hidden">
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 bg-[#090E1A]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-600 text-[#CCFF00] shadow-sm">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Google Maps Station-to-Campus Transit Intelligence
              </h3>
              <span className="text-[10px] font-mono font-bold text-blue-300 bg-blue-950 border border-blue-700/80 px-2 py-0.5 rounded-full">
                Gemini 3.8 Flash Maps Grounding
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Verify real walking, bus, and cab commute times from the arrival station to your campus.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs font-bold text-white hover:text-black px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-[#CCFF00] transition-all cursor-pointer self-start sm:self-auto shrink-0 shadow-sm border border-blue-500 hover:border-[#CCFF00]"
        >
          {isOpen ? 'Hide Transit Assistant' : 'Explore Route with Google Maps'}
        </button>
      </div>

      {isOpen && (
        <div className="p-4 sm:p-6 space-y-5">
          {/* Form inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Arrival Railway Station
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-blue-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={stationName}
                  onChange={(e) => setStationName(e.target.value)}
                  placeholder="e.g. Thane Station, Dadar Station, Vidyavihar"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#070A12] border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Target College / Campus Name
              </label>
              <div className="relative">
                <Navigation className="w-4 h-4 text-[#CCFF00] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  placeholder="e.g. VJTI Mumbai, IIT Bombay, Somaiya Vidyavihar"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#070A12] border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-[#CCFF00] shrink-0" />
              <span>Grounded with live Google Maps place data and commuter reviews.</span>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleFetchTransitData}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-md shadow-blue-900/40 cursor-pointer disabled:opacity-50 whitespace-nowrap border border-blue-500"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Querying Google Maps...</span>
                </>
              ) : (
                <>
                  <Compass className="w-3.5 h-3.5 text-[#CCFF00]" />
                  <span>Analyze Transit Options</span>
                </>
              )}
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Results Display */}
          {result && (
            <div className="mt-4 p-4 sm:p-5 rounded-xl border border-blue-900/60 bg-[#090F1E] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-900/40">
                <div>
                  <span className="text-xs font-extrabold text-[#CCFF00] uppercase tracking-wider">
                    Google Maps Grounded Route Insights
                  </span>
                  <div className="text-xs text-slate-300 mt-0.5">
                    Estimated Transit Budget: <span className="font-extrabold text-white font-mono">~{result.suggestedMinutes} minutes</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleApply(result.suggestedMinutes)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer whitespace-nowrap shadow-sm ${
                    appliedMinutes === result.suggestedMinutes
                      ? 'bg-[#CCFF00] text-black shadow-[#CCFF00]/30'
                      : 'bg-white hover:bg-slate-200 text-slate-950'
                  }`}
                >
                  {appliedMinutes === result.suggestedMinutes ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Applied to Planner!</span>
                    </>
                  ) : (
                    <>
                      <span>Apply {result.suggestedMinutes}m to Planner</span>
                    </>
                  )}
                </button>
              </div>

              {/* Summary text */}
              <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-line space-y-2 font-sans bg-[#070A12] p-3.5 rounded-lg border border-slate-800">
                {result.summary}
              </div>

              {/* Google Maps Grounding Links */}
              {result.mapsLinks && result.mapsLinks.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Verified Google Maps Locations & Sources ({result.mapsLinks.length}):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {result.mapsLinks.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-lg bg-[#070A12] border border-slate-800 hover:border-blue-500 hover:shadow-xs transition-all flex items-start justify-between gap-2 group"
                      >
                        <div>
                          <div className="text-xs font-bold text-blue-400 group-hover:text-[#CCFF00] group-hover:underline flex items-center gap-1">
                            <span>{link.title}</span>
                            <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-[#CCFF00] shrink-0" />
                          </div>
                          {link.reviewSnippet && (
                            <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 italic">
                              "{link.reviewSnippet}"
                            </p>
                          )}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
