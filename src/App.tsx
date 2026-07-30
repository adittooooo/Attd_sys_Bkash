/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import {
  AttendanceRecord,
  AttendanceFilter,
  SupabaseConfig,
  ShiftSettings,
  SummaryMetrics,
} from './types';
import {
  getSupabaseConfigFromStorage,
  DEFAULT_SHIFT_SETTINGS,
  fetchAttendanceFromSupabase,
  insertAttendanceToSupabase,
  getCurrentUser,
  onAuthStateChange,
  signOutUser,
} from './lib/supabase';
import { INITIAL_DEMO_RECORDS } from './lib/demoData';
import { exportToPDF } from './lib/exportUtils';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { MetricsCards } from './components/MetricsCards';
import { FilterBar } from './components/FilterBar';
import { AttendanceTable } from './components/AttendanceTable';
import { IndividualEmployeeReport } from './components/IndividualEmployeeReport';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { AuthModal } from './components/AuthModal';
import { AddLogModal } from './components/AddLogModal';
import { ImportCsvModal } from './components/ImportCsvModal';
import { PrintableReportView } from './components/PrintableReportView';
import { LoginPage } from './components/LoginPage';
import { DailyAttendanceView } from './components/DailyAttendanceView';

import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export default function App() {
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(
    getSupabaseConfigFromStorage()
  );
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Persistent App Login State (Once-login on device/app)
  const [isAppLoggedIn, setIsAppLoggedIn] = useState<boolean>(() => {
    return (
      localStorage.getItem('aditto_app_logged_in') === 'true' ||
      sessionStorage.getItem('aditto_app_logged_in') === 'true'
    );
  });

  const [shiftSettings] = useState<ShiftSettings>(DEFAULT_SHIFT_SETTINGS);
  const [records, setRecords] = useState<AttendanceRecord[]>(INITIAL_DEMO_RECORDS);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean>(() => window.innerWidth < 768);
  const [activeView, setActiveView] = useState<'daily' | 'table' | 'employee' | 'print'>(() => {
    return window.innerWidth < 768 ? 'daily' : 'table';
  });
  const [selectedStaffForReport, setSelectedStaffForReport] = useState<string>('');

  // Handle responsive view rules: Mobile only shows daily, PC hides daily
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile && activeView === 'daily') {
        setActiveView('table');
      } else if (mobile) {
        setActiveView('daily');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeView]);

  // Enforce dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Modals
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Toast message
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(
    null
  );

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Subscribe to Supabase Auth State
  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        setCurrentUser(user);
      })
      .catch(() => {})
      .finally(() => {
        setAuthChecking(false);
      });

    const subscription = onAuthStateChange((user) => {
      setCurrentUser(user);
      setAuthChecking(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setCurrentUser(null);
      setIsAppLoggedIn(false);
      localStorage.removeItem('aditto_app_logged_in');
      localStorage.removeItem('aditto_user_email');
      sessionStorage.removeItem('aditto_app_logged_in');
      showToast('Logged out of portal successfully.', 'info');
    } catch (err: any) {
      showToast(err.message || 'Logout failed', 'error');
    }
  };

  // Filter State
  const [filter, setFilter] = useState<AttendanceFilter>({
    searchTerm: '',
    designation: '',
    status: '',
    dateRange: {
      preset: 'all',
      startDate: '',
      endDate: '',
    },
  });

  // Load attendance records (from Supabase if connected, or local state)
  const loadAttendanceData = async (config = supabaseConfig) => {
    if (!config.url || !config.anonKey) {
      // Fallback to local / demo data
      return;
    }

    setIsLoading(true);
    try {
      const data = await fetchAttendanceFromSupabase(config, shiftSettings);
      if (data && data.length > 0) {
        setRecords(data);
        showToast(`Loaded ${data.length} records live from Supabase table "${config.tableName}"`, 'success');
      } else {
        showToast('Supabase table loaded, but currently has no records. Showing demo entries.', 'info');
      }
    } catch (err: any) {
      console.error('Failed to load from Supabase:', err);
      showToast(`Supabase fetch notice: ${err.message || 'Using local records'}`, 'info');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (supabaseConfig.isConnected && supabaseConfig.url) {
      loadAttendanceData(supabaseConfig);
    }
  }, [supabaseConfig.isConnected]);

  // Derived list of unique employee names and designations
  const allEmployees = useMemo(() => {
    const set = new Set(records.map((r) => r.name));
    return Array.from(set).sort();
  }, [records]);

  const allDesignations = useMemo(() => {
    const set = new Set(records.map((r) => r.designation));
    const list = Array.from(set).sort();
    return ['All Designations', ...list];
  }, [records]);

  // Filter records based on active criteria
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Search term
      if (filter.searchTerm) {
        const query = filter.searchTerm.toLowerCase();
        const nameMatch = r.name.toLowerCase().includes(query);
        const desigMatch = r.designation.toLowerCase().includes(query);
        if (!nameMatch && !desigMatch) return false;
      }

      // Designation
      if (filter.designation && r.designation !== filter.designation) {
        return false;
      }

      // Date Range
      if (filter.dateRange.startDate && r.date < filter.dateRange.startDate) {
        return false;
      }
      if (filter.dateRange.endDate && r.date > filter.dateRange.endDate) {
        return false;
      }

      return true;
    });
  }, [records, filter]);

  // Compute summary metrics
  const summaryMetrics: SummaryMetrics = useMemo(() => {
    const totalLogs = filteredRecords.length;
    const uniqueEmployees = new Set(filteredRecords.map((r) => r.name)).size;

    const presentCount = totalLogs;
    const onTimeCount = totalLogs;
    const lateCount = 0;
    const earlyOutCount = 0;

    const attendanceRate = totalLogs > 0 ? 100 : 0;
    const punctualityRate = 100;

    const totalHours = totalLogs * 8;
    const avgHoursPerDay = 8;

    return {
      totalLogs,
      uniqueEmployees,
      presentCount,
      lateCount,
      onTimeCount,
      earlyOutCount,
      attendanceRate,
      punctualityRate,
      avgHoursPerDay,
    };
  }, [filteredRecords]);

  // Handlers
  const handleAddRecord = async (newRecordPartial: Partial<AttendanceRecord>) => {
    const id = `rec-${Date.now()}`;
    const newRecord: AttendanceRecord = {
      id,
      name: newRecordPartial.name || 'Unnamed Staff',
      designation: newRecordPartial.designation || 'Staff',
      date: newRecordPartial.date || new Date().toISOString().split('T')[0],
      timeStamp: newRecordPartial.timeStamp || '09:00:00',
      status: 'On Time',
      workHours: 8,
      notes: newRecordPartial.notes,
    };

    // If connected to Supabase, attempt insert
    if (supabaseConfig.isConnected && supabaseConfig.url) {
      try {
        await insertAttendanceToSupabase(newRecord, supabaseConfig);
        showToast('Record inserted successfully into Supabase!', 'success');
      } catch (err: any) {
        showToast(`Local record created. Supabase notice: ${err.message}`, 'info');
      }
    } else {
      showToast('Record added to attendance log!', 'success');
    }

    setRecords((prev) => [newRecord, ...prev]);
  };

  const handleDeleteRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    showToast('Record removed.', 'info');
  };

  const handleImportRecords = (imported: AttendanceRecord[]) => {
    setRecords((prev) => [...imported, ...prev]);
    showToast(`Successfully imported ${imported.length} records!`, 'success');
  };

  const handleSelectEmployeeForReport = (empName: string) => {
    setSelectedStaffForReport(empName);
    setActiveView('employee');
  };

  const handleExportPDFAll = () => {
    const rangeText =
      filter.dateRange.startDate && filter.dateRange.endDate
        ? `${filter.dateRange.startDate} to ${filter.dateRange.endDate}`
        : 'All Available Logs';

    exportToPDF(filteredRecords, 'ATTENDANCE SUMMARY REPORT', rangeText);
    showToast('PDF report generated and downloaded.', 'success');
  };

  const handlePrintReport = () => {
    setActiveView('print');
  };

  const handleResetFilters = () => {
    setFilter({
      searchTerm: '',
      designation: '',
      status: '',
      dateRange: {
        preset: 'all',
        startDate: '',
        endDate: '',
      },
    });
    showToast('Filters reset.', 'info');
  };

  const dateRangeText =
    filter.dateRange.startDate && filter.dateRange.endDate
      ? `${filter.dateRange.startDate} to ${filter.dateRange.endDate}`
      : 'All Logged Records';

  // Auth checking loader screen
  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-400">Verifying session with Supabase...</p>
        </div>
      </div>
    );
  }

  // Without login none can access any part of this web app
  if (!currentUser && !isAppLoggedIn) {
    return (
      <>
        {toast && (
          <div className="fixed top-20 right-4 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
            <div
              className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-xl text-xs font-semibold ${
                toast.type === 'success'
                  ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
                  : toast.type === 'error'
                  ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
                  : 'bg-slate-900 border-slate-700 text-slate-200'
              }`}
            >
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-indigo-400" />}
              <span>{toast.message}</span>
            </div>
          </div>
        )}
        <LoginPage
          onLoginSuccess={(msg) => {
            setIsAppLoggedIn(true);
            showToast(msg, 'success');
          }}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-xl text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
                : toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
                : 'bg-slate-900 border-slate-700 text-slate-200'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-indigo-400" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main App Header */}
      <Header
        supabaseConfig={supabaseConfig}
        currentUser={currentUser}
        onLogout={handleSignOut}
        onOpenConfig={() => setIsConfigModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onExportPDF={handleExportPDFAll}
        onPrintReport={handlePrintReport}
        onRefreshData={() => loadAttendanceData(supabaseConfig)}
        isLoading={isLoading}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      {/* Main Body Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Mobile View ONLY shows Daily Present. PC View hides Daily Present option */}
        {isMobile ? (
          <DailyAttendanceView
            records={records}
            allEmployees={allEmployees}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onOpenFullDashboard={() => {}}
          />
        ) : activeView === 'print' ? (
          <PrintableReportView
            records={filteredRecords}
            allRecords={records}
            filter={filter}
            dateRangeText={dateRangeText}
            onBack={() => setActiveView('table')}
          />
        ) : activeView === 'employee' ? (
          /* Individual Employee Summary View */
          <IndividualEmployeeReport
            records={records}
            allEmployees={allEmployees}
            initialSelectedEmployee={selectedStaffForReport}
            onBackToTable={() => setActiveView('table')}
          />
        ) : (
          /* Interactive Dashboard & Attendance Table */
          <>
            {/* Filter and Search Bar */}
            <FilterBar
              filter={filter}
              onFilterChange={(updated) => setFilter((prev) => ({ ...prev, ...updated }))}
              designations={allDesignations}
              onResetFilters={handleResetFilters}
            />

            {/* Attendance Main Data Table */}
            <AttendanceTable
              records={filteredRecords}
              onDeleteRecord={handleDeleteRecord}
              onSelectEmployee={handleSelectEmployeeForReport}
            />
          </>
        )}

      </main>

      {/* Footer with Company Info & Developer Attribution */}
      <Footer />

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onAuthSuccess={(msg) => showToast(msg, 'success')}
      />

      <SupabaseConfigModal
        config={supabaseConfig}
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onConfigSaved={(updated) => {
          setSupabaseConfig(updated);
          loadAttendanceData(updated);
        }}
      />

      <AddLogModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddRecord={handleAddRecord}
        existingNames={allEmployees}
      />

      <ImportCsvModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportRecords={handleImportRecords}
        shiftSettings={shiftSettings}
      />

    </div>
  );
}
