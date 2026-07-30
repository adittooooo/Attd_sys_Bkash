import React, { useState } from 'react';
import { AttendanceRecord } from '../types';
import { PlusCircle, Clock, User, Briefcase, Calendar, FileText } from 'lucide-react';

interface AddLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRecord: (record: Partial<AttendanceRecord>) => Promise<void>;
  existingNames: string[];
}

export const AddLogModal: React.FC<AddLogModalProps> = ({
  isOpen,
  onClose,
  onAddRecord,
  existingNames,
}) => {
  const [name, setName] = useState('');
  const [customName, setCustomName] = useState('');
  const [designation, setDesignation] = useState('Sales Executive');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeStamp, setTimeStamp] = useState('09:00:00');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name === 'NEW' ? customName.trim() : name;
    if (!finalName) return;

    setIsSubmitting(true);
    try {
      await onAddRecord({
        name: finalName,
        designation,
        date,
        timeStamp,
        notes: notes.trim(),
      });
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <PlusCircle className="w-5 h-5 text-indigo-400" />
            <span>New In-Time Attendance Punch</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Name Selection or Custom */}
          <div>
            <label className="block font-medium text-slate-300 mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-sky-400" />
              Employee Name
            </label>
            <select
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none cursor-pointer"
            >
              <option value="">Select Existing Employee...</option>
              {existingNames.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
              <option value="NEW">+ Add New Staff Member</option>
            </select>

            {name === 'NEW' && (
              <input
                type="text"
                placeholder="Enter Full Employee Name..."
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                required
                className="w-full mt-2 bg-slate-950 text-slate-200 border border-indigo-500/50 rounded-2xl px-3.5 py-2.5 text-sm focus:outline-none"
              />
            )}
          </div>

          {/* Designation */}
          <div>
            <label className="block font-medium text-slate-300 mb-1 flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-purple-400" />
              Designation
            </label>
            <input
              type="text"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="e.g. Accounts Officer, Branch Manager"
              required
              className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Date & Time Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-2xl px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                In Time (Time Stamp)
              </label>
              <input
                type="time"
                step="1"
                value={timeStamp}
                onChange={(e) => setTimeStamp(e.target.value)}
                required
                className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-2xl px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block font-medium text-slate-300 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Notes / Remarks
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Field visit, Daulatpur market work..."
              className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-2xl px-3.5 py-2 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (!name && !customName)}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition shadow-sm"
            >
              {isSubmitting ? 'Saving...' : 'Save In-Time Record'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
