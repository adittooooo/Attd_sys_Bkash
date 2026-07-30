import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import { AttendanceRecord, RawSupabaseRow, SupabaseConfig, ShiftSettings } from '../types';
import { parseISOToBDDateTime } from './dateUtils';

let cachedClient: SupabaseClient | null = null;
let currentConfig: SupabaseConfig | null = null;

export const DEFAULT_SUPABASE_URL = 'https://zrqfipvtrnqogkamhoxe.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpycWZpcHZ0cm5xb2drYW1ob3hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzOTM2OTgsImV4cCI6MjEwMDk2OTY5OH0.4uhZ_MCNDuLyUiex8uV6wPfnH1u1FeRwRqyPAI5KoAo';

// Default shift settings (09:00 AM start, 15m grace)
export const DEFAULT_SHIFT_SETTINGS: ShiftSettings = {
  workStartTime: '09:00',
  gracePeriodMinutes: 15,
  workEndTime: '17:00',
  fullDayHours: 8,
};

export function getSupabaseConfigFromStorage(): SupabaseConfig {
  const saved = localStorage.getItem('adlu_supabase_config');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    } catch (e) {
      console.error('Failed to parse saved Supabase config:', e);
    }
  }
  return {
    url: DEFAULT_SUPABASE_URL,
    anonKey: DEFAULT_SUPABASE_ANON_KEY,
    tableName: 'attendance',
    isConnected: true,
  };
}

export function saveSupabaseConfigToStorage(config: SupabaseConfig) {
  localStorage.setItem('adlu_supabase_config', JSON.stringify(config));
  cachedClient = null;
  currentConfig = config;
}

export function getSupabaseClient(config?: SupabaseConfig): SupabaseClient {
  const cfg = config || getSupabaseConfigFromStorage();
  const targetUrl = cfg.url || DEFAULT_SUPABASE_URL;
  const targetKey = cfg.anonKey || DEFAULT_SUPABASE_ANON_KEY;

  if (!cachedClient || currentConfig?.url !== targetUrl || currentConfig?.anonKey !== targetKey) {
    cachedClient = createClient(targetUrl, targetKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    currentConfig = { ...cfg, url: targetUrl, anonKey: targetKey };
  }
  return cachedClient;
}

// --- Supabase Authentication Helpers ---

export async function signInWithEmail(email: string, password: string) {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signUpWithEmail(email: string, password: string, name?: string) {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name || '',
      },
    },
  });
  if (error) throw error;
  return data;
}

export async function signOutUser() {
  const client = getSupabaseClient();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<SupabaseUser | null> {
  const client = getSupabaseClient();
  const { data: { user } } = await client.auth.getUser();
  return user;
}

export function onAuthStateChange(callback: (user: SupabaseUser | null) => void) {
  const client = getSupabaseClient();
  const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });
  return subscription;
}


export function calculateStatusAndHours(
  timeStr: string,
  clockOutStr?: string,
  shift: ShiftSettings = DEFAULT_SHIFT_SETTINGS
): { status: 'On Time' | 'Late' | 'Early Out' | 'Present'; workHours: number } {
  let status: 'On Time' | 'Late' | 'Early Out' | 'Present' = 'Present';
  let workHours = shift.fullDayHours;

  if (!timeStr) return { status: 'Present', workHours: 8 };

  const parseMinutes = (str: string): number => {
    if (str.includes('T')) {
      const parsed = parseISOToBDDateTime(str);
      str = parsed.time24;
    }
    const isPM = /pm/i.test(str);
    const isAM = /am/i.test(str);
    const cleanStr = str.replace(/am|pm/gi, '').trim();
    const parts = cleanStr.split(':').map(n => parseInt(n, 10) || 0);
    let h = parts[0] || 0;
    const m = parts[1] || 0;

    if (isPM && h < 12) h += 12;
    if (isAM && h === 12) h = 0;

    return h * 60 + m;
  };

  const actualCheckInMin = parseMinutes(timeStr);

  // Shift start time comparison
  const [shiftH, shiftM] = shift.workStartTime.split(':').map(n => parseInt(n, 10) || 9);
  const shiftStartMin = shiftH * 60 + shiftM;
  const graceCutoffMin = shiftStartMin + shift.gracePeriodMinutes;

  if (actualCheckInMin <= graceCutoffMin) {
    status = 'On Time';
  } else {
    status = 'Late';
  }

  // Calculate duration if clockOutTime exists
  if (clockOutStr) {
    const actualCheckOutMin = parseMinutes(clockOutStr);
    const diffMinutes = Math.max(0, actualCheckOutMin - actualCheckInMin);
    workHours = Math.round((diffMinutes / 60) * 10) / 10;

    const [endH, endM] = shift.workEndTime.split(':').map(n => parseInt(n, 10) || 17);
    const shiftEndMin = endH * 60 + endM;

    if (actualCheckOutMin < shiftEndMin - 15 && status === 'On Time') {
      status = 'Early Out';
    }
  }

  return { status, workHours };
}

