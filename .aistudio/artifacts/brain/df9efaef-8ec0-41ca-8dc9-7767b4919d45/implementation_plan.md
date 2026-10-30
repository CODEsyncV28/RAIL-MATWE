# RailMate — Smart Train & Class Timetable Assistant

RailMate is an intelligent commuter assistant tailored for college students that cross-references train timetables with lecture schedules, station-to-campus transit times, and simulated delays to compute safe commute options.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and user experience decisions were confirmed through Phase 1 clarification:

- **Confirmed Decision 1 (Dataset Style)**: Indian Railway Commuter style (Suburban and Fast Passenger services, e.g., Suburban Local, Fast EMU, Campus Shuttle Passenger across authentic-feeling regional stations such as Thane, Kalyan, Dadar, Borivali, and Campus Junction).
- **Confirmed Decision 2 (Lecture Timetable Presets)**: Quick single-lecture journey planner combined with a weekly timetable preset drawer (Monday–Friday courses like CS101, Data Structures, Physics Lab with 1-click apply).
- **Confirmed Decision 3 (Hackathon Feature)**: An interactive "Delay Impact Matrix" showing what-if scenarios (0m, 10m, 20m, 30m delays) across all matching trains simultaneously, alongside the primary recommendation card.
- **Confirmed Decision 4 (Stage 1 to Stage 2 Bridge)**: LocalStorage-backed state engine with seamless CSV import/export, multi-line bulk paste, validation engine, and reset-to-demo capability so the user can easily swap temporary records with actual schedules without touching code.

---

## 1. Overview & Core Concept

- **What It Does**: Calculates exact journey timelines for student commuters by analyzing departure/arrival schedules, adding transit time from the destination station to campus, factoring in safety buffers, and predicting on-time arrival for class.
- **Target Audience**: College students, commuting professors, and hackathon judges evaluating student utility software.
- **Key Value**: Eliminates the guesswork and anxiety of suburban train delays causing missed roll-calls or lab entry lockouts.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Journey Configuration**: The student selects Boarding & Destination stations, their First Lecture Time, Station-to-Campus transit duration (e.g. 15 min auto/bus/walk), and minimum required safety buffer (default: 15 min). Alternatively, they can pick a class from their saved Weekly Schedule presets to auto-fill lecture time.
2. **Instant Recommendation & Evaluation**: The engine categorizes every train into **Suitable** (green), **Tight** (amber), or **Late** (rose), highlighting the optimal train with plain-English reasoning (balancing buffer health vs. unnecessary waiting).
3. **What-If Delay Simulation**: Users can toggle 0, 10, 20, or 30-minute delays to see live recalculation of arrival times, safety buffers, and risk status.
4. **Delay Impact Matrix (Hackathon Highlight)**: A dedicated interactive comparison table rendering how each candidate train holds up across 0m, 10m, 20m, and 30m delay scenarios.
5. **Data Management & Custom Timetables**: A full modal or tabbed workspace allowing students to view active records, add/edit/delete trains, paste bulk text blocks, upload custom CSVs with validation & preview, export backups, and switch between Demo and Personal mode.

### Visual Identity & Theme
- **Color Palette**: Deep Navy primary (`#0B192C` / `#1E3A8A`), crisp white background with subtle cool-neutral slate surfaces (`#F8FAFC` and `#F1F5F9`), and rich emerald accents (`#059669` / `#10B981`) for safety states. Amber (`#D97706`) for tight arrivals and rose (`#E11D48`) for late trains.
- **Typography**: Clean, high-legibility modern sans (`Plus Jakarta Sans` / `Outfit` display, `DM Sans` / `Inter` body) with monospace tabular numerals (`font-mono tabular-nums`) for departure, arrival, and buffer counts.
- **Zero-Pill & Anti-Slop Discipline**: No arbitrary pill badges on cards; clean unboxed typography with typographic dots (`·`) and subtle borders; strict adherence to WCAG AA contrast; no decorative pulsing dots or pseudo-code commentary.
- **Top Bar Contract**: Clean 3-zone bar: Brand wordmark (`RailMate`) with train insignia on the left, clear dataset indicator (`Demo Mode` / `Custom Timetable`) in the center, and primary action (`Manage Timetables` / `Quick Guide`) on the right.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Client-Side Engine with LocalStorage vs Server/Database**
  - *Chosen Approach*: 100% client-side calculation using browser `localStorage` and memory caching.
  - *Why*: Instant reactivity (<10ms recomputation on slider/delay changes), zero external API key requirements, fully offline capable, perfectly resilient during hackathon demos.
- **Decision 2: Midnight-Crossing & 24-Hour Time Math**
  - *Chosen Approach*: Normalizing all clock times into absolute minutes-from-midnight (0 to 1439) with circular arithmetic modulo 1440 for midnight transitions.
  - *Why*: Robust, foolproof comparison without timezone or date-parsing errors.
- **Decision 3: Two-Phase Bulk & CSV Import Pipeline**
  - *Chosen Approach*: Parse $\to$ Validate $\to$ Interactive Preview Table $\to$ Confirm & Save.
  - *Why*: Prevents corrupted datasets, duplicate keys, or malformed time formats from breaking the planner.

