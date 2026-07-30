import React from 'react';
import { COMPANY_INFO, DEVELOPER_INFO } from '../types';
import { Building2, Code2, GraduationCap, Phone, Mail, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-12 py-8 px-4 sm:px-6 lg:px-8 print:hidden">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Company Overview */}
        <div className="space-y-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <h2 className="font-bold text-white text-base">{COMPANY_INFO.name}</h2>
          </div>
          <p className="text-xs text-slate-400 max-w-md">
            Official Attendance & Payroll Management Portal for Daulatpur & Kushtia Region.
          </p>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-slate-400 pt-1">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-indigo-400" />
              {COMPANY_INFO.address}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              {COMPANY_INFO.contact}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-sky-400" />
              {COMPANY_INFO.email}
            </span>
          </div>
        </div>

        {/* Developer Attribution Card */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow-sm text-center md:text-right max-w-sm w-full md:w-auto">
          <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1 flex items-center justify-center md:justify-end gap-1.5">
            <Code2 className="w-3.5 h-3.5" />
            <span>System Developer</span>
          </div>
          <p className="text-sm font-bold text-white">{DEVELOPER_INFO.name}</p>
          <div className="flex items-center justify-center md:justify-end gap-1.5 text-xs text-slate-300 mt-0.5">
            <GraduationCap className="w-3.5 h-3.5 text-sky-400" />
            <span>{DEVELOPER_INFO.dept}, {DEVELOPER_INFO.varsity}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 italic">
            Rajshahi University of Engineering & Technology
          </p>
        </div>

      </div>

      <div className="max-w-7xl mx-auto mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <p>© {new Date().getFullYear()} {COMPANY_INFO.name}. All rights reserved.</p>
        <p className="flex items-center gap-1 text-slate-400">
          Designed with precision for Adlu Trade International
        </p>
      </div>
    </footer>
  );
};
