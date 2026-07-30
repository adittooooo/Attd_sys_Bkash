export interface AttendanceRecord {
  id: string;
  name: string;
  designation: string;
  date: string; // YYYY-MM-DD
  timeStamp: string; // HH:mm:ss or full ISO string
  clockOutTime?: string; // Optional clock out time
  status: 'On Time' | 'Late' | 'Early Out' | 'Absent' | 'Present';
  workHours?: number; // Calculated hours
  notes?: string;
}

export interface RawSupabaseRow {
  id?: string | number;
  Name?: string;
  name?: string;
  Employee_Name?: string;
  employee_name?: string;
  
  designation?: string;
  Designation?: string;
  role?: string;
  
  date?: string;
  Date?: string;
  created_at?: string;
  
  'time stamps'?: string;
  time_stamps?: string;
  timestamp?: string;
  time_stamp?: string;
  time?: string;
  clock_in?: string;
  clock_out?: string;
  [key: string]: any;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  tableName: string;
  isConnected: boolean;
  lastConnectedAt?: string;
}

export interface ShiftSettings {
  workStartTime: string; // e.g. "09:00"
  gracePeriodMinutes: number; // e.g. 15
  workEndTime: string; // e.g. "17:00"
  fullDayHours: number; // e.g. 8
}

export interface DateRangeFilter {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  preset: 'today' | 'yesterday' | 'this_week' | 'this_month' | 'last_month' | 'custom' | 'all';
}

export interface AttendanceFilter {
  searchTerm: string;
  designation: string;
  status: string;
  dateRange: DateRangeFilter;
}

export interface SummaryMetrics {
  totalLogs: number;
  uniqueEmployees: number;
  presentCount: number;
  lateCount: number;
  onTimeCount: number;
  earlyOutCount: number;
  attendanceRate: number;
  punctualityRate: number;
  avgHoursPerDay: number;
}

export const COMPANY_INFO = {
  name: "Adlu Trade International",
  address: "Thana Bazar, Daulatpur, Kushtia",
  contact: "01917210000",
  email: "adlutrade.bkash@yahoo.com",
  tagline: "Authorized Distributor & Trade Partner",
};

export const DEVELOPER_INFO = {
  name: "Ahsanul Kabir Aditto",
  dept: "Mechanical Engineering",
  varsity: "RUET",
  title: "Full Stack Developer & Systems Engineer",
};