---

## 4. Technical Architecture & Data Strategy

```
┌───────────────────────────────────────────────────────────────────────────┐
│                           RailMate Architecture                           │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│   ┌─────────────────────┐             ┌───────────────────────────────┐   │
│   │ Weekly Class Presets│             │ Train Timetable State Store   │   │
│   │ (LocalStorage)      │             │ (Demo / User Custom)          │   │
│   └──────────┬──────────┘             └───────────────┬───────────────┘   │
│              │                                        │                   │
│              ▼                                        ▼                   │
│   ┌───────────────────────────────────────────────────────────────────┐   │
│   │                  Journey Planner Parameters                       │   │
│   │  - Origin & Destination Stations                                 │   │
│   │  - Class Start Time (HH:mm)                                       │   │
│   │  - Station-to-Campus Travel Time (mins)                           │   │
│   │  - Minimum Safety Buffer (mins)                                   │   │
│   │  - Simulated Train Delay (0, 10, 20, 30 mins)                     │   │
│   └─────────────────────────────────┬─────────────────────────────────┘   │
│                                     │                                     │
│                                     ▼                                     │
│   ┌───────────────────────────────────────────────────────────────────┐   │
│   │                Recommendation & Scheduling Engine                 │   │
│   │  - Arrival = Scheduled + Simulated Delay                          │   │
│   │  - Campus Arrival = Arrival + Transit Time                        │   │
│   │  - Buffer = Class Time - Campus Arrival                           │   │
│   │  - Status = Suitable (Buffer >= Target) | Tight | Late            │   │
│   │  - Ranking = Safety Health + Shortest Commute                     │   │
│   └───────────────┬───────────────────────────────────┬───────────────┘   │
│                   │                                   │                   │
│                   ▼                                   ▼                   │
│   ┌───────────────────────────────┐   ┌───────────────────────────────┐   │
│   │ Primary Recommendation Card   │   │ Interactive Train Results     │   │
│   │ & Delay Impact Matrix         │   │ & Step-by-Step Commute View   │   │
│   └───────────────────────────────┘   └───────────────────────────────┘   │
│                                                                           │
│   ┌───────────────────────────────────────────────────────────────────┐   │
│   │                     Train Data Manager Module                     │   │
│   │  - Manual Add/Edit Modal   - Plaintext Multiline Parser           │   │
│   │  - CSV Import & Exporter   - Data Validation & Reset to Demo      │   │
│   └───────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────────┘
```

### Core Entities & Data Structures
1. **TrainRecord**:
   - `id`: unique string identifier
   - `name`: string (e.g. "Kalyan Fast Local")
   - `number`: string (e.g. "95011")
   - `fromStation`: string (e.g. "Thane")
   - `toStation`: string (e.g. "Campus Junction")
   - `departureTime`: string (HH:mm)
   - `arrivalTime`: string (HH:mm)
   - `operatingDays`: string[] (optional, defaults to daily)
   - `notes`: string (optional, e.g. "Fast - skips intermediate stops")
   - `source`: `'demo'` | `'user'` | `'imported'`

2. **CommuteEvaluation**:
   - `train`: TrainRecord
   - `delayMinutes`: number
   - `scheduledArrival`: string (HH:mm)
   - `adjustedArrival`: string (HH:mm)
   - `campusArrival`: string (HH:mm)
   - `safetyBufferMinutes`: number
   - `suitability`: `'suitable'` | `'tight'` | `'late'`
   - `isRecommended`: boolean
   - `rationale`: string

3. **WeeklyClassPreset**:
   - `id`: string
   - `day`: string (e.g. 'Monday')
   - `courseName`: string (e.g. 'Computer Networks Lab')
   - `lectureTime`: string (e.g. '09:00')
   - `room`: string

---

## 5. Execution Steps

1. **Dataset & Scheduling Engine**: Build `src/data/demoTrains.ts` with 10 authentic commuter trains across 2 primary routes, plus `src/utils/scheduler.ts` with time math and ranking logic.
2. **State Management**: Create `src/context/TrainContext.tsx` handling local storage synchronization, mode tracking, and preset management.
3. **Core Interface Components**:
   - Navigation header with dataset badge and quick stats.
   - Journey Planner form with auto-populated station selectors and weekly timetable quick-pick.
   - Delay Simulator bar (0m, 10m, 20m, 30m).
   - Recommendation Summary Card with clear rationale and risk indicators.
   - Filtered Train Results Grid with breakdown of scheduled vs. adjusted times and campus arrival.
   - Interactive Delay Impact Matrix comparing all trains across delay options.
4. **Train Data Manager (Stage 2 Enabler)**:
   - Full-featured data panel with table view, search, and pagination.
   - Interactive "Add / Edit Train" modal.
   - Bulk-paste text parser supporting the required multiline format.
   - CSV file importer with validation, row preview, and error reporting.
   - CSV exporter and "Reset to Demo" with confirmation safety checks.
5. **Build Verification**: Run `compile_applet` and verify zero lint errors, test responsiveness, and ensure smooth data switching.
