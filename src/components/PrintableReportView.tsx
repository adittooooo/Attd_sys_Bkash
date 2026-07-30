import React, { useState, useMemo, useRef } from 'react';
import { AttendanceRecord, AttendanceFilter, COMPANY_INFO, DEVELOPER_INFO } from '../types';
import { Printer, Download, ArrowLeft, LayoutGrid, List, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { formatToBDTime, getBDCurrentTimestamp } from '../lib/dateUtils';

interface PrintableReportViewProps {
  records: AttendanceRecord[];
  allRecords?: AttendanceRecord[];
  filter?: AttendanceFilter;
  dateRangeText: string;
  onBack: () => void;
}

function convertOklchToRgb(oklchStr: string): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#010203';
      ctx.fillStyle = oklchStr;
      const computed = ctx.fillStyle;
      if (computed && computed !== '#010203' && !computed.includes('oklch')) {
        return computed;
      }
    }
  } catch (_) {}
  return 'rgb(51, 65, 85)';
}

function replaceOklchInString(cssText: string): string {
  if (!cssText || !cssText.includes('oklch')) return cssText;
  return cssText.replace(/oklch\([^)]+\)/gi, (match) => convertOklchToRgb(match));
}

function getJsPdfInstance(options: any) {
  const Constructor = typeof jsPDF === 'function' 
    ? jsPDF 
    : (jsPDF as any)?.jsPDF || (jsPDF as any)?.default || jsPDF;
  return new Constructor(options);
}

function getHtml2CanvasFunc() {
  if (typeof html2canvas === 'function') return html2canvas;
  return (html2canvas as any)?.default || html2canvas;
}

// Helper to generate consecutive array of date strings YYYY-MM-DD
function generateDateRangeArray(startStr: string, endStr: string): string[] {
  if (!startStr || !endStr) return [];
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return [startStr];
  }

  const dates: string[] = [];
  const curr = new Date(start);
  // Cap at 31 days max to prevent extreme wide overflow if all-time range
  let count = 0;
  while (curr <= end && count < 31) {
    dates.push(curr.toISOString().split('T')[0]);
    curr.setDate(curr.getDate() + 1);
    count++;
  }
  return dates;
}

// Day of week letter: M, T, W, T, F, S, S
function getDayLetter(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay(); // 0 is Sun, 1 is Mon...
  const letters = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  return letters[day] || '';
}

// Day number string (01, 02, ..., 19, 20)
function getDayNumberStr(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  return parts[2] || dateStr;
}