export function normalizeSupabaseRow(row: RawSupabaseRow, index: number, shift: ShiftSettings): AttendanceRecord {
  // Extract Name
  const name =
    row.Name ||
    row.name ||
    row.Employee_Name ||
    row.employee_name ||
    row.staff_name ||
    row.user_name ||
    'Unnamed Employee';

  // Extract Designation
  const designation =
    row.designation ||
    row.Designation ||
    row.role ||
    row.Title ||
    row.position ||
    'Staff';

  // Extract raw date & timestamp fields
  let rawDate = row.date || row.Date || row.log_date || '';
  let rawTimeStamp =
    row['time stamps'] ||
    row.time_stamps ||
    row.timestamp ||
    row.time_stamp ||
    row.time ||
    row.clock_in ||
    '';

  let date = rawDate;
  let timeStamp = rawTimeStamp;

  // Convert created_at or ISO strings using BD Standard Time (UTC+6)
  if (row.created_at) {
    const parsed = parseISOToBDDateTime(row.created_at);
    if (!date || date.includes('T')) {
      date = parsed.date;
    }
    if (!timeStamp) {
      timeStamp = parsed.time24;
    } else if (timeStamp.includes('T')) {
      const parsedTs = parseISOToBDDateTime(timeStamp);
      timeStamp = parsedTs.time24;
    }
  }

  if (timeStamp && timeStamp.includes('T')) {
    const parsedTs = parseISOToBDDateTime(timeStamp);
    timeStamp = parsedTs.time24;
  }

  if (!date) {
    date = parseISOToBDDateTime(new Date().toISOString()).date;
  }
  if (!timeStamp) timeStamp = '09:00:00';

  const clockOutTime = row.clock_out || row.time_out || undefined;

  const { status, workHours } = calculateStatusAndHours(timeStamp, clockOutTime, shift);

  return {
    id: String(row.id || `supa-${index}-${Date.now()}`),
    name,
    designation,
    date,
    timeStamp,
    clockOutTime,
    status: (row.status as any) || status,
    workHours: row.work_hours || workHours,
    notes: row.notes || row.remarks || '',
  };
}

export async function testSupabaseConnection(config: SupabaseConfig): Promise<{ success: boolean; message: string; count?: number }> {
  try {
    const client = createClient(config.url, config.anonKey);
    const { data, error, count } = await client
      .from(config.tableName)
      .select('*', { count: 'exact', head: false })
      .limit(5);

    if (error) {
      return { success: false, message: error.message };
    }

    return {
      success: true,
      message: `Successfully connected to table "${config.tableName}". Loaded ${data?.length || 0} sample rows.`,
      count: count || data?.length || 0,
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error or invalid Supabase URL/Key' };
  }
}

export async function fetchAttendanceFromSupabase(
  config: SupabaseConfig,
  shiftSettings: ShiftSettings = DEFAULT_SHIFT_SETTINGS
): Promise<AttendanceRecord[]> {
  const client = getSupabaseClient(config);
  if (!client) throw new Error('Supabase client not configured.');

  // Try ordering by date descending first
  let res = await client
    .from(config.tableName)
    .select('*')
    .order('date', { ascending: false });

  // If ordering by 'date' fails because column 'date' does not exist in the table schema
  if (res.error && (res.error.message?.includes('date') || res.error.code === '42703')) {
    // Try ordering by id
    res = await client
      .from(config.tableName)
      .select('*')
      .order('id', { ascending: false });

    // If ordering by id also fails, query without explicit order
    if (res.error) {
      res = await client
        .from(config.tableName)
        .select('*');
    }
  }

  if (res.error) {
    console.error('Supabase fetch error:', res.error);
    throw new Error(res.error.message);
  }

  const normalized = (res.data || []).map((row, idx) => normalizeSupabaseRow(row, idx, shiftSettings));

  // Perform client-side sort by date descending
  return normalized.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

export async function insertAttendanceToSupabase(
  record: Partial<AttendanceRecord>,
  config: SupabaseConfig
): Promise<boolean> {
  const client = getSupabaseClient(config);
  if (!client) return false;

  // Map to common column names or user standard format
  const payload = {
    Name: record.name,
    designation: record.designation,
    date: record.date,
    'time stamps': record.timeStamp,
    clock_out: record.clockOutTime,
    status: record.status,
    notes: record.notes,
  };

  const { error } = await client.from(config.tableName).insert([payload]);
  if (error) {
    console.error('Error inserting row to Supabase:', error);
    throw new Error(error.message);
  }
  return true;
}

export function getSampleSQLScript(tableName = 'attendance'): string {
  return `-- SQL Script for Supabase Table Creation
-- Run this in your Supabase SQL Editor (https://app.supabase.com)

CREATE TABLE IF NOT EXISTS public.${tableName} (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "Name" TEXT NOT NULL,
    designation TEXT NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    "time stamps" TIME DEFAULT CURRENT_TIME,
    clock_out TIME,
    status TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Turn on Row Level Security (RLS) or allow public read/write for dev
ALTER TABLE public.${tableName} ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read access" ON public.${tableName}
FOR SELECT USING (true);

CREATE POLICY "Allow anon insert access" ON public.${tableName}
FOR INSERT WITH CHECK (true);

-- Insert Sample Data for Adlu Trade International
INSERT INTO public.${tableName} ("Name", designation, date, "time stamps", clock_out, status, notes) VALUES
('Md. Tariqul Islam', 'Branch Manager', '2026-07-30', '08:52:10', '17:05:00', 'On Time', 'Morning inspection'),
('Kabir Hossain', 'Accounts Officer', '2026-07-30', '08:58:34', '17:15:00', 'On Time', 'Daily ledger setup'),
('Abu Raihan', 'Store In-Charge', '2026-07-30', '09:05:12', '17:00:00', 'On Time', 'Inventory audit'),
('Sabbir Ahmed', 'Senior Sales Executive', '2026-07-30', '09:22:45', '17:30:00', 'Late', 'Traffic delay Daulatpur'),
('Mostafizur Rahman', 'Field Operations Officer', '2026-07-30', '08:45:00', '16:45:00', 'On Time', 'Field visit'),
('Sharmin Akter', 'Computer Operator', '2026-07-30', '08:55:20', '17:00:00', 'On Time', 'Billing department'),
('Mehedi Hasan', 'bKash Distribution Officer', '2026-07-30', '09:40:15', '17:00:00', 'Late', 'Route distribution');
`;
}
