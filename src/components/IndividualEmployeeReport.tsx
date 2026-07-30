import React, { useState } from 'react';
import { AttendanceRecord, COMPANY_INFO } from '../types';
import { User, Calendar, FileText } from 'lucide-react';
import { exportToPDF } from '../lib/exportUtils';
import { formatToBDTime } from '../lib/dateUtils';

interface IndividualEmployeeReportProps {
  records: AttendanceRecord[];
  allEmployees: string[];
  initialSelectedEmployee?: string;
  onBackToTable: () => void;
}

export const IndividualEmployeeReport: React.FC<IndividualEmployeeReportProps> = ({
  records,
  allEmployees,
  initialSelectedEmployee,
  onBackToTable,
}) => {
  const [selectedStaff, setSelectedStaff] = useState<string>(
    initialSelectedEmployee || (allEmployees[0] || '')
  );

  const staffRecords = records.filter((r) => r.name === selectedStaff);

  // Compute metrics for selected staff
  const totalLogs = staffRecords.length;
  const designation = staffRecords[0]?.designation || 'Staff Member';

  const handleExportIndividualPDF = () => {
    exportToPDF(
      staffRecords,
      `INDIVIDUAL ATTENDANCE REPORT - ${selectedStaff.toUpperCase()}`,
      `Employee: ${selectedStaff} | Designation: ${designation}`
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Staff Selector Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center gap-3.5 w-full sm:w-auto">
          <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-500/20">
            <User className="w-6 h-6" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Select Staff Member:
            </label>
            <select
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-base py-1.5 px-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-500 mt-1 cursor-pointer"
            >
              {allEmployees.map((emp) => (
                <option key={emp} value={emp}>
                  {emp}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            onClick={handleExportIndividualPDF}
            className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
            <span>Download Staff PDF</span>
          </button>

          <button
            onClick={onBackToTable}
            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 transition cursor-pointer"
          >
            View All Logs
          </button>
        </div>

      </div>

      {/* Staff Summary Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-md shrink-0">
              {selectedStaff.split(' ').map((n) => n[0]).slice(0, 2).join('')}
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">{selectedStaff}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="bg-slate-100 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-slate-200 dark:border-slate-700 text-xs px-2.5 py-0.5 rounded-lg font-semibold">
                  {designation}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {COMPANY_INFO.name} • Daulatpur Branch
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-6">
            <div className="text-center px-4">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-semibold">Total In-Time Logs</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">{totalLogs}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Individual Attendance History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span>In-Time History Log for {selectedStaff}</span>
          </h3>
          <span className="text-xs text-slate-400">{staffRecords.length} entries found</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">In Time (Time Stamp)</th>
                <th className="py-3.5 px-4">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {staffRecords.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-500 text-sm">
                    No attendance records logged for this staff member.
                  </td>
                </tr>
              ) : (
                staffRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/80 transition">
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-300">
                      {r.date}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-emerald-400">
                      <span className="bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-500/20 inline-block">
                        {formatToBDTime(r.timeStamp, true)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      {r.notes || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