export const PrintableReportView: React.FC<PrintableReportViewProps> = ({
  records,
  allRecords = [],
  filter,
  dateRangeText,
  onBack,
}) => {
  const [reportFormat, setReportFormat] = useState<'matrix' | 'list'>('matrix');
  const [isDownloading, setIsDownloading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!reportRef.current) {
      window.print();
      return;
    }

    try {
      // Create printing iframe to bypass sandbox restriction
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0px';
      iframe.style.height = '0px';
      iframe.style.border = 'none';

      document.body.appendChild(iframe);

      const pri = iframe.contentWindow;
      if (pri) {
        const isLandscape = reportFormat === 'matrix';
        const content = reportRef.current.innerHTML;

        pri.document.open();
        pri.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Daily Attendance OT Report</title>
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                @page {
                  size: A4 ${isLandscape ? 'landscape' : 'portrait'};
                  margin: 5mm;
                }
                body {
                  font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
                  background: #ffffff !important;
                  color: #000000 !important;
                  padding: 12px;
                  margin: 0;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                table {
                  width: 100% !important;
                  border-collapse: collapse !important;
                }
              </style>
            </head>
            <body>
              <div>${content}</div>
              <script>
                window.onload = function() {
                  setTimeout(function() {
                    window.focus();
                    window.print();
                  }, 400);
                };
              </script>
            </body>
          </html>
        `);
        pri.document.close();

        setTimeout(() => {
          try {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          } catch (_) {}
        }, 5000);
      } else {
        window.print();
      }
    } catch (e) {
      console.warn('Iframe print failed, falling back to window.print():', e);
      window.print();
    }
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setIsDownloading(true);
    try {
      const h2c = getHtml2CanvasFunc();
      const canvas = await h2c(reportRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc: Document) => {
          // 1. Sanitize all <style> elements in cloned document (replaces oklch with canvas-converted rgb values)
          const styleEls = clonedDoc.querySelectorAll('style');
          styleEls.forEach((s) => {
            if (s.textContent && s.textContent.includes('oklch')) {
              s.textContent = replaceOklchInString(s.textContent);
            }
          });

          // 2. Sanitize inline style attributes on all cloned elements
          const allCloned = clonedDoc.querySelectorAll('*');
          allCloned.forEach((el) => {
            const htmlEl = el as HTMLElement;
            if (htmlEl.getAttribute) {
              const styleAttr = htmlEl.getAttribute('style');
              if (styleAttr && styleAttr.includes('oklch')) {
                htmlEl.setAttribute('style', replaceOklchInString(styleAttr));
              }
            }
          });

          // 3. Ensure printable canvas wrapper has explicit white background and dark text
          const cloneCanvas = (clonedDoc.querySelector('.printable-canvas') as HTMLElement) || (clonedDoc.body as HTMLElement);
          if (cloneCanvas) {
            cloneCanvas.style.backgroundColor = '#ffffff';
            cloneCanvas.style.color = '#0f172a';
          }
        },
      });

      const imgData = canvas.toDataURL('image/png');
      const isLandscape = reportFormat === 'matrix';

      const pdf = getJsPdfInstance({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 5;

      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight - margin * 2;

      while (heightLeft > 0) {
        position = margin - (imgHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight - margin * 2;
      }

      pdf.save(`Daily_Attendance_OT_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      // Fallback to print
      handlePrint();
    } finally {
      setIsDownloading(false);
    }
  };

  // Determine date sequence for the matrix header
  const dateList = useMemo(() => {
    if (filter?.dateRange?.startDate && filter?.dateRange?.endDate) {
      return generateDateRangeArray(filter.dateRange.startDate, filter.dateRange.endDate);
    }

    // Extract unique dates from records
    const recordDates: string[] = Array.from(new Set<string>(records.map((r) => r.date))).sort();
    if (recordDates.length > 0) {
      const minDate: string = recordDates[0];
      const maxDate: string = recordDates[recordDates.length - 1];
      const generated = generateDateRangeArray(minDate, maxDate);
      return generated.length > 0 ? generated : recordDates;
    }

    // Fallback to today
    const today = new Date().toISOString().split('T')[0];
    return [today];
  }, [filter, records]);

  // Formatted date range string for report header e.g. "2022-09-19 -- 2022-09-20"
  const formattedDateHeader = useMemo(() => {
    if (dateList.length === 0) return dateRangeText;
    if (dateList.length === 1) return `${dateList[0]} -- ${dateList[0]}`;
    return `${dateList[0]} -- ${dateList[dateList.length - 1]}`;
  }, [dateList, dateRangeText]);

  // Filter subtitle e.g. "(Rahim)" or "(HR)" or "(All)"
  const filterSubtitle = useMemo(() => {
    if (filter?.searchTerm) return `(${filter.searchTerm})`;
    if (filter?.designation) return `(${filter.designation})`;
    return `(All Employees)`;
  }, [filter]);

  // Group records by Employee Name
  const employeeList = useMemo(() => {
    const employeeMap = new Map<string, {
      name: string;
      designation: string;
      acNo: string;
      recordsByDate: Map<string, AttendanceRecord>;
    }>();

    // Map existing records
    records.forEach((r) => {
      if (!employeeMap.has(r.name)) {
        const generatedAc = String(1110 + (employeeMap.size + 1));
        employeeMap.set(r.name, {
          name: r.name,
          designation: r.designation || 'Staff',
          acNo: generatedAc,
          recordsByDate: new Map<string, AttendanceRecord>(),
        });
      }
      employeeMap.get(r.name)?.recordsByDate.set(r.date, r);
    });

    return Array.from(employeeMap.values());
  }, [records]);

  // Summary counts for list view
  const totalCount = records.length;
  const onTimeCount = records.filter((r) => r.status === 'On Time').length;
  const lateCount = records.filter((r) => r.status === 'Late').length;
  const earlyOutCount = records.filter((r) => r.status === 'Early Out').length;

  return (
    <div className="space-y-6">
      {/* Global CSS for A4 printing */}
      <style>{`
        @media print {
          @page {
            size: ${reportFormat === 'matrix' ? 'A4 landscape' : 'A4 portrait'};
            margin: 6mm;
          }
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .printable-canvas {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: none !important;
            overflow: visible !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
          }
        }
      `}</style>
      
      {/* Top Controls Bar (Hidden during window.print()) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 px-3.5 py-2 rounded-xl transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setReportFormat('matrix')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              reportFormat === 'matrix'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>OT Report Matrix</span>
          </button>
          <button
            onClick={() => setReportFormat('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              reportFormat === 'list'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Detailed List View</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-lg transition cursor-pointer"
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{isDownloading ? 'Generating PDF...' : 'Download PDF'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-lg transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Main Printable Canvas */}
      <div 
        ref={reportRef}
        className="printable-canvas bg-white text-slate-950 rounded-2xl p-6 sm:p-8 shadow-2xl max-w-full overflow-x-auto print:shadow-none print:p-0 print:m-0 font-sans border border-slate-200 print:border-none"
      >
        
        {reportFormat === 'matrix' ? (
          /* ========================================================= */
          /* UPLOADED FORMAT: DAILY ATTENDANCE OT REPORT MATRIX TABLE  */
          /* ========================================================= */
          <div className="space-y-4">
            
            {/* Header Block Matching Requested Format */}
            <div className="border-b-2 border-slate-900 pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                  {COMPANY_INFO.name.toUpperCase()}
                </h1>
                <p className="text-xs text-slate-700 font-medium mt-1">
                  {COMPANY_INFO.address} | Contact: {COMPANY_INFO.contact}
                </p>
              </div>

              <div className="text-left md:text-right text-xs text-slate-600 space-y-1">
                <div 
                  className="inline-block font-bold px-3 py-1 rounded border border-slate-300"
                  style={{ backgroundColor: '#f1f5f9', color: '#0f172a', borderColor: '#cbd5e1' }}
                >
                  DAILY ATTENDANCE OT REPORT {filterSubtitle}
                </div>
                <p className="font-mono text-[11px] pt-1">
                  Filter: <strong className="text-slate-900">{formattedDateHeader}</strong>
                </p>
                <p className="font-mono text-[10px] text-slate-500 pt-0.5">
                  Generated: <strong className="text-slate-900">{getBDCurrentTimestamp()}</strong>
                </p>
              </div>
            </div>

            {/* High-Density Matrix Grid */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-slate-900 text-[11px] font-sans">
                <thead>
                  {/* Row 1: Columns & Date numbers */}
                  <tr 
                    className="border-b border-slate-900 font-bold text-center"
                    style={{ backgroundColor: '#f1f5f9', color: '#0f172a' }}
                  >
                    <th className="border-r border-slate-900 px-2 py-1.5 text-left w-28">
                      Name
                    </th>
                    <th className="border-r border-slate-900 px-2 py-1.5 text-center min-w-[100px]">
                      Designation
                    </th>

                    {/* Date Numbers Header */}
                    {dateList.map((d) => (
                      <th key={d} className="border-r border-slate-900 px-1 py-1 w-7 font-mono">
                        {getDayNumberStr(d)}
                      </th>
                    ))}

                    {/* Summary Columns Header */}
                    <th className="border-r border-slate-900 px-1.5 py-1 text-[10px] leading-tight">Total Working Days</th>
                    <th className="border-r border-slate-900 px-1.5 py-1 text-[10px] leading-tight">Total Present</th>
                    <th className="px-1.5 py-1 text-[10px] leading-tight">Absent</th>
                  </tr>

                  {/* Row 2: Days of week under date numbers */}
                  <tr 
                    className="border-b-2 border-slate-900 text-center text-[10px] font-bold"
                    style={{ backgroundColor: '#f8fafc', color: '#334155' }}
                  >
                    <td className="border-r border-slate-900 px-2 py-0.5 text-left"></td>
                    <td className="border-r border-slate-900 px-1.5 py-0.5"></td>

                    {/* Day of week initials M, T, W, T, F, S, S */}
                    {dateList.map((d) => (
                      <td key={d} className="border-r border-slate-900 px-1 py-0.5 font-mono">
                        {getDayLetter(d)}
                      </td>
                    ))}

                    {/* Empty cells under summary header */}
                    <td className="border-r border-slate-900"></td>
                    <td className="border-r border-slate-900"></td>
                    <td></td>
                  </tr>
                </thead>

                <tbody>
                  {employeeList.map((emp) => {
                    let actualWDay = 0;
                    let totalLateMins = 0;
                    let totalOtHours = 0;
                    let daysWithOt = 0;
                    let weekendOtHours = 0;

                    return (
                      <tr key={emp.name} className="border-b border-slate-400 hover:bg-slate-50">
                        {/* Employee Name */}
                        <td className="border-r border-slate-900 px-2 py-1.5 font-semibold text-slate-950 whitespace-nowrap">
                          {emp.name}
                        </td>

                        {/* Designation */}
                        <td className="border-r border-slate-900 px-2 py-1.5 text-center text-slate-800 font-medium whitespace-nowrap">
                          {emp.designation}
                        </td>

                        {/* Attendance cells for each date in dateList */}
                        {dateList.map((d) => {
                          const record = emp.recordsByDate.get(d);
                          let cellText = '';
                          let isAbsent = false;
                          let isWeekend = ['S'].includes(getDayLetter(d));

                          if (record) {
                            if (record.status === 'Absent') {
                              cellText = 'A';
                              isAbsent = true;
                            } else {
                              actualWDay++;
                              cellText = record.timeStamp ? formatToBDTime(record.timeStamp, false) : 'P';
                              if (record.status === 'Late') {
                                totalLateMins += 15;
                              }
                              if (record.workHours && record.workHours > 8) {
                                const ot = record.workHours - 8;
                                totalOtHours += ot;
                                daysWithOt++;
                                if (isWeekend) weekendOtHours += ot;
                              }
                            }
                          } else {
                            cellText = '';
                          }

                          return (
                            <td 
                              key={d} 
                              className={`border-r border-slate-900 px-1 py-1 text-center font-mono text-[10px] font-bold ${
                                isAbsent ? 'text-rose-700 bg-rose-50' : 'text-slate-900'
                              }`}
                            >
                              {cellText}
                            </td>
                          );
                        })}

                        {/* Summary Columns */}
                        {/* Total Working Days */}
                        <td className="border-r border-slate-900 px-1.5 py-1 text-center font-mono font-bold">
                          {dateList.length}
                        </td>

                        {/* Total Present */}
                        <td className="border-r border-slate-900 px-1.5 py-1 text-center font-mono font-bold text-emerald-800">
                          {actualWDay}
                        </td>

                        {/* Absent */}
                        <td className="px-1.5 py-1 text-center font-mono font-bold text-rose-700">
                          {dateList.length - actualWDay}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Formal Signature & Attribution Footers */}
            <div 
              className="pt-8 grid grid-cols-3 gap-8 text-center text-xs text-slate-800 border-t border-slate-300"
              style={{ marginTop: '2.5rem', paddingTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '2rem', borderTop: '1px solid #cbd5e1' }}
            >
              <div>
                <div className="border-t border-slate-400 pt-1 font-bold" style={{ borderTop: '1px solid #94a3b8', paddingTop: '0.25rem', fontWeight: 'bold' }}>Prepared By</div>
                <span className="text-[10px] text-slate-500" style={{ fontSize: '10px', color: '#64748b' }}>System Operator</span>
              </div>
              <div>
                <div className="border-t border-slate-400 pt-1 font-bold" style={{ borderTop: '1px solid #94a3b8', paddingTop: '0.25rem', fontWeight: 'bold' }}>Accounts / Admin Verified</div>
                <span className="text-[10px] text-slate-500" style={{ fontSize: '10px', color: '#64748b' }}>Branch Office</span>
              </div>
              <div>
                <div className="border-t border-slate-400 pt-1 font-bold" style={{ borderTop: '1px solid #94a3b8', paddingTop: '0.25rem', fontWeight: 'bold' }}>Authorized Signatory</div>
                <span className="text-[10px] text-slate-500" style={{ fontSize: '10px', color: '#64748b' }}>{COMPANY_INFO.name}</span>
              </div>
            </div>

          </div>
        ) : (
          /* ========================================================= */
          /* ALTERNATIVE: DETAILED LIST VIEW                           */
          /* ========================================================= */
          <div className="space-y-6">
            
            {/* Header */}
            <div className="border-b-2 border-slate-900 pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                  {COMPANY_INFO.name.toUpperCase()}
                </h1>
                <p className="text-xs text-slate-700 font-medium mt-1">
                  {COMPANY_INFO.address} | Contact: {COMPANY_INFO.contact}
                </p>
              </div>

              <div className="text-left md:text-right text-xs text-slate-600 space-y-1">
                <div className="inline-block bg-slate-100 text-slate-900 font-bold px-3 py-1 rounded border border-slate-300">
                  ATTENDANCE DETAILED STATEMENT
                </div>
                <p className="font-mono text-[11px] pt-1">
                  Filter: <strong className="text-slate-900">{dateRangeText}</strong>
                </p>
                <p className="font-mono text-[10px] text-slate-500 pt-0.5">
                  Generated: <strong className="text-slate-900">{getBDCurrentTimestamp()}</strong>
                </p>
              </div>
            </div>

            {/* Summary Banner */}
            <div className="bg-slate-100 border border-slate-300 rounded-lg p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
              <div>
                <span className="text-slate-500 block uppercase font-bold text-[10px]">Total Logged</span>
                <span className="text-lg font-black text-slate-900">{totalCount}</span>
              </div>
              <div className="border-l border-slate-300">
                <span className="text-slate-500 block uppercase font-bold text-[10px]">On-Time</span>
                <span className="text-lg font-black text-emerald-700">{onTimeCount}</span>
              </div>
              <div className="border-l border-slate-300">
                <span className="text-slate-500 block uppercase font-bold text-[10px]">Late Arrivals</span>
                <span className="text-lg font-black text-rose-700">{lateCount}</span>
              </div>
              <div className="border-l border-slate-300">
                <span className="text-slate-500 block uppercase font-bold text-[10px]">Early Departure</span>
                <span className="text-lg font-black text-amber-700">{earlyOutCount}</span>
              </div>
            </div>

            {/* Detailed Table */}
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold border border-slate-900">
                  <th className="p-2.5 w-10 text-center border-r border-slate-800">SL</th>
                  <th className="p-2.5 border-r border-slate-800">Date</th>
                  <th className="p-2.5 border-r border-slate-800">Employee Name</th>
                  <th className="p-2.5 border-r border-slate-800">Designation</th>
                  <th className="p-2.5 border-r border-slate-800">Time Stamp</th>
                  <th className="p-2.5 border-r border-slate-800">Clock Out</th>
                  <th className="p-2.5 border-r border-slate-800">Status</th>
                  <th className="p-2.5">Work Hrs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 border-b border-slate-400">
                {records.map((r, idx) => (
                  <tr key={r.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="p-2 text-center font-mono font-medium text-slate-500 border-r border-slate-200">
                      {idx + 1}
                    </td>
                    <td className="p-2 font-mono font-semibold text-slate-900 border-r border-slate-200">
                      {r.date}
                    </td>
                    <td className="p-2 font-bold text-slate-950 border-r border-slate-200">
                      {r.name}
                    </td>
                    <td className="p-2 text-slate-700 border-r border-slate-200">
                      {r.designation}
                    </td>
                    <td className="p-2 font-mono font-bold text-slate-900 border-r border-slate-200">
                      {formatToBDTime(r.timeStamp, true)}
                    </td>
                    <td className="p-2 font-mono text-slate-600 border-r border-slate-200">
                      {r.clockOutTime ? formatToBDTime(r.clockOutTime, true) : '—'}
                    </td>
                    <td className="p-2 border-r border-slate-200 font-bold">
                      {r.status === 'On Time' && <span className="text-emerald-700">On Time</span>}
                      {r.status === 'Late' && <span className="text-rose-700">Late</span>}
                      {r.status === 'Early Out' && <span className="text-amber-700">Early Out</span>}
                      {r.status === 'Present' && <span className="text-slate-800">Present</span>}
                    </td>
                    <td className="p-2 font-mono text-slate-800">
                      {r.workHours || 8} hrs
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

          </div>
        )}

        {/* Developer Footer */}
        <div 
          className="mt-8 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500"
          style={{ marginTop: '2.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#64748b' }}
        >
          <p style={{ margin: 0 }}>
            <strong>System Developer:</strong> {DEVELOPER_INFO.name} ({DEVELOPER_INFO.dept}, {DEVELOPER_INFO.varsity})
          </p>
          <p style={{ margin: 0 }}>© {new Date().getFullYear()} {COMPANY_INFO.name}.</p>
        </div>

      </div>
    </div>
  );
};
