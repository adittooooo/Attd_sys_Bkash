import React from 'react';
import { SummaryMetrics } from '../types';
import { Users, Clock, Calendar, CheckCircle2 } from 'lucide-react';

interface MetricsCardsProps {
  metrics: SummaryMetrics;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      
      {/* Total Logs Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm hover:border-indigo-500/50 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total In-Time Logs</span>
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black text-white font-mono">{metrics.totalLogs}</span>
          <span className="text-xs font-medium text-slate-400">entries</span>
        </div>
        <div className="mt-2 text-xs text-slate-400">
          In-time punch records loaded
        </div>
      </div>

      {/* Active Employees */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm hover:border-indigo-500/50 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Staff</span>
          <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-2xl border border-sky-500/20">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black text-white font-mono">{metrics.uniqueEmployees}</span>
          <span className="text-xs font-medium text-slate-400">staff members</span>
        </div>
        <div className="mt-2 text-xs text-slate-400">
          Registered in attendance logs
        </div>
      </div>

      {/* Check-ins Logged */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm hover:border-indigo-500/50 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">In-Time Punches</span>
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black text-emerald-400 font-mono">{metrics.presentCount}</span>
          <span className="text-xs font-medium text-emerald-400/80">
            punches
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-400">
          In-time timestamps recorded
        </div>
      </div>

      {/* Status Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm hover:border-indigo-500/50 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">System Status</span>
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
            <Clock className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-xl font-bold text-indigo-400">In-Time Only</span>
        </div>
        <div className="mt-2 text-xs text-slate-400">
          Simplified timestamp log mode
        </div>
      </div>

    </div>
  );
};

