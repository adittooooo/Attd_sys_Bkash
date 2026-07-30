import React, { useState } from 'react';
import { AttendanceRecord } from '../types';
import { formatToBDTime, parseISOToBDDateTime } from '../lib/dateUtils';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  UserCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  User,
  Building2,
  Sparkles,
  ArrowRightLeft
} from 'lucide-react';

interface DailyAttendanceViewProps {
  records: AttendanceRecord[];
  allEmployees: string[];
  onOpenAddModal: () => void;
  onOpenFullDashboard?: () => void;
}

export const DailyAttendanceView: React.FC<DailyAttendanceViewProps> = ({
  records,
  allEmployees,
  onOpenAddModal,
  onOpenFullDashboard,
}) => {
  // Today's date in Bangladesh Standard Time (YYYY-MM-DD)
  const todayDate = parseISOToBDDateTime(new Date().toISOString()).date || new Date().toISOString().split('T')[0];
  
  const [selectedDate, setSelectedDate] = useState<string>(todayDate);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Handle Date Navigation
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(todayDate);
  };

  // Filter records for the selected date
  const dayRecords = records.filter((r) => r.date === selectedDate);

  // Filter by search term if typed
  const filteredDayRecords = dayRecords.filter((r) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return r.name.toLowerCase().includes(term) || r.designation.toLowerCase().includes(term);
  });

  // Calculate statistics for selected day
  const totalPresent = dayRecords.length;
  const onTimeCount = dayRecords.filter((r) => r.status === 'On Time').length;
  const lateCount = dayRecords.filter((r) => r.status === 'Late').length;

  // Format nice readable date header
  const formatReadableDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (_) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto pb-12">
      
      {/* Date Navigation & Selector Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs tracking-wider uppercase">
              <Calendar className="w-4 h-4" />
              <span>Daily Attendance Tracker</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
              {formatReadableDate(selectedDate)}
            </h2>
            {selectedDate === todayDate && (
              <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3" /> Today (Current)
              </span>
            )}
          </div>

          {/* Quick Date Control Buttons */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <button
              onClick={handlePrevDay}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer active:scale-95 border border-slate-700/60"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleToday}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                selectedDate === todayDate
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700/60'
              }`}
            >
              Today
            </button>

            <button
              onClick={handleNextDay}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer active:scale-95 border border-slate-700/60"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Date Input Selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-400 whitespace-nowrap">
            Select Date:
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-950 text-slate-100 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-indigo-500 transition w-full sm:w-auto"
          />
        </div>

      </div>

      {/* Summary Stat Badges for Selected Day */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 text-center">
          <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
            <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Present</span>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-white">
            {totalPresent}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 text-center">
          <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>On Time</span>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-emerald-400">
            {onTimeCount}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 text-center">
          <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Late</span>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-amber-400">
            {lateCount}
          </span>
        </div>
      </div>

      {/* Search Input Filter for Present Persons */}
      {dayRecords.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search person or designation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 pl-10 pr-4 py-3 rounded-2xl text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
      )}

      {/* List of Present Persons */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>Present Staff List ({filteredDayRecords.length})</span>
          </h3>
          {onOpenAddModal && (
            <button
              onClick={onOpenAddModal}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
            >
              + Add Entry
            </button>
          )}
        </div>

        {filteredDayRecords.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-8 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-800 text-slate-500 rounded-2xl flex items-center justify-center mx-auto">
              <User className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-300">
                {dayRecords.length === 0
                  ? `No attendance recorded for ${selectedDate}`
                  : 'No persons matching your search query'}
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Select a different date above or log a new entry to record attendance.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredDayRecords.map((record) => (
              <div
                key={record.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition shadow-md flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-sm shrink-0">
                    {record.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-white truncate">
                      {record.name}
                    </h4>
                    <p className="text-xs text-slate-400 truncate">
                      {record.designation}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 gap-1">
                  <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl">
                    <Clock className="w-3 h-3 text-emerald-400" />
                    <span>{formatToBDTime(record.timeStamp, true)}</span>
                  </div>

                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                      record.status === 'On Time'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : record.status === 'Late'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-indigo-500/20 text-indigo-300'
                    }`}
                  >
                    {record.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Switch to Full Dashboard toggle */}
      {onOpenFullDashboard && (
        <div className="pt-4 text-center">
          <button
            onClick={onOpenFullDashboard}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-indigo-400 transition bg-slate-900 hover:bg-slate-800 px-4 py-2.5 rounded-2xl border border-slate-800"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Switch to Full Detailed Dashboard</span>
          </button>
        </div>
      )}

    </div>
  );
};
