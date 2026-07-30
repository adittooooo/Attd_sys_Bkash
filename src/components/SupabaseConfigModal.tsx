import React, { useState } from 'react';
import { SupabaseConfig } from '../types';
import { testSupabaseConnection, saveSupabaseConfigToStorage, getSampleSQLScript } from '../lib/supabase';
import { Database, CheckCircle2, AlertCircle, Copy, Check, Terminal, ExternalLink, RefreshCw } from 'lucide-react';

interface SupabaseConfigModalProps {
  config: SupabaseConfig;
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: (newConfig: SupabaseConfig) => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  config,
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  const [url, setUrl] = useState(config.url || '');
  const [anonKey, setAnonKey] = useState(config.anonKey || '');
  const [tableName, setTableName] = useState(config.tableName || 'attendance');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [showSql, setShowSql] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    const testCfg: SupabaseConfig = {
      url: url.trim(),
      anonKey: anonKey.trim(),
      tableName: tableName.trim() || 'attendance',
      isConnected: false,
    };

    const res = await testSupabaseConnection(testCfg);
    setIsTesting(false);
    setTestResult(res);
  };

  const handleSave = async () => {
    setIsTesting(true);
    const updatedConfig: SupabaseConfig = {
      url: url.trim(),
      anonKey: anonKey.trim(),
      tableName: tableName.trim() || 'attendance',
      isConnected: false,
    };

    const testRes = await testSupabaseConnection(updatedConfig);
    setIsTesting(false);

    updatedConfig.isConnected = testRes.success;
    updatedConfig.lastConnectedAt = testRes.success ? new Date().toISOString() : undefined;

    saveSupabaseConfigToStorage(updatedConfig);
    onConfigSaved(updatedConfig);
    onClose();
  };

  const sqlCode = getSampleSQLScript(tableName || 'attendance');

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Supabase Database Integration</h2>
              <p className="text-xs text-slate-400">
                Connect your Supabase table (`Name`, `designation`, `time stamps`, `date`)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Inputs */}
        <div className="space-y-4 text-xs">
          
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Supabase Project URL
            </label>
            <input
              type="text"
              placeholder="https://xyzcompany.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-500 text-sm font-mono"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Found in Supabase Dashboard → Project Settings → API
            </span>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Supabase Anon / Public Key
            </label>
            <input
              type="password"
              placeholder="eyJhY2Nlc3NfdG9rZW4iOi..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-500 text-sm font-mono"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Used for client-side queries safely
            </span>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Table Name in Supabase
            </label>
            <input
              type="text"
              placeholder="attendance"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-500 text-sm font-mono"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Matches table containing: <code className="text-amber-400">Name</code>, <code className="text-amber-400">designation</code>, <code className="text-amber-400">time stamps</code>, <code className="text-amber-400">date</code>
            </span>
          </div>

        </div>

        {/* Test Result Feedback */}
        {testResult && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
              testResult.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">{testResult.success ? 'Connection Successful' : 'Connection Failed'}</p>
              <p className="mt-0.5 opacity-90">{testResult.message}</p>
            </div>
          </div>
        )}

        {/* SQL Setup Helper Toggle */}
        <div className="border-t border-slate-800 pt-3">
          <button
            onClick={() => setShowSql(!showSql)}
            className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold hover:underline"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>{showSql ? 'Hide SQL Creation Script' : 'Need help creating table in Supabase? Get SQL Script'}</span>
          </button>

          {showSql && (
            <div className="mt-3 bg-slate-950 border border-slate-800 rounded-xl p-3 relative">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] font-mono text-slate-400">Supabase SQL Editor Code</span>
                <button
                  onClick={handleCopySql}
                  className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-xs px-2.5 py-1 rounded text-amber-300"
                >
                  {copiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSql ? 'Copied!' : 'Copy SQL'}</span>
                </button>
              </div>
              <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto p-2 bg-slate-900 rounded border border-slate-800/80 max-h-48 leading-relaxed">
                {sqlCode}
              </pre>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800 pt-4">
          <button
            onClick={handleTestConnection}
            disabled={isTesting || !url || !anonKey}
            className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-700 flex items-center justify-center gap-2"
          >
            {isTesting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>Test Connection</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isTesting}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-2 rounded-xl text-xs transition"
            >
              Save & Connect
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
