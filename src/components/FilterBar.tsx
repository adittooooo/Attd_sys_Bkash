import React, { useState } from 'react';
import { AttendanceFilter, DateRangeFilter, ShiftSettings } from '../types';
import { Search, Filter, Calendar, Clock, Settings, RotateCcw, ChevronDown } from 'lucide-react';

interface FilterBarProps {
  filter: AttendanceFilter;
  onFilterChange: (updated: Partial<AttendanceFilter>) => void;
  designations: string[];
  shiftSettings: ShiftSettings;
  onShiftSettingsChange: (settings: ShiftSettings) => void;
  onResetFilters: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filter,
  onFilterChange,
  designations,
  onResetFilters,
}) => {
  const handlePresetChange = (preset: DateRangeFilter['preset']) => {
    const today = new Date();
    let startDate = '';
    let endDate = '';

    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    if (preset === 'today') {
      startDate = formatDate(today);
      endDate = formatDate(today);
    } else if (preset === 'yesterday') {
      const y = new Date(today);
      y.setDate(today.getDate() - 1);
      startDate = formatDate(y);
      endDate = formatDate(y);
    } else if (preset === 'this_week') {
      const first = new Date(today);
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday start
      first.setDate(diff);
      startDate = formatDate(first);
      endDate = formatDate(today);
    } else if (preset === 'this_month') {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      startDate = formatDate(first);
      endDate = formatDate(today);
    } else if (preset === 'last_month') {
      const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const last = new Date(today.getFullYear(), today.getMonth(), 0);
      startDate = formatDate(first);
      endDate = formatDate(last);
    } else if (preset === 'all') {
      startDate = '';
      endDate = '';
    }

    onFilterChange({
      dateRange: {
        preset,
        startDate,
        endDate,
      },
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
      
      {/* Search and Designation Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        
        {/* Search Input */}
        <div className="md:col-span-7 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Employee Name or Designation..."
            value={filter.searchTerm}
            onChange={(e) => onFilterChange({ searchTerm: e.target.value })}
            className="w-full bg-slate-950 text-slate-200 placeholder-slate-500 pl-10 pr-4 py-2.5 rounded-2xl border border-slate-800 focus:outline-none focus:border-indigo-500 text-sm transition"
          />
        </div>

        {/* Filter by Designation */}
        <div className="md:col-span-4">
          <select
            value={filter.designation}
            onChange={(e) => onFilterChange({ designation: e.target.value })}
            className="w-full bg-slate-950 text-slate-200 py-2.5 px-3.5 rounded-2xl border border-slate-800 focus:outline-none focus:border-indigo-500 text-sm transition cursor-pointer"
          >
            {designations.map((d) => (
              <option key={d} value={d === 'All Designations' ? '' : d} className="bg-slate-900 text-slate-200">
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Reset Filter Button */}
        <div className="md:col-span-1 flex items-center justify-end">
          <button
            onClick={onResetFilters}
            className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-2xl border border-slate-800 flex items-center justify-center transition cursor-pointer"
            title="Reset filters"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Date Range Presets Pill Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/80">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-400 font-semibold flex items-center gap-1 mr-1">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            Range:
          </span>

          {[
            { key: 'all', label: 'All Records' },
            { key: 'today', label: 'Today' },
            { key: 'yesterday', label: 'Yesterday' },
            { key: 'this_week', label: 'This Week' },
            { key: 'this_month', label: 'This Month' },
            { key: 'last_month', label: 'Last Month' },
          ].map((p) => (
            <button
              key={p.key}
              onClick={() => handlePresetChange(p.key as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                filter.dateRange.preset === p.key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom Start & End Date Selectors */}
        <div className="flex items-center gap-2 text-xs">
          <input
            type="date"
            value={filter.dateRange.startDate}
            onChange={(e) =>
              onFilterChange({
                dateRange: {
                  ...filter.dateRange,
                  preset: 'custom',
                  startDate: e.target.value,
                },
              })
            }
            className="bg-slate-950 text-slate-300 border border-slate-800 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
          />
          <span className="text-slate-500">to</span>
          <input
            type="date"
            value={filter.dateRange.endDate}
            onChange={(e) =>
              onFilterChange({
                dateRange: {
                  ...filter.dateRange,
                  preset: 'custom',
                  endDate: e.target.value,
                },
              })
            }
            className="bg-slate-950 text-slate-300 border border-slate-800 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

    </div>
  );
};
