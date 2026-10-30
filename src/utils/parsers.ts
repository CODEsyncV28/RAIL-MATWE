import { BulkParseResult, TrainRecord } from '../types';

/**
 * Validates whether a time string is in valid 24-hour format HH:mm or H:mm
 */
export function isValidTime(timeStr: string): boolean {
  if (!timeStr) return false;
  const match = timeStr.trim().match(/^([01]?[0-9]|2[0-3]):([0-5][0-9])$/);
  return Boolean(match);
}

/**
 * Normalizes time string to standard "HH:mm" (e.g. "8:05" -> "08:05")
 */
export function normalizeTime(timeStr: string): string {
  const parts = timeStr.trim().split(':');
  const h = parts[0].padStart(2, '0');
  const m = parts[1].padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Parses multiline plain-text blocks in the user's bulk-paste format:
 *
 * Train: Thane Fast
 * Number: 95003
 * From: Thane
 * To: Campus Junction
 * Departure: 07:42
 * Arrival: 08:12
 * Notes: Semi-fast local (optional)
 */
export function parseBulkText(text: string): BulkParseResult {
  const records: Array<Omit<TrainRecord, 'id' | 'source'>> = [];
  const errors: string[] = [];

  if (!text || !text.trim()) {
    return { records: [], errors: ['Input text is empty.'] };
  }

  // Split into blocks by two or more newlines, or lines starting with "Train:"
  const rawBlocks = text.split(/\n\s*\n+/);

  let blockIndex = 1;

  for (const block of rawBlocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    const lines = trimmed.split('\n');
    const fields: Record<string, string> = {};

    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;
      const key = line.slice(0, colonIndex).trim().toLowerCase();
      const val = line.slice(colonIndex + 1).trim();

      if (key === 'train' || key === 'train name' || key === 'name') {
        fields.name = val;
      } else if (key === 'number' || key === 'train number' || key === 'train no' || key === 'train_no') {
        fields.number = val;
      } else if (key === 'from' || key === 'from station' || key === 'origin' || key === 'boarding') {
        fields.fromStation = val;
      } else if (key === 'to' || key === 'to station' || key === 'destination') {
        fields.toStation = val;
      } else if (key === 'departure' || key === 'dep' || key === 'departure time') {
        fields.departureTime = val;
      } else if (key === 'arrival' || key === 'arr' || key === 'arrival time') {
        fields.arrivalTime = val;
      } else if (key === 'days' || key === 'operating days' || key === 'runs on') {
        fields.operatingDays = val;
      } else if (key === 'notes' || key === 'note' || key === 'remarks') {
        fields.notes = val;
      }
    }

    // Validation checks
    const missing: string[] = [];
    if (!fields.name) missing.push('Train Name');
    if (!fields.fromStation) missing.push('From Station');
    if (!fields.toStation) missing.push('To Station');
    if (!fields.departureTime) missing.push('Departure Time');
    if (!fields.arrivalTime) missing.push('Arrival Time');

    if (missing.length > 0) {
      errors.push(`Record #${blockIndex} is missing required fields: ${missing.join(', ')}.`);
      blockIndex++;
      continue;
    }

    if (!isValidTime(fields.departureTime)) {
      errors.push(`Record #${blockIndex} ("${fields.name}"): Departure time "${fields.departureTime}" is invalid (must be HH:mm, e.g. 07:30).`);
      blockIndex++;
      continue;
    }

    if (!isValidTime(fields.arrivalTime)) {
      errors.push(`Record #${blockIndex} ("${fields.name}"): Arrival time "${fields.arrivalTime}" is invalid (must be HH:mm, e.g. 08:25).`);
      blockIndex++;
      continue;
    }

    const operatingDays = fields.operatingDays
      ? fields.operatingDays.split(',').map((d) => d.trim()).filter(Boolean)
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    records.push({
      name: fields.name,
      number: fields.number || undefined,
      fromStation: fields.fromStation,
      toStation: fields.toStation,
      departureTime: normalizeTime(fields.departureTime),
      arrivalTime: normalizeTime(fields.arrivalTime),
      operatingDays,
      notes: fields.notes || undefined,
    });

    blockIndex++;
  }

  return { records, errors };
}

