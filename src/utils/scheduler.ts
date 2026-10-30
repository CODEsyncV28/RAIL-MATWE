import { CommuteEvaluation, JourneyQuery, SuitabilityStatus, TrainRecord } from '../types';

/**
 * Converts "HH:mm" or "H:mm" to minutes from 00:00 (0 to 1439).
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return 0;
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}

/**
 * Formats minutes from midnight back to 24-hour "HH:mm".
 */
export function formatMinutesToTime(totalMinutes: number): string {
  // Normalize to 0..1439
  const normalized = ((Math.floor(totalMinutes) % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Calculates journey duration in minutes, handling midnight rollover.
 */
export function calculateDurationMinutes(departureTime: string, arrivalTime: string): number {
  const dep = parseTimeToMinutes(departureTime);
  let arr = parseTimeToMinutes(arrivalTime);
  if (arr < dep) {
    arr += 1440; // Crossed midnight
  }
  return arr - dep;
}

/**
 * Evaluates an individual train against the student's journey query.
 */
export function evaluateTrain(train: TrainRecord, query: JourneyQuery): CommuteEvaluation {
  const depMins = parseTimeToMinutes(train.departureTime);
  let arrMins = parseTimeToMinutes(train.arrivalTime);
  if (arrMins < depMins) {
    arrMins += 1440;
  }
  const journeyDurationMinutes = arrMins - depMins;

  // Apply simulated delay to arrival
  const delay = Math.max(0, query.simulatedDelayMinutes || 0);
  const adjustedArrMins = arrMins + delay;

  // Campus arrival = adjusted station arrival + station-to-campus transit
  const transitMins = Math.max(0, query.stationToCampusMinutes || 0);
  const campusArrMins = adjustedArrMins + transitMins;

  // Lecture time
  let lectureMins = parseTimeToMinutes(query.lectureTime);
  // Handle edge-case where departure is late evening and lecture is early morning
  if (lectureMins < depMins && (lectureMins + 1440 - depMins) < 1440) {
    lectureMins += 1440;
  }

  // Safety buffer before lecture = lecture time - campus arrival time
  const safetyBufferMinutes = lectureMins - campusArrMins;
  const targetBuffer = Math.max(0, query.targetBufferMinutes || 15);

  let suitability: SuitabilityStatus;
  if (safetyBufferMinutes >= targetBuffer) {
    suitability = 'suitable';
  } else if (safetyBufferMinutes >= 0) {
    suitability = 'tight';
  } else {
    suitability = 'late';
  }

  // Rank score calculation:
  // Higher is better.
  // Suitable trains:
  //   Base score: 10,000.
  //   Optimal buffer is between targetBuffer and targetBuffer + 30m.
  //   We penalize waiting idle on campus for hours (e.g. buffer = 180 min),
  //   and award points for sensible duration and adequate buffer.
  let rankScore = 0;
  let rationale = '';

  if (suitability === 'suitable') {
    // Penalty for excessive idle waiting (>45 mins beyond target)
    const excessWait = Math.max(0, safetyBufferMinutes - (targetBuffer + 30));
    rankScore = 10000 - excessWait * 5 - journeyDurationMinutes;
    rationale = `Arrives comfortably with a ${safetyBufferMinutes}m safety margin (exceeds your ${targetBuffer}m target).`;
  } else if (suitability === 'tight') {
    // Reaches campus on or before class start, but buffer is smaller than target
    rankScore = 5000 + safetyBufferMinutes * 20 - journeyDurationMinutes;
    rationale = `Tight schedule: reaches campus only ${safetyBufferMinutes}m before class (below your ${targetBuffer}m buffer). Any unexpected hitch will make you late.`;
  } else {
    // Late: arrives after lecture starts
    const lateBy = Math.abs(safetyBufferMinutes);
    rankScore = -1000 - lateBy * 10 - journeyDurationMinutes;
    rationale = `Late arrival: reaches campus ${lateBy}m after lecture has already started.`;
  }

  return {
    train,
    delayMinutes: delay,
    scheduledDeparture: train.departureTime,
    scheduledArrival: train.arrivalTime,
    adjustedArrival: formatMinutesToTime(adjustedArrMins),
    campusArrival: formatMinutesToTime(campusArrMins),
    journeyDurationMinutes,
    safetyBufferMinutes,
    suitability,
    isRecommended: false,
    rankScore,
    rationale,
  };
}

export interface RecommendationResult {
  evaluations: CommuteEvaluation[];
  recommended: CommuteEvaluation | null;
  leastRiskyAlternative: CommuteEvaluation | null;
  hasSuitableTrain: boolean;
  summaryReason: string;
}

/**
 * Evaluates all matching trains for a query, ranks them, and identifies the best recommendation.
 */
export function rankAndRecommendTrains(
  matchingTrains: TrainRecord[],
  query: JourneyQuery
): RecommendationResult {
  if (!matchingTrains || matchingTrains.length === 0) {
    return {
      evaluations: [],
      recommended: null,
      leastRiskyAlternative: null,
      hasSuitableTrain: false,
      summaryReason: 'No trains operate between the selected boarding and destination stations.',
    };
  }

  const evaluations = matchingTrains.map((train) => evaluateTrain(train, query));

  // Sort by ranking score descending (best first)
  evaluations.sort((a, b) => b.rankScore - a.rankScore);

  const suitableTrains = evaluations.filter((e) => e.suitability === 'suitable');

  if (suitableTrains.length > 0) {
    // Mark the top ranked suitable train as recommended
    const topPick = suitableTrains[0];
    topPick.isRecommended = true;

    let explanation = `The ${topPick.train.name} (${topPick.train.number || 'No Num'}) is your optimal commute. `;
    if (topPick.delayMinutes > 0) {
      explanation += `Even factoring the simulated ${topPick.delayMinutes}m delay, you will reach campus at ${topPick.campusArrival}, leaving a healthy ${topPick.safetyBufferMinutes}m cushion before your ${query.lectureTime} lecture.`;
    } else {
      explanation += `It gets you to campus at ${topPick.campusArrival}, giving you a comfortable ${topPick.safetyBufferMinutes}m safety cushion before your ${query.lectureTime} lecture begins.`;
    }
    topPick.rationale = explanation;

    return {
      evaluations,
      recommended: topPick,
      leastRiskyAlternative: null,
      hasSuitableTrain: true,
      summaryReason: explanation,
    };
  }

  // No train qualifies as suitable!
  // Find least-risky alternative (tightest or smallest late margin)
  // Since evaluations are sorted by rankScore, index 0 is the least risky
  const leastRisky = evaluations[0] || null;

  let explanation = '';
  if (leastRisky) {
    if (leastRisky.suitability === 'tight') {
      explanation = `No train meets your requested ${query.targetBufferMinutes}m safety buffer. The least-risky alternative is ${leastRisky.train.name}, which arrives at campus at ${leastRisky.campusArrival}—giving only a ${leastRisky.safetyBufferMinutes}m margin before class.`;
    } else {
      const lateBy = Math.abs(leastRisky.safetyBufferMinutes);
      explanation = `Alert: No available train will get you to campus on time! Even the earliest matching service (${leastRisky.train.name}) arrives at campus at ${leastRisky.campusArrival}, which is ${lateBy}m after your ${query.lectureTime} lecture starts.`;
    }
  } else {
    explanation = 'No scheduled trains found on this route.';
  }

  return {
    evaluations,
    recommended: null,
    leastRiskyAlternative: leastRisky,
    hasSuitableTrain: false,
    summaryReason: explanation,
  };
}

/**
 * Computes the Delay Impact Matrix comparing each train across multiple delay intervals.
 */
export function computeDelayMatrix(
  matchingTrains: TrainRecord[],
  baseQuery: Omit<JourneyQuery, 'simulatedDelayMinutes'>,
  delaySteps: number[] = [0, 10, 20, 30]
): Array<{
  train: TrainRecord;
  evaluations: Record<number, CommuteEvaluation>;
  isResilient: boolean; // Remains suitable even at max delay
}> {
  return matchingTrains.map((train) => {
    const evaluations: Record<number, CommuteEvaluation> = {};
    let isResilient = true;

    for (const delay of delaySteps) {
      const ev = evaluateTrain(train, {
        ...baseQuery,
        simulatedDelayMinutes: delay,
      });
      evaluations[delay] = ev;
      if (ev.suitability !== 'suitable') {
        isResilient = false;
      }
    }

    return {
      train,
      evaluations,
      isResilient,
    };
  });
}
