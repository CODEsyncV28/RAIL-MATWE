import React, { createContext, useContext, useEffect, useState } from 'react';
import { INITIAL_CLASS_PRESETS, INITIAL_DEMO_TRAINS } from '../data/demoTrains';
import { TrainRecord, WeeklyClassPreset } from '../types';
import { downloadCSVFile, generateCSV } from '../utils/parsers';

const TRAINS_STORAGE_KEY = 'railmate_train_records_v1';
const PRESETS_STORAGE_KEY = 'railmate_class_presets_v1';
const DATA_MODE_STORAGE_KEY = 'railmate_data_mode_v1';

interface TrainContextType {
  trains: TrainRecord[];
  isDemoMode: boolean;
  classPresets: WeeklyClassPreset[];
  allStations: string[];
  allDestinations: string[];
  stats: {
    totalTrains: number;
    demoCount: number;
    userCount: number;
  };
  addTrain: (train: Omit<TrainRecord, 'id' | 'source'>) => void;
  updateTrain: (train: TrainRecord) => void;
  deleteTrain: (id: string) => void;
  bulkAddTrains: (
    newTrains: Array<Omit<TrainRecord, 'id' | 'source'>>,
    replaceExisting?: boolean
  ) => { added: number; skippedDuplicates: number };
  resetToDemoData: () => void;
  clearAllTrains: () => void;
  exportToCSV: () => void;
  addClassPreset: (preset: Omit<WeeklyClassPreset, 'id'>) => void;
  deleteClassPreset: (id: string) => void;
}

const TrainContext = createContext<TrainContextType | undefined>(undefined);

export const TrainProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [trains, setTrains] = useState<TrainRecord[]>(() => {
    try {
      const saved = localStorage.getItem(TRAINS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse trains from local storage', e);
    }
    return INITIAL_DEMO_TRAINS;
  });

  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(DATA_MODE_STORAGE_KEY);
      if (saved !== null) {
        return saved === 'demo';
      }
    } catch {
      // ignore
    }
    return true;
  });

  const [classPresets, setClassPresets] = useState<WeeklyClassPreset[]>(() => {
    try {
      const saved = localStorage.getItem(PRESETS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_CLASS_PRESETS;
  });

  // Save trains to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(TRAINS_STORAGE_KEY, JSON.stringify(trains));
    } catch (e) {
      console.error('Failed to save trains to local storage', e);
    }
  }, [trains]);

  // Save data mode to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(DATA_MODE_STORAGE_KEY, isDemoMode ? 'demo' : 'custom');
    } catch {
      // ignore
    }
  }, [isDemoMode]);

  // Save presets to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(classPresets));
    } catch {
      // ignore
    }
  }, [classPresets]);

  // Derived lists of stations
  const allStations = Array.from(new Set(trains.map((t) => t.fromStation.trim()))).sort();
  const allDestinations = Array.from(new Set(trains.map((t) => t.toStation.trim()))).sort();

  const demoCount = trains.filter((t) => t.source === 'demo').length;
  const userCount = trains.length - demoCount;

  const addTrain = (newTrain: Omit<TrainRecord, 'id' | 'source'>) => {
    const id = `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const record: TrainRecord = {
      ...newTrain,
      id,
      source: 'user',
      createdAt: Date.now(),
    };
    setTrains((prev) => [record, ...prev]);
    setIsDemoMode(false);
  };

  const updateTrain = (updated: TrainRecord) => {
    setTrains((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const deleteTrain = (id: string) => {
    setTrains((prev) => {
      const remaining = prev.filter((t) => t.id !== id);
      if (remaining.length === 0) {
        setIsDemoMode(false);
      }
      return remaining;
    });
  };

  const bulkAddTrains = (
    newItems: Array<Omit<TrainRecord, 'id' | 'source'>>,
    replaceExisting = false
  ) => {
    let baseList = replaceExisting ? [] : [...trains];
    let skippedDuplicates = 0;
    const addedRecords: TrainRecord[] = [];

    // Helper to identify duplicate: same number OR (same name + from + to + dep)
    const isDuplicate = (item: Omit<TrainRecord, 'id' | 'source'>, existing: TrainRecord[]) => {
      const normNumber = item.number?.trim().toLowerCase();
      const normKey = `${item.name}|${item.fromStation}|${item.toStation}|${item.departureTime}`.toLowerCase();

      return existing.some((t) => {
        if (normNumber && t.number && t.number.trim().toLowerCase() === normNumber) {
          return true;
        }
        const existingKey = `${t.name}|${t.fromStation}|${t.toStation}|${t.departureTime}`.toLowerCase();
        return existingKey === normKey;
      });
    };

    let counter = 0;
    for (const item of newItems) {
      if (!replaceExisting && isDuplicate(item, baseList)) {
        skippedDuplicates++;
        continue;
      }
      const record: TrainRecord = {
        ...item,
        id: `import-${Date.now()}-${counter++}`,
        source: 'imported',
        createdAt: Date.now(),
      };
      addedRecords.push(record);
      baseList.push(record);
    }

    setTrains(baseList);
    setIsDemoMode(false);

    return {
      added: addedRecords.length,
      skippedDuplicates,
    };
  };

  const resetToDemoData = () => {
    setTrains(INITIAL_DEMO_TRAINS);
    setIsDemoMode(true);
  };

  const clearAllTrains = () => {
    setTrains([]);
    setIsDemoMode(false);
  };

  const exportToCSV = () => {
    const csv = generateCSV(trains);
    const dateStr = new Date().toISOString().slice(0, 10);
    const modeTag = isDemoMode ? 'demo' : 'custom';
    downloadCSVFile(csv, `railmate_${modeTag}_timetables_${dateStr}.csv`);
  };

  const addClassPreset = (preset: Omit<WeeklyClassPreset, 'id'>) => {
    const newPreset: WeeklyClassPreset = {
      ...preset,
      id: `preset-${Date.now()}`,
    };
    setClassPresets((prev) => [...prev, newPreset]);
  };

  const deleteClassPreset = (id: string) => {
    setClassPresets((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <TrainContext.Provider
      value={{
        trains,
        isDemoMode,
        classPresets,
        allStations,
        allDestinations,
        stats: {
          totalTrains: trains.length,
          demoCount,
          userCount,
        },
        addTrain,
        updateTrain,
        deleteTrain,
        bulkAddTrains,
        resetToDemoData,
        clearAllTrains,
        exportToCSV,
        addClassPreset,
        deleteClassPreset,
      }}
    >
      {children}
    </TrainContext.Provider>
  );
};

export const useTrains = (): TrainContextType => {
  const ctx = useContext(TrainContext);
  if (!ctx) {
    throw new Error('useTrains must be used within a TrainProvider');
  }
  return ctx;
};
