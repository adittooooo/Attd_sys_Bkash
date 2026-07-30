import React, { useState } from 'react';
import { AttendanceRecord } from '../types';
import { formatToBDTime } from '../lib/dateUtils';
import { 
  ArrowUpDown, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  User, 
  Briefcase, 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  Info,
  Trash2,
  Eye,
  FileText
} from 'lucide-react';

interface AttendanceTableProps {
  records: AttendanceRecord[];
  onDeleteRecord: (id: string) => void;
  onSelectEmployee: (employeeName: string) => void;
}

type SortField = 'date' | 'name' | 'designation' | 'timeStamp' | 'status';

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  records,
  onDeleteRecord,
  onSelectEmployee,
}) => {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  const itemsPerPage = 12;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedRecords = [...records].sort((a, b) => {
    let valA = a[sortField] || '';
    let valB = b[sortField] || '';
    if (sortAsc) {
      return valA.localeCompare(valB);
    }
    return valB.localeCompare(valA);
  });

  const totalPages = Math.ceil(sortedRecords.length / itemsPerPage) || 1;
  const paginatedRecords = sortedRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-sm overflow-hidden transition-colors duration-200">
      
      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950/90 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-4 px-4 w-12 text-center">SL</th>
              
              <th 
                onClick={() => handleSort('date')}
                className="py-4 px-4 cursor-pointer hover:text-white transition"
              >
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Date</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>

              <th 
                onClick={() => handleSort('name')}
                className="py-4 px-4 cursor-pointer hover:text-white transition"
              >
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-sky-400" />
                  <span>Employee Name</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>

              <th 
                onClick={() => handleSort('designation')}
                className="py-4 px-4 cursor-pointer hover:text-white transition"
              >
                <div className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-purple-400" />
                  <span>Designation</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>

              <th 
                onClick={() => handleSort('timeStamp')}
                className="py-4 px-4 cursor-pointer hover:text-white transition"
              >
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>In Time (Time Stamp)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>

              <th className="py-4 px-4">Remarks / Notes</th>
              <th className="py-4 px-4 text-right">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60 text-sm">
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  <FileText className="w-10 h-10 mx-auto mb-2 text-slate-600 opacity-60" />
                  <p className="text-base font-semibold text-slate-300">No attendance records found</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Try adjusting your search term or date range filter.
                  </p>
                </td>
              </tr>
            ) : (
              paginatedRecords.map((r, index) => {
                const globalIndex = (currentPage - 1) * itemsPerPage + index + 1;
                return (
                  <tr 
                    key={r.id} 
                    className="hover:bg-slate-800/80 transition group"
                  >
                    <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-500">
                      {globalIndex}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-300">
                      {r.date}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-white">
                      <button
                        onClick={() => onSelectEmployee(r.name)}
                        className="hover:text-indigo-400 hover:underline text-left transition cursor-pointer"
                        title="Click to view staff report"
                      >
                        {r.name}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-300">
                      <span className="bg-slate-800/80 px-2.5 py-1 rounded-lg text-slate-300 border border-slate-700/60">
                        {r.designation}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-emerald-400">
                      <span className="bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-500/20 inline-block">
                        {formatToBDTime(r.timeStamp, true)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-400 max-w-xs truncate">
                      {r.notes || '—'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedRecord(r)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                          title="View Punch Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteRecord(r.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Pagination Footer */}
      {records.length > 0 && (
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-3">
          <div>
            Showing <span className="font-semibold text-slate-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
            <span className="font-semibold text-slate-900 dark:text-white">
              {Math.min(currentPage * itemsPerPage, records.length)}
            </span>{' '}
            of <span className="font-semibold text-slate-900 dark:text-white">{records.length}</span> entries
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Record Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">In-Time Attendance Detail</h3>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Employee Name:</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedRecord.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Designation:</span>
                <span className="text-slate-700 dark:text-slate-200">{selectedRecord.designation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Date:</span>
                <span className="font-mono text-slate-700 dark:text-slate-200">{selectedRecord.date}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">In Time (Time Stamp):</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                  {formatToBDTime(selectedRecord.timeStamp, true)}
                </span>
              </div>
              {selectedRecord.notes && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Remarks / Notes:</span>
                  <p className="text-xs bg-slate-50 dark:bg-slate-950 p-3 rounded-xl text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                    {selectedRecord.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedRecord(null)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
