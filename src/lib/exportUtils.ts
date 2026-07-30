import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AttendanceRecord, COMPANY_INFO, DEVELOPER_INFO } from '../types';
import { formatToBDTime, getBDCurrentTimestamp } from './dateUtils';

export function exportToPDF(
  records: AttendanceRecord[],
  reportTitle = 'ATTENDANCE SUMMARY REPORT',
  dateFilterText = 'All Records'
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Company Header
  doc.setFillColor(15, 23, 42); // Navy Dark slate
  doc.rect(0, 0, pageWidth, 32, 'F');

  // Company Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(COMPANY_INFO.name.toUpperCase(), 14, 12);

  // Tagline / Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`${COMPANY_INFO.address} | Contact: ${COMPANY_INFO.contact} | Email: ${COMPANY_INFO.email}`, 14, 20);

  // Report Banner
  doc.setFillColor(79, 70, 229); // Indigo accent line
  doc.rect(0, 31, pageWidth, 2, 'F');

  // Report Subheader
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(reportTitle, 14, 42);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Filter / Date Range: ${dateFilterText}`, 14, 48);
  doc.text(`Generated On: ${getBDCurrentTimestamp()}`, pageWidth - 14, 48, { align: 'right' });

  // Summary counts
  const totalCount = records.length;
  const uniqueEmployees = new Set(records.map(r => r.name)).size;

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, 52, pageWidth - 28, 12, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(`Total Logged Records: ${totalCount}   |   Unique Staff Count: ${uniqueEmployees}`, 20, 59.5);

  // Table Body - Simple In-Time Columns
  const tableData = records.map((r, idx) => [
    idx + 1,
    r.date,
    r.name,
    r.designation,
    formatToBDTime(r.timeStamp, true),
    r.notes || '-',
  ]);

  autoTable(doc, {
    startY: 68,
    head: [['SL', 'Date', 'Employee Name', 'Designation', 'In Time (Time Stamp)', 'Remarks']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      0: { cellWidth: 14 },
      1: { cellWidth: 30 },
      2: { cellWidth: 60 },
      3: { cellWidth: 55 },
      4: { cellWidth: 35 },
      5: { cellWidth: 'auto' },
    },
  });

  // Footer / Signatures
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.getHeight();

    // Bottom Border
    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageHeight - 18, pageWidth - 14, pageHeight - 18);

    // Signature lines
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Prepared By', 30, pageHeight - 22);
    doc.text('Checked By', pageWidth / 2, pageHeight - 22, { align: 'center' });
    doc.text('Authorized Signature', pageWidth - 30, pageHeight - 22, { align: 'right' });

    // Developer Credits Footer
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Developer: ${DEVELOPER_INFO.name} (${DEVELOPER_INFO.dept}, ${DEVELOPER_INFO.varsity})`,
      14,
      pageHeight - 8
    );
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
  }

  const fileName = `${COMPANY_INFO.name.replace(/ /g, '_')}_Report_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

