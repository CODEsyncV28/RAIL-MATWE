import React, { useState, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Upload,
  Download,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Search,
  Train,
  AlertCircle,
} from 'lucide-react';
import { useTrains } from '../context/TrainContext';
import { TrainRecord } from '../types';
import { isValidTime, normalizeTime, parseBulkText, parseCSV } from '../utils/parsers';

interface ManageTrainDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'list' | 'add' | 'bulk' | 'csv' | 'controls';

export const ManageTrainDataModal: React.FC<ManageTrainDataModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    trains,
    isDemoMode,
    stats,
    addTrain,
    updateTrain,
    deleteTrain,
    bulkAddTrains,
    resetToDemoData,
    clearAllTrains,
    exportToCSV,
  } = useTrains();

  const [activeTab, setActiveTab] = useState<TabType>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTrain, setEditingTrain] = useState<TrainRecord | null>(null);

  // Single Add/Edit Form state
  const [formName, setFormName] = useState('');
  const [formNumber, setFormNumber] = useState('');
  const [formFrom, setFormFrom] = useState('');
  const [formTo, setFormTo] = useState('');
  const [formDeparture, setFormDeparture] = useState('');
  const [formArrival, setFormArrival] = useState('');
  const [formDays, setFormDays] = useState('Mon, Tue, Wed, Thu, Fri');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Bulk paste state
  const [bulkInput, setBulkInput] = useState('');
  const [bulkParsed, setBulkParsed] = useState<Array<Omit<TrainRecord, 'id' | 'source'>>>([]);
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  const [bulkSuccess, setBulkSuccess] = useState('');

  // CSV state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvParsed, setCsvParsed] = useState<Array<Omit<TrainRecord, 'id' | 'source'>>>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [csvFileName, setCsvFileName] = useState('');
  const [csvSuccess, setCsvSuccess] = useState('');

  // Confirmation state for destructive actions
  const [confirmAction, setConfirmAction] = useState<null | 'reset' | 'clear' | 'replace-bulk' | 'replace-csv'>(null);

  if (!isOpen) return null;

  // Filtered train list
  const filteredTrains = trains.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      (t.number && t.number.toLowerCase().includes(q)) ||
      t.fromStation.toLowerCase().includes(q) ||
      t.toStation.toLowerCase().includes(q)
    );
  });

  const handleStartEdit = (train: TrainRecord) => {
    setEditingTrain(train);
    setFormName(train.name);
    setFormNumber(train.number || '');
    setFormFrom(train.fromStation);
    setFormTo(train.toStation);
    setFormDeparture(train.departureTime);
    setFormArrival(train.arrivalTime);
    setFormDays((train.operatingDays || []).join(', '));
    setFormNotes(train.notes || '');
    setFormError('');
    setFormSuccess('');
    setActiveTab('add');
  };

  const handleResetForm = () => {
    setEditingTrain(null);
    setFormName('');
    setFormNumber('');
    setFormFrom('');
    setFormTo('');
    setFormDeparture('');
    setFormArrival('');
    setFormDays('Mon, Tue, Wed, Thu, Fri');
    setFormNotes('');
    setFormError('');
  };

  const handleSaveSingleTrain = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!formName.trim() || !formFrom.trim() || !formTo.trim() || !formDeparture.trim() || !formArrival.trim()) {
      setFormError('Please fill out all required fields (Name, Stations, and Times).');
      return;
    }

    if (!isValidTime(formDeparture)) {
      setFormError('Invalid Departure Time format. Please use HH:mm (e.g. 07:30).');
      return;
    }

    if (!isValidTime(formArrival)) {
      setFormError('Invalid Arrival Time format. Please use HH:mm (e.g. 08:15).');
      return;
    }

    const operatingDays = formDays
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);

    if (editingTrain) {
      updateTrain({
        ...editingTrain,
        name: formName.trim(),
        number: formNumber.trim() || undefined,
        fromStation: formFrom.trim(),
        toStation: formTo.trim(),
        departureTime: normalizeTime(formDeparture),
        arrivalTime: normalizeTime(formArrival),
        operatingDays: operatingDays.length > 0 ? operatingDays : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        notes: formNotes.trim() || undefined,
      });
      setFormSuccess('Train updated successfully!');
      setTimeout(() => {
        handleResetForm();
        setActiveTab('list');
      }, 1000);
    } else {
      addTrain({
        name: formName.trim(),
        number: formNumber.trim() || undefined,
        fromStation: formFrom.trim(),
        toStation: formTo.trim(),
        departureTime: normalizeTime(formDeparture),
        arrivalTime: normalizeTime(formArrival),
        operatingDays: operatingDays.length > 0 ? operatingDays : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        notes: formNotes.trim() || undefined,
      });
      setFormSuccess('New train added to active schedule!');
      setTimeout(() => {
        handleResetForm();
        setActiveTab('list');
      }, 1000);
    }
  };

  // Bulk parse handler
  const handleParseBulk = () => {
    setBulkErrors([]);
    setBulkSuccess('');
    const { records, errors } = parseBulkText(bulkInput);
    setBulkParsed(records);
    setBulkErrors(errors);
  };

  const handleCommitBulk = (replaceExisting: boolean) => {
    if (bulkParsed.length === 0) return;
    const result = bulkAddTrains(bulkParsed, replaceExisting);
    setBulkSuccess(
      `Successfully added ${result.added} train(s)${
        result.skippedDuplicates > 0 ? ` (${result.skippedDuplicates} duplicates skipped)` : ''
      }!`
    );
    setBulkParsed([]);
    setBulkInput('');
    setTimeout(() => {
      setActiveTab('list');
      setBulkSuccess('');
    }, 1200);
  };

  // CSV file handler
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    setCsvErrors([]);
    setCsvSuccess('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const { records, errors } = parseCSV(text);
      setCsvParsed(records);
      setCsvErrors(errors);
    };
    reader.readAsText(file);
  };

  const handleCommitCSV = (replaceExisting: boolean) => {
    if (csvParsed.length === 0) return;
    const result = bulkAddTrains(csvParsed, replaceExisting);
    setCsvSuccess(
      `Successfully imported ${result.added} train(s) from CSV${
        result.skippedDuplicates > 0 ? ` (${result.skippedDuplicates} duplicates skipped)` : ''
      }!`
    );
    setCsvParsed([]);
    setCsvFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setTimeout(() => {
      setActiveTab('list');
      setCsvSuccess('');
    }, 1200);
  };

  const loadSampleBulkTemplate = () => {
    setBulkInput(`Train: Campus Express Special
Number: 95101
From: Thane
To: Campus Junction
Departure: 07:25
Arrival: 08:00
Notes: Fast service with limited halts

Train: Central Suburban Local
Number: 95103
From: Thane
To: Campus Junction
Departure: 07:50
Arrival: 08:28
Notes: Regular commuter rake

Train: Morning EMU Direct
Number: 96105
From: Kalyan
To: Campus Junction
Departure: 07:15
Arrival: 08:02
Notes: Reliable college-hour connection`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0B101D] w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[92vh] my-auto text-slate-100">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-[#080D18]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-[#CCFF00]">
              <Train className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                  Manage Train Data
                </h2>
                {isDemoMode ? (
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-blue-950 text-blue-300 border border-blue-800">
                    Sample Demo Mode
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-[#CCFF00]/15 text-[#CCFF00] border border-[#CCFF00]/30 font-mono">
                    Custom Schedule Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Stage 1 & Stage 2 Manager: edit active records, bulk-paste timetables, or import CSV.
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

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-1 px-4 sm:px-6 pt-3 border-b border-slate-800 bg-[#0B101D] overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTab('list');
              handleResetForm();
            }}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'list'
                ? 'border-[#CCFF00] text-[#CCFF00]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Active Trains ({trains.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('add')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'add'
                ? 'border-[#CCFF00] text-[#CCFF00]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {editingTrain ? 'Edit Train' : 'Add Single Train'}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bulk')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'bulk'
                ? 'border-[#CCFF00] text-[#CCFF00]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Bulk Text Paste
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('csv')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'csv'
                ? 'border-[#CCFF00] text-[#CCFF00]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            CSV Import / Export
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('controls')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'controls'
                ? 'border-[#CCFF00] text-[#CCFF00]'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Dataset Controls
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-[#090D18]">
          {/* TAB 1: LIST ACTIVE TRAINS */}
          {activeTab === 'list' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by train name, number, or station..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-[#070A12] border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-white"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      handleResetForm();
                      setActiveTab('add');
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-black bg-[#CCFF00] hover:bg-[#D4FF00] rounded-xl transition-all shadow-sm cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Add Train</span>
                  </button>
                  <button
                    onClick={exportToCSV}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer border border-slate-700"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-400" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {filteredTrains.length === 0 ? (
                <div className="border border-dashed border-slate-800 rounded-2xl p-8 text-center text-slate-400 bg-[#070A12]">
                  <Train className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-white">No trains found</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {searchQuery
                      ? 'No records match your search filter.'
                      : 'There are currently no trains loaded in the system.'}
                  </p>
                  <div className="mt-4 flex justify-center gap-2">
                    <button
                      onClick={() => {
                        handleResetForm();
                        setActiveTab('add');
                      }}
                      className="px-3.5 py-1.5 text-xs font-bold text-black bg-[#CCFF00] rounded-lg"
                    >
                      Add First Train
                    </button>
                    <button
                      onClick={resetToDemoData}
                      className="px-3.5 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 rounded-lg hover:bg-slate-700"
                    >
                      Load Demo Timetable
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#070A12]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0D1322] border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3">Train</th>
                        <th className="py-2.5 px-3">Route</th>
                        <th className="py-2.5 px-3 text-center">Departure</th>
                        <th className="py-2.5 px-3 text-center">Arrival</th>
                        <th className="py-2.5 px-3">Source</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70">
                      {filteredTrains.map((train) => (
                        <tr key={train.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-3">
                            <div className="font-bold text-white">{train.name}</div>
                            {train.number && (
                              <span className="text-[11px] font-mono text-slate-400">
                                #{train.number}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-medium text-slate-300">
                              {train.fromStation} → {train.toStation}
                            </div>
                            {train.notes && (
                              <div className="text-[10px] text-slate-400 truncate max-w-xs">
                                {train.notes}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-semibold text-white">
                            {train.departureTime}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-semibold text-white">
                            {train.arrivalTime}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                train.source === 'demo'
                                  ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                  : train.source === 'imported'
                                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                                  : 'bg-[#CCFF00]/15 text-[#CCFF00] border border-[#CCFF00]/30'
                              }`}
                            >
                              {train.source}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right space-x-1">
                            <button
                              onClick={() => handleStartEdit(train)}
                              className="p-1.5 text-slate-400 hover:text-[#CCFF00] hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Edit train"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteTrain(train.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer"
                              title="Delete train"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ADD / EDIT SINGLE TRAIN */}
          {activeTab === 'add' && (
            <form onSubmit={handleSaveSingleTrain} className="max-w-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white">
                  {editingTrain ? `Editing: ${editingTrain.name}` : 'Add New Train Service'}
                </h3>
                {editingTrain && (
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    Cancel Editing
                  </button>
                )}
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-950 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3 rounded-xl bg-[#CCFF00]/15 border border-[#CCFF00]/30 text-[#CCFF00] text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Train Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dadar Fast Local"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#070A12] border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Train Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 95003"
                    value={formNumber}
                    onChange={(e) => setFormNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#070A12] border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none font-mono text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Boarding Station (From) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Thane"
                    value={formFrom}
                    onChange={(e) => setFormFrom(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#070A12] border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Destination Station (To) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Campus Junction"
                    value={formTo}
                    onChange={(e) => setFormTo(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#070A12] border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Departure Time (HH:mm) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={formDeparture}
                    onChange={(e) => setFormDeparture(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#070A12] border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none font-mono text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Arrival Time (HH:mm) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={formArrival}
                    onChange={(e) => setFormArrival(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#070A12] border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none font-mono text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Operating Days (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="Mon, Tue, Wed, Thu, Fri"
                  value={formDays}
                  onChange={(e) => setFormDays(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#070A12] border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notes / Route Information
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fast local, skips minor stations"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#070A12] border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  Clear
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-xs font-bold text-black bg-[#CCFF00] hover:bg-[#D4FF00] rounded-xl shadow-md shadow-[#CCFF00]/20 transition-all cursor-pointer"
                >
                  {editingTrain ? 'Save Changes' : 'Add Train to Schedule'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: BULK TEXT PASTE */}
          {activeTab === 'bulk' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white">Multiline Bulk Paste</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Paste train details in key-value format. You can preview and validate records before saving.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadSampleBulkTemplate}
                  className="text-xs text-[#CCFF00] hover:underline font-semibold self-start sm:self-auto cursor-pointer"
                >
                  Load Sample Template
                </button>
              </div>

              <div>
                <textarea
                  rows={8}
                  placeholder={`Train: Example Express\nNumber: 12345\nFrom: Station A\nTo: Station B\nDeparture: 07:10\nArrival: 08:05\n\nTrain: Example Passenger\nNumber: 12346\nFrom: Station A\nTo: Station B\nDeparture: 07:30\nArrival: 08:25`}
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  className="w-full p-3 font-mono text-xs bg-[#070A12] border border-slate-700 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none text-white leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleParseBulk}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-md shadow-blue-900/40 cursor-pointer"
                >
                  Parse & Preview Records
                </button>
                {bulkParsed.length > 0 && (
                  <span className="text-xs font-bold text-[#CCFF00]">
                    ✓ {bulkParsed.length} record(s) parsed successfully
                  </span>
                )}
              </div>

              {/* Bulk Errors */}
              {bulkErrors.length > 0 && (
                <div className="p-3 bg-rose-950 border border-rose-800 rounded-xl space-y-1">
                  <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    <span>Parsing Warnings / Errors:</span>
                  </div>
                  <ul className="text-xs text-rose-300 list-disc list-inside space-y-0.5">
                    {bulkErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {bulkSuccess && (
                <div className="p-3 bg-[#CCFF00]/15 border border-[#CCFF00]/30 rounded-xl text-xs text-[#CCFF00] font-bold">
                  {bulkSuccess}
                </div>
              )}

              {/* Bulk Preview Table */}
              {bulkParsed.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Preview Parsed Timetables ({bulkParsed.length})
                  </h4>
                  <div className="border border-slate-800 rounded-xl overflow-hidden max-h-60 overflow-y-auto bg-[#070A12]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#0D1322] border-b border-slate-800 text-slate-400 font-semibold text-[11px]">
                        <tr>
                          <th className="py-2 px-3">Name</th>
                          <th className="py-2 px-3">No.</th>
                          <th className="py-2 px-3">Route</th>
                          <th className="py-2 px-3 text-center">Departure</th>
                          <th className="py-2 px-3 text-center">Arrival</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {bulkParsed.map((rec, i) => (
                          <tr key={i} className="hover:bg-slate-800/40">
                            <td className="py-2 px-3 font-semibold text-white">{rec.name}</td>
                            <td className="py-2 px-3 font-mono text-slate-400">{rec.number || '-'}</td>
                            <td className="py-2 px-3 text-slate-300">{rec.fromStation} → {rec.toStation}</td>
                            <td className="py-2 px-3 text-center font-mono font-semibold text-white">{rec.departureTime}</td>
                            <td className="py-2 px-3 text-center font-mono font-semibold text-white">{rec.arrivalTime}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handleCommitBulk(false)}
                      className="px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer border border-slate-700"
                    >
                      Append to Current Records ({trains.length} existing)
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmAction('replace-bulk')}
                      className="px-4 py-2 text-xs font-extrabold text-black bg-[#CCFF00] hover:bg-[#D4FF00] rounded-xl transition-all shadow-md shadow-[#CCFF00]/20 cursor-pointer"
                    >
                      Replace All With These Records (Stage 2)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CSV IMPORT & EXPORT */}
          {activeTab === 'csv' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-white">CSV File Import & Export</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Import standard railway schedule spreadsheets or export your active records for backup.
                </p>
              </div>

              {/* Upload Card */}
              <div className="border-2 border-dashed border-slate-800 rounded-2xl p-6 text-center hover:border-blue-500 transition-colors bg-[#070A12]">
                <Upload className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-white">
                  Select a CSV schedule file
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Expected columns: Train Name, Train Number, From Station, To Station, Departure Time, Arrival Time
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv,text/csv"
                  onChange={handleCSVUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-md shadow-blue-900/40 cursor-pointer"
                >
                  Choose File {csvFileName && `(${csvFileName})`}
                </button>
              </div>

              {/* CSV Errors */}
              {csvErrors.length > 0 && (
                <div className="p-3 bg-rose-950 border border-rose-800 rounded-xl space-y-1">
                  <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    <span>CSV Validation Warnings:</span>
                  </div>
                  <ul className="text-xs text-rose-300 list-disc list-inside space-y-0.5">
                    {csvErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {csvSuccess && (
                <div className="p-3 bg-[#CCFF00]/15 border border-[#CCFF00]/30 rounded-xl text-xs text-[#CCFF00] font-bold">
                  {csvSuccess}
                </div>
              )}

              {/* CSV Preview */}
              {csvParsed.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    CSV Records Preview ({csvParsed.length})
                  </h4>
                  <div className="border border-slate-800 rounded-xl overflow-hidden max-h-60 overflow-y-auto bg-[#070A12]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#0D1322] border-b border-slate-800 text-slate-400 font-semibold text-[11px]">
                        <tr>
                          <th className="py-2 px-3">Name</th>
                          <th className="py-2 px-3">No.</th>
                          <th className="py-2 px-3">From → To</th>
                          <th className="py-2 px-3 text-center">Departure</th>
                          <th className="py-2 px-3 text-center">Arrival</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {csvParsed.map((rec, i) => (
                          <tr key={i} className="hover:bg-slate-800/40">
                            <td className="py-2 px-3 font-semibold text-white">{rec.name}</td>
                            <td className="py-2 px-3 font-mono text-slate-400">{rec.number || '-'}</td>
                            <td className="py-2 px-3 text-slate-300">{rec.fromStation} → {rec.toStation}</td>
                            <td className="py-2 px-3 text-center font-mono font-semibold text-white">{rec.departureTime}</td>
                            <td className="py-2 px-3 text-center font-mono font-semibold text-white">{rec.arrivalTime}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handleCommitCSV(false)}
                      className="px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer border border-slate-700"
                    >
                      Append to Schedule
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmAction('replace-csv')}
                      className="px-4 py-2 text-xs font-extrabold text-black bg-[#CCFF00] hover:bg-[#D4FF00] rounded-xl transition-all shadow-md shadow-[#CCFF00]/20 cursor-pointer"
                    >
                      Replace All Active Trains
                    </button>
                  </div>
                </div>
              )}

              {/* Export Button */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Download Backup</div>
                  <div className="text-[11px] text-slate-400">
                    Export your current {trains.length} timetable records into a .csv file.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={exportToCSV}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer border border-slate-700"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span>Download CSV</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: DATASET CONTROLS & RESET */}
          {activeTab === 'controls' && (
            <div className="space-y-5 max-w-xl">
              <div>
                <h3 className="text-sm font-bold text-white">Dataset Lifecycle & Reset</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Manage your data storage state, switch between demo records and custom datasets, or restore defaults.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-[#070A12] space-y-2">
                <div className="text-xs font-semibold text-slate-300">Storage Overview:</div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-[#0D1322] p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Total Trains</span>
                    <span className="text-base font-bold text-white">{stats.totalTrains}</span>
                  </div>
                  <div className="bg-[#0D1322] p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Demo Records</span>
                    <span className="text-base font-bold text-blue-400">{stats.demoCount}</span>
                  </div>
                  <div className="bg-[#0D1322] p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">User Custom</span>
                    <span className="text-base font-bold text-[#CCFF00]">{stats.userCount}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {/* Reset to Demo */}
                <div className="p-4 rounded-xl border border-slate-800 bg-[#070A12] flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-white">Restore Initial Demo Timetable</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Replaces current records with the 12 default Indian commuter train records.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfirmAction('reset')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer shrink-0 border border-slate-700"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Demo</span>
                  </button>
                </div>

                {/* Clear All */}
                <div className="p-4 rounded-xl border border-rose-900/60 bg-rose-950/20 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-rose-300">Clear All Train Records</h4>
                    <p className="text-[11px] text-rose-400/80 mt-0.5">
                      Deletes all records from localStorage to start with a fresh blank canvas for Stage 2.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfirmAction('clear')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors cursor-pointer shrink-0 shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Confirmation Modal Overlay */}
        {confirmAction && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-2xs flex items-center justify-center p-4 z-60">
            <div className="bg-[#0B101D] rounded-2xl max-w-md w-full p-5 border border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h4 className="text-sm font-bold text-white">
                  {confirmAction === 'reset' && 'Reset to Demo Timetable?'}
                  {confirmAction === 'clear' && 'Clear All Timetable Records?'}
                  {confirmAction === 'replace-bulk' && 'Replace Active Dataset?'}
                  {confirmAction === 'replace-csv' && 'Replace Active Dataset with CSV?'}
                </h4>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {confirmAction === 'reset' &&
                  'This will overwrite any custom train records with the initial 12 sample Indian commuter records. You can always export your current data before resetting.'}
                {confirmAction === 'clear' &&
                  'This will remove all train records from your browser storage. You can manually enter or import fresh trains afterward.'}
                {confirmAction === 'replace-bulk' &&
                  `This will replace your current ${trains.length} record(s) with the ${bulkParsed.length} train(s) parsed from your bulk text block.`}
                {confirmAction === 'replace-csv' &&
                  `This will replace your current ${trains.length} record(s) with the ${csvParsed.length} train(s) loaded from your CSV file.`}
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmAction(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirmAction === 'reset') resetToDemoData();
                    if (confirmAction === 'clear') clearAllTrains();
                    if (confirmAction === 'replace-bulk') handleCommitBulk(true);
                    if (confirmAction === 'replace-csv') handleCommitCSV(true);
                    setConfirmAction(null);
                    setActiveTab('list');
                  }}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg cursor-pointer shadow-xs"
                >
                  Confirm & Proceed
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
