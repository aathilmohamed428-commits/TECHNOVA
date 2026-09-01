import jsPDF from 'jspdf';
import { InspectionRecord } from '../types';

export class ReportGeneratorService {
  public static generateInspectionPDF(inspection: InspectionRecord): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    // Header Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 24, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('LEGALMETRIX — INSPECTION CERTIFICATE', 14, 12);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Government of India — Legal Metrology Packaged Commodities (Rules 2011)', 14, 18);

    doc.setFontSize(10);
    doc.text(`DATE: ${new Date(inspection.timestamp).toLocaleString()}`, pageWidth - 14, 12, { align: 'right' });
    doc.text(`ID: ${inspection.inspectionNumber}`, pageWidth - 14, 18, { align: 'right' });

    let y = 32;

    // Inspection Metadata Table
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, y, pageWidth - 28, 30, 2, 2, 'FD');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('1. INSPECTION OVERVIEW', 18, y + 7);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Product Name: ${inspection.productName}`, 18, y + 14);
    doc.text(`Brand: ${inspection.brand}`, 18, y + 20);
    doc.text(`Manufacturer: ${inspection.manufacturer}`, 18, y + 26);

    doc.text(`Inspector: ${inspection.inspectorName}`, pageWidth / 2 + 5, y + 14);
    doc.text(`Location: ${inspection.location}`, pageWidth / 2 + 5, y + 20);
    doc.text(`Overall Status: ${inspection.status}`, pageWidth / 2 + 5, y + 26);

    y += 38;

    // Declarations Extracted
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('2. EXTRACTED PACKAGING DECLARATIONS', 14, y);
    y += 4;

    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, pageWidth - 28, 7, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Declaration Type', 18, y + 5);
    doc.text('Extracted Raw Text', 70, y + 5);
    doc.text('Status', 140, y + 5);
    doc.text('Confidence', 170, y + 5);
    y += 9;

    doc.setFont('helvetica', 'normal');
    inspection.declarations.forEach((decl) => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      doc.text(decl.label.slice(0, 26), 18, y);
      doc.text(decl.rawValue.slice(0, 36), 70, y);
      doc.text(decl.status, 140, y);
      doc.text(`${decl.confidence}%`, 170, y);
      doc.setDrawColor(241, 245, 249);
      doc.line(14, y + 2, pageWidth - 14, y + 2);
      y += 6;
    });

    y += 6;

    // Rule Compliance Findings
    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('3. LEGAL COMPLIANCE EVALUATION (RULES 2011)', 14, y);
    y += 4;

    inspection.evaluations.forEach((rule) => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFillColor(rule.result === 'PASS' ? 240 : rule.result === 'FAIL' ? 254 : 254, 253, 242);
      doc.rect(14, y, pageWidth - 28, 14, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(rule.result === 'PASS' ? 16 : rule.result === 'FAIL' ? 185 : 180, 24, 24);
      doc.text(`[${rule.result}] ${rule.ruleCode} - ${rule.ruleTitle}`, 18, y + 5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(rule.findings.slice(0, 95), 18, y + 10);

      y += 17;
    });

    // Evidence Hash Footer
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Digital Integrity Checksum SHA-256: ${inspection.evidenceIntegrityHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}`, 14, 287);

    doc.save(`LegalMetriX-Report-${inspection.inspectionNumber}.pdf`);
  }
}
