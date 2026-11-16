// F.R.I.D.A.Y - Closed-Loop Document Exporter & Real Text-Layer ATS Verifier
// Conforming to PRD v3.0 QA-06 & QA-07 / PRD v4.0 R-09
// Polyfill for Uint8Array.prototype.toHex in environments where it is not yet native
if (typeof Uint8Array !== 'undefined' && !(Uint8Array.prototype as any).toHex) {
  (Uint8Array.prototype as any).toHex = function () {
    return Array.from(this).map((b: any) => b.toString(16).padStart(2, '0')).join('');
  };
}

import { jsPDF } from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType
} from 'docx';
import type { CandidateProfile, TailoredDocument } from '../../types';

export interface ExportVerificationResult {
  passed: boolean;
  pageCount: number;
  isWithinPageLimits: boolean;
  contactTextFound: boolean;
  candidateNameFound: boolean;
  readingOrderValid: boolean;
  federalComplianceWarnings: string[];
  warnings: string[];
}

// 1. Generate Clean Single-Column ATS-Compliant PDF via jsPDF
export function generateAtsPdf(
  profile: CandidateProfile,
  tailoredDoc: TailoredDocument
): jsPDF {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'letter'
  });

  const margin = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxLineWidth = pageWidth - margin * 2;
  let cursorY = 50;

  // Header: Candidate Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(20, 20, 20);
  doc.text(profile.name.toUpperCase(), margin, cursorY);
  cursorY += 20;

  // Contact Information line (Single readable line for ATS parsers)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(80, 80, 80);
  const contactParts = [
    profile.contact.email,
    profile.contact.phone,
    profile.contact.location,
    profile.contact.linkedin
  ].filter(Boolean);
  const contactLine = contactParts.join('  |  ');
  doc.text(contactLine, margin, cursorY);
  cursorY += 16;

  // Target Role Headline
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(tailoredDoc.tailoredHeadline, margin, cursorY);
  cursorY += 15;

  // Horizontal divider line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.75);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 16;

  // Section 1: Executive Summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('PROFESSIONAL SUMMARY', margin, cursorY);
  cursorY += 14;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(40, 40, 40);
  const summaryLines = doc.splitTextToSize(tailoredDoc.tailoredSummary, maxLineWidth);
  doc.text(summaryLines, margin, cursorY);
  cursorY += summaryLines.length * 13 + 12;

  // Section 2: Core Qualifications & Licensure
  if (profile.licensesAndCertifications.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('LICENSES, CERTIFICATIONS & AUTHORIZATIONS', margin, cursorY);
    cursorY += 14;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(40, 40, 40);
    const certsText = `Active Credentials: ${profile.licensesAndCertifications.join('  •  ')}`;
    const certsLines = doc.splitTextToSize(certsText, maxLineWidth);
    doc.text(certsLines, margin, cursorY);
    cursorY += certsLines.length * 13 + 12;
  }

  // Section 3: Verified Impact & Targeted Deliverables
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('VERIFIED EXPERIENCE & TARGETED ACCOMPLISHMENTS', margin, cursorY);
  cursorY += 14;

  for (const bullet of tailoredDoc.tailoredBullets) {
    if (cursorY > doc.internal.pageSize.getHeight() - 60) {
      doc.addPage();
      cursorY = 50;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text('•', margin, cursorY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    const bulletLines = doc.splitTextToSize(bullet.draft, maxLineWidth - 15);
    doc.text(bulletLines, margin + 14, cursorY);
    cursorY += bulletLines.length * 13 + 8;
  }

  // Section 4: Work Authorization & Operational Parameters
  if (cursorY > doc.internal.pageSize.getHeight() - 70) {
    doc.addPage();
    cursorY = 50;
  }
  cursorY += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('WORK AUTHORIZATION & OPERATIONAL PARAMETERS', margin, cursorY);
  cursorY += 14;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(40, 40, 40);
  const authStatement = `Work Authorization: ${profile.workAuthorization || 'Authorized'} | Total Verified Experience: ${profile.yearsOfExperience} Years`;
  doc.text(authStatement, margin, cursorY);

  return doc;
}

// 2. Closed-Loop ATS Text-Layer Verifier (PRD v3.0 QA-06 & QA-07)
// Re-extracts the actual text from the compiled PDF binary and verifies literal string presence and linear order
export async function verifyCompiledPdfTextLayer(
  doc: jsPDF,
  profile: CandidateProfile,
  tailoredDoc: TailoredDocument
): Promise<ExportVerificationResult> {
  const arrayBuffer = doc.output('arraybuffer');
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdf.numPages;

  let fullExtractedText = '';
  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullExtractedText += pageText + '\n';
  }

  const warnings: string[] = [];
  const federalWarnings: string[] = [];

  // Check 1: Candidate Email in extracted text
  const contactTextFound = fullExtractedText.toLowerCase().includes(profile.contact.email.toLowerCase());
  if (!contactTextFound) {
    warnings.push(`Contact email "${profile.contact.email}" was not found in the extracted PDF text layer.`);
  }

  // Check 2: Candidate Name in extracted text
  const candidateNameFound = fullExtractedText.toLowerCase().includes(profile.name.toLowerCase());
  if (!candidateNameFound) {
    warnings.push(`Candidate name "${profile.name}" was not found in the extracted PDF text layer.`);
  }

  // Check 3: Linear Reading Order of headings
  const summaryIdx = fullExtractedText.indexOf('PROFESSIONAL SUMMARY');
  const expIdx = fullExtractedText.indexOf('VERIFIED EXPERIENCE');
  const authIdx = fullExtractedText.indexOf('WORK AUTHORIZATION');

  let readingOrderValid = true;
  if (summaryIdx !== -1 && expIdx !== -1 && summaryIdx > expIdx) {
    readingOrderValid = false;
    warnings.push('Reading order violation: Summary rendered after Experience section.');
  }
  if (expIdx !== -1 && authIdx !== -1 && expIdx > authIdx) {
    readingOrderValid = false;
    warnings.push('Reading order violation: Experience rendered after Work Authorization section.');
  }

  // Check 4: Page Count Bounds
  let isWithinLimits = true;
  if (tailoredDoc.templateId === 'usajobs_federal') {
    // Federal USAJobs rule (OPM limit: Max 2 pages)
    if (totalPages > 2) {
      isWithinLimits = false;
      federalWarnings.push(`USAJobs federal template limit exceeded: Document is ${totalPages} pages. OPM rules strictly enforce max 2 pages.`);
    }

    // Federal compliance: Check for hours per week
    const hasHoursPerWeek = /\b(?:hours\s+per\s+week|\d+\s*hrs\/wk|\d+\s*hours\/wk)\b/i.test(fullExtractedText);
    if (!hasHoursPerWeek) {
      federalWarnings.push('Federal compliance check: USAJobs resumes require specifying hours per week for past positions.');
    }

    // Federal compliance: Check for month and year formatted dates
    const hasMonthYearDates = /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b/i.test(fullExtractedText);
    if (!hasMonthYearDates) {
      federalWarnings.push('Federal compliance check: USAJobs resumes require explicit month and year for all experience dates.');
    }
  } else if (totalPages > 2) {
    warnings.push(`Document is ${totalPages} pages. Single or two-page format is recommended for standard ATS parsing.`);
  }

  const passed = contactTextFound && candidateNameFound && readingOrderValid && isWithinLimits && federalWarnings.length === 0;

  return {
    passed,
    pageCount: totalPages,
    isWithinPageLimits: isWithinLimits,
    contactTextFound,
    candidateNameFound,
    readingOrderValid,
    federalComplianceWarnings: federalWarnings,
    warnings: [...warnings, ...federalWarnings]
  };
}

