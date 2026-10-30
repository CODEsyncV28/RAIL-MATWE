import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Calendar,
} from 'lucide-react';
import { useTrains } from '../context/TrainContext';
import { WeeklyClassPreset } from '../types';

interface ClassPresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: WeeklyClassPreset) => void;
}

export const ClassPresetsModal: React.FC<ClassPresetsModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
}) => {
  const { classPresets, addClassPreset, deleteClassPreset } = useTrains();

  const [isAdding, setIsAdding] = useState(false);
  const [day, setDay] = useState<WeeklyClassPreset['day']>('Monday');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [time, setTime] = useState('09:00');
  const [room, setRoom] = useState('');
  const [fromStation, setFromStation] = useState('');
  const [toStation, setToStation] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim() || !time.trim()) return;

    addClassPreset({
      day,
      courseCode: code.trim().toUpperCase(),
      courseName: name.trim(),
      lectureTime: time,
      room: room.trim() || undefined,
      defaultStationPair:
        fromStation && toStation ? { from: fromStation, to: toStation } : undefined,
    });

    setCode('');
    setName('');
    setRoom('');
    setIsAdding(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0B101D] w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[88vh] my-auto text-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-[#080D18]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-[#CCFF00]">
              <Calendar className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                Weekly Class Timetable Presets
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Quickly select your semester lectures to auto-calculate the safest commuter train.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 bg-[#090D18]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Saved Course Schedules ({classPresets.length})
            </span>
            {!isAdding && (
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-black bg-[#CCFF00] hover:bg-[#D4FF00] rounded-xl transition-all shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add Class</span>
              </button>
            )}
          </div>

          {/* Add form */}
          {isAdding && (
            <form onSubmit={handleSubmit} className="p-4 rounded-xl border border-blue-900/60 bg-[#0D1322] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Add New Weekly Lecture</span>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Day</label>
                  <select
                    value={day}
                    onChange={(e) => setDay(e.target.value as WeeklyClassPreset['day'])}
                    className="w-full px-2.5 py-1.5 text-xs bg-[#070A12] border border-slate-700 rounded-lg outline-none text-white"
                  >
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d) => (
                      <option key={d} value={d} className="bg-[#070A12] text-white">
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Course Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS101"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-[#070A12] border border-slate-700 rounded-lg outline-none uppercase font-mono text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Lecture Time</label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-[#070A12] border border-slate-700 rounded-lg outline-none font-mono text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Course Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Advanced Data Structures"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-[#070A12] border border-slate-700 rounded-lg outline-none text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Room / Lab (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Lab 4, Tech Block"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-[#070A12] border border-slate-700 rounded-lg outline-none text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-black bg-[#CCFF00] hover:bg-[#D4FF00] rounded-lg shadow-sm"
                >
                  Save Preset
                </button>
              </div>
            </form>
          )}

          {/* Preset list */}
          <div className="grid grid-cols-1 gap-2.5">
            {classPresets.map((preset) => (
              <div
                key={preset.id}
                className="p-3 sm:p-4 rounded-xl border border-slate-800 hover:border-blue-500 hover:shadow-lg transition-all bg-[#0D1322] flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#CCFF00] bg-[#070A12] px-2 py-0.5 rounded-md border border-slate-700">
                      {preset.courseCode}
                    </span>
                    <span className="text-sm font-bold text-white">
                      {preset.courseName}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-300">{preset.day}</span>
                    <span>·</span>
                    <span className="font-mono font-bold text-[#CCFF00]">{preset.lectureTime}</span>
                    {preset.room && (
                      <>
                        <span>·</span>
                        <span>{preset.room}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectPreset(preset);
                      onClose();
                    }}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer border border-blue-500 shadow-sm"
                  >
                    Select for Commute
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteClassPreset(preset.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer"
                    title="Delete preset"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
