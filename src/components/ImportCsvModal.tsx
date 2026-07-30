import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { AttendanceRecord, ShiftSettings } from '../types';
import { normalizeSupabaseRow } from '../lib/supabase';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface ImportCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportRecords: (records: AttendanceRecord[]) => void;
  shiftSettings: ShiftSettings;
}

export const ImportCsvModal: React.FC<ImportCsvModalProps> = ({
  isOpen,
  onClose,
  onImportRecords,
  shiftSettings,
}) => {
  const [parsedRecords, setParsedRecords] = useState<AttendanceRecord[]>([]);
  const [fileName, setFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonRows = XLSX.utils.sheet_to_json(worksheet);

        if (!jsonRows || jsonRows.length === 0) {
          setErrorMsg('The uploaded spreadsheet contains no data rows.');
          return;
        }

        const normalized = jsonRows.map((row: any, idx: number) =>
          normalizeSupabaseRow(row, idx, shiftSettings)
        );

        setParsedRecords(normalized);
      } catch (err: any) {
        setErrorMsg('Failed to parse file. Please ensure it is a valid CSV or XLSX spreadsheet.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = () => {
    if (parsedRecords.length > 0) {
      onImportRecords(parsedRecords);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <Upload className="w-5 h-5 text-amber-400" />
            <span>Import Attendance Spreadsheet (CSV / Excel)</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        {/* Drop Area */}
        <div className="space-y-3">
          <div className="border-2 border-dashed border-slate-700 hover:border-amber-500 rounded-2xl p-6 text-center bg-slate-950/50 cursor-pointer transition relative">
            <input
              type="file"
              accept=".csv, .xlsx, .xls"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <FileSpreadsheet className="w-10 h-10 text-amber-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-200">
              {fileName || 'Click or drag & drop attendance sheet'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports CSV, XLSX files with columns: Name, Designation, Time Stamps, Date
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {parsedRecords.length > 0 && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>
                  Parsed <strong className="text-white">{parsedRecords.length}</strong> attendance records ready for import!
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Preview snippet */}
        {parsedRecords.length > 0 && (
          <div className="max-h-36 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950 p-2 text-[11px] font-mono text-slate-300">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500">
                  <th className="p-1">Name</th>
                  <th className="p-1">Designation</th>
                  <th className="p-1">Date</th>
                  <th className="p-1">Time</th>
                  <th className="p-1">Status</th>
                </tr>
              </thead>
              <tbody>
                {parsedRecords.slice(0, 5).map((r, i) => (
                  <tr key={i} className="border-b border-slate-900">
                    <td className="p-1">{r.name}</td>
                    <td className="p-1">{r.designation}</td>
                    <td className="p-1">{r.date}</td>
                    <td className="p-1">{r.timeStamp}</td>
                    <td className="p-1">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedRecords.length > 5 && (
              <p className="text-center text-slate-500 mt-1 text-[10px]">
                ... and {parsedRecords.length - 5} more rows
              </p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmImport}
            disabled={parsedRecords.length === 0}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition"
          >
            Import {parsedRecords.length > 0 ? `(${parsedRecords.length} records)` : ''}
          </button>
        </div>

      </div>
    </div>
  );
};