// 3. Generate Editable ATS-Compliant DOCX
export async function generateAtsDocxBlob(
  profile: CandidateProfile,
  tailoredDoc: TailoredDocument
): Promise<Blob> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: profile.name.toUpperCase(),
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: [profile.contact.email, profile.contact.phone, profile.contact.location].filter(Boolean).join(' | '),
                size: 20
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: tailoredDoc.tailoredHeadline,
                bold: true,
                size: 22
              })
            ]
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            text: 'PROFESSIONAL SUMMARY',
            heading: HeadingLevel.HEADING_2
          }),
          new Paragraph({
            children: [new TextRun({ text: tailoredDoc.tailoredSummary, size: 21 })]
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            text: 'KEY CREDENTIALS & LICENSES',
            heading: HeadingLevel.HEADING_2
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: profile.licensesAndCertifications.join(' • '),
                size: 21
              })
            ]
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            text: 'VERIFIED EXPERIENCE & ACCOMPLISHMENTS',
            heading: HeadingLevel.HEADING_2
          }),
          ...tailoredDoc.tailoredBullets.map(
            bullet =>
              new Paragraph({
                bullet: { level: 0 },
                children: [new TextRun({ text: bullet.draft, size: 21 })]
              })
          )
        ]
      }
    ]
  });

  return await Packer.toBlob(doc);
}

// Helper to trigger browser download of PDF
export function downloadPdf(doc: jsPDF, filename: string): void {
  doc.save(filename);
}

// Helper to trigger browser download of Blob
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
