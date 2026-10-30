export type TrainSource = 'demo' | 'user' | 'imported';

export type SuitabilityStatus = 'suitable' | 'tight' | 'late';

export interface TrainRecord {
  id: string;
  name: string;
  number?: string;
  fromStation: string;
  toStation: string;
  departureTime: string; // HH:mm format (24-hour)
  arrivalTime: string;   // HH:mm format (24-hour)
  operatingDays?: string[];
  notes?: string;
  source: TrainSource;
  createdAt?: number;
}

export interface JourneyQuery {
  fromStation: string;
  toStation: string;
  lectureTime: string; // HH:mm format (24-hour)
  stationToCampusMinutes: number; // e.g. 15
  targetBufferMinutes: number; // e.g. 15
  simulatedDelayMinutes: number; // 0, 10, 20, 30
}

export interface CommuteEvaluation {
  train: TrainRecord;
  delayMinutes: number;
  scheduledDeparture: string;
  scheduledArrival: string;
  adjustedArrival: string;
  campusArrival: string;
  journeyDurationMinutes: number;
  safetyBufferMinutes: number;
  suitability: SuitabilityStatus;
  isRecommended: boolean;
  rankScore: number;
  rationale: string;
}

export interface WeeklyClassPreset {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  courseCode: string;
  courseName: string;
  lectureTime: string; // HH:mm
  room?: string;
  defaultStationPair?: {
    from: string;
    to: string;
  };
}

export interface BulkParseResult {
  records: Array<Omit<TrainRecord, 'id' | 'source'>>;
  errors: string[];
}
