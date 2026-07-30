import React from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  Printer, 
  RefreshCw,
  User,
  LogOut
} from 'lucide-react';
import { COMPANY_INFO, SupabaseConfig } from '../types';

interface HeaderProps {
  supabaseConfig: SupabaseConfig;
  currentUser: SupabaseUser | null;
  onLogout?: () => void;
  onOpenConfig: () => void;
  onOpenAuthModal: () => void;
  onOpenAddModal: () => void;
  onOpenImportModal: () => void;
  onExportPDF?: () => void;
  onPrintReport: () => void;
  onRefreshData: () => void;
  isLoading: boolean;
  activeView: 'table' | 'employee' | 'print';
  setActiveView: (view: 'table' | 'employee' | 'print') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  onExportPDF,
  onPrintReport,
  onRefreshData,
  isLoading,
  activeView,
  setActiveView,
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md backdrop-blur-md">
      {/* Top Banner with Company Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Company Identity */}
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-2xl border border-indigo-500/30 shadow-inner flex items-center justify-center shrink-0">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-sans">
                {COMPANY_INFO.name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-300">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  {COMPANY_INFO.address}
                </span>
                <span className="hidden sm:inline text-slate-600">•</span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <a href={`tel:${COMPANY_INFO.contact}`} className="hover:underline">{COMPANY_INFO.contact}</a>
                </span>
                <span className="hidden sm:inline text-slate-600">•</span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <a href={`mailto:${COMPANY_INFO.email}`} className="hover:underline">{COMPANY_INFO.email}</a>
                </span>
              </div>
            </div>
          </div>

          {/* Database Connection, Auth & Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Sync / Refresh */}
            <button
              onClick={onRefreshData}
              disabled={isLoading}
              className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition cursor-pointer"
              title="Reload data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>

            {/* Current User Badge & Sign Out Button */}
            {currentUser && (
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-slate-200">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="truncate max-w-[140px]">{currentUser.email}</span>
                </div>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20 shadow-sm cursor-pointer"
                    title="Sign Out of Portal"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            )}

          </div>
        </div>

        {/* View Tabs & Export Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-800">
          
          {/* Navigation View Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveView('table')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeView === 'table'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              In-Time Dashboard
            </button>
            <button
              onClick={() => setActiveView('employee')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeView === 'employee'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Individual Staff Report
            </button>
            <button
              onClick={() => setActiveView('print')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeView === 'print'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Print Preview
            </button>
          </div>

          {/* Export & Action Buttons - Print ONLY */}
          <div className="flex items-center gap-2">
            <button
              onClick={onPrintReport}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span>Print</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