/**
 * Parses CSV text line by line with basic quote escaping support.
 */
export function parseCSV(csvText: string): BulkParseResult {
  const records: Array<Omit<TrainRecord, 'id' | 'source'>> = [];
  const errors: string[] = [];

  if (!csvText || !csvText.trim()) {
    return { records: [], errors: ['CSV content is empty.'] };
  }

  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return { records: [], errors: ['CSV must contain at least a header row and one data row.'] };
  }

  // Parse header
  const headerCols = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim().replace(/[\s_-]+/g, ''));

  const findColIndex = (...candidates: string[]): number => {
    return headerCols.findIndex((col) => candidates.includes(col));
  };

  const nameIdx = findColIndex('trainname', 'name', 'train');
  const numberIdx = findColIndex('trainnumber', 'number', 'trainno', 'no');
  const fromIdx = findColIndex('fromstation', 'from', 'boarding', 'origin', 'source');
  const toIdx = findColIndex('tostation', 'to', 'destination');
  const depIdx = findColIndex('departuretime', 'departure', 'deptime', 'dep');
  const arrIdx = findColIndex('arrivaltime', 'arrival', 'arrtime', 'arr');
  const daysIdx = findColIndex('operatingdays', 'days', 'runson');
  const notesIdx = findColIndex('notes', 'note', 'remarks');

  if (nameIdx === -1 || fromIdx === -1 || toIdx === -1 || depIdx === -1 || arrIdx === -1) {
    errors.push('CSV header must contain columns for Train Name, From Station, To Station, Departure Time, and Arrival Time.');
    return { records: [], errors };
  }

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    const cols = parseCSVLine(rawLine);
    if (cols.length === 0 || (cols.length === 1 && !cols[0].trim())) continue;

    const rowNum = i + 1;
    const name = cols[nameIdx]?.trim();
    const number = numberIdx !== -1 ? cols[numberIdx]?.trim() : undefined;
    const fromStation = cols[fromIdx]?.trim();
    const toStation = cols[toIdx]?.trim();
    const departureTime = cols[depIdx]?.trim();
    const arrivalTime = cols[arrIdx]?.trim();
    const daysRaw = daysIdx !== -1 ? cols[daysIdx]?.trim() : '';
    const notes = notesIdx !== -1 ? cols[notesIdx]?.trim() : undefined;

    if (!name || !fromStation || !toStation || !departureTime || !arrivalTime) {
      errors.push(`Row ${rowNum}: Incomplete data. Required columns cannot be empty.`);
      continue;
    }

    if (!isValidTime(departureTime)) {
      errors.push(`Row ${rowNum} ("${name}"): Invalid departure time "${departureTime}" (format: HH:mm).`);
      continue;
    }

    if (!isValidTime(arrivalTime)) {
      errors.push(`Row ${rowNum} ("${name}"): Invalid arrival time "${arrivalTime}" (format: HH:mm).`);
      continue;
    }

    const operatingDays = daysRaw
      ? daysRaw.split(';').map((d) => d.trim()).filter(Boolean)
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    records.push({
      name,
      number: number || undefined,
      fromStation,
      toStation,
      departureTime: normalizeTime(departureTime),
      arrivalTime: normalizeTime(arrivalTime),
      operatingDays,
      notes: notes || undefined,
    });
  }

  return { records, errors };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

/**
 * Converts current train records to a downloadable CSV string.
 */
export function generateCSV(trains: TrainRecord[]): string {
  const headers = ['Train Name', 'Train Number', 'From Station', 'To Station', 'Departure Time', 'Arrival Time', 'Operating Days', 'Notes'];

  const rows = trains.map((t) => [
    escapeCSV(t.name),
    escapeCSV(t.number || ''),
    escapeCSV(t.fromStation),
    escapeCSV(t.toStation),
    t.departureTime,
    t.arrivalTime,
    escapeCSV((t.operatingDays || []).join(';')),
    escapeCSV(t.notes || ''),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

function escapeCSV(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

/**
 * Triggers a client-side file download of CSV data.
 */
export function downloadCSVFile(csvContent: string, fileName: string = 'railmate_train_schedule.csv'): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
