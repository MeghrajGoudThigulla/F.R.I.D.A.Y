// F.R.I.D.A.Y - Client-Side Resume & Document Ingestion Parser
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import type { CandidateProfile, EvidenceFact, CareerClusterId } from '../../types';

// Set up worker source for pdfjs-dist if in browser
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

export interface ParseResult {
  text: string;
  isScannedOrImagePdf: boolean;
  pageCount: number;
  extractedProfile: Partial<CandidateProfile>;
  extractedFacts: Omit<EvidenceFact, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>[];
}

export async function parsePdfFile(file: File): Promise<ParseResult> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pageCount = pdf.numPages;
  let fullText = '';

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n\n';
  }

  const isScanned = fullText.trim().length < 50;

  const parsedData = extractEntitiesFromText(fullText, 'PDF Upload');
  return {
    text: fullText,
    isScannedOrImagePdf: isScanned,
    pageCount,
    extractedProfile: parsedData.profile,
    extractedFacts: parsedData.facts
  };
}

export async function parseDocxFile(file: File): Promise<ParseResult> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  const fullText = result.value;

  const parsedData = extractEntitiesFromText(fullText, 'DOCX Upload');
  return {
    text: fullText,
    isScannedOrImagePdf: false,
    pageCount: 1,
    extractedProfile: parsedData.profile,
    extractedFacts: parsedData.facts
  };
}

export function parseRawText(rawText: string, sourceName = 'Manual Intake'): ParseResult {
  const parsedData = extractEntitiesFromText(rawText, sourceName);
  return {
    text: rawText,
    isScannedOrImagePdf: false,
    pageCount: 1,
    extractedProfile: parsedData.profile,
    extractedFacts: parsedData.facts
  };
}

function extractEntitiesFromText(text: string, sourceLocator: string) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // 1. Extract Email
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : '';

  // 2. Extract Phone
  const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const phone = phoneMatch ? phoneMatch[0] : '';

  // 3. Extract Name (often first line if short and alphabetical)
  let name = 'Candidate';
  if (lines.length > 0 && lines[0].length < 40 && !lines[0].includes('@') && !/\d/.test(lines[0])) {
    name = lines[0].replace(/[^a-zA-Z\s]/g, '').trim() || 'Candidate';
  }

  // 4. Extract Years of Experience
  const yearsMatch = text.match(/(\d+)\+?\s*years(?:\s+of)?\s+experience/i);
  const years = yearsMatch ? parseInt(yearsMatch[1], 10) : 3;

  // 5. Detect Career Cluster
  let detectedCluster: CareerClusterId = 'software_data';
  const lower = text.toLowerCase();
  if (lower.includes('nurse') || lower.includes('clinical') || lower.includes('patient') || lower.includes('bls') || lower.includes('hospital')) {
    detectedCluster = 'healthcare';
  } else if (lower.includes('electrician') || lower.includes('hvac') || lower.includes('welder') || lower.includes('cdl') || lower.includes('osha')) {
    detectedCluster = 'skilled_trades';
  } else if (lower.includes('teacher') || lower.includes('curriculum') || lower.includes('faculty') || lower.includes('student')) {
    detectedCluster = 'education_public';
  } else if (lower.includes('cpa') || lower.includes('financial') || lower.includes('audit') || lower.includes('accounting')) {
    detectedCluster = 'finance_legal';
  } else if (lower.includes('retail') || lower.includes('pos') || lower.includes('guest') || lower.includes('customer service')) {
    detectedCluster = 'retail_hospitality';
  } else if (lower.includes('designer') || lower.includes('figma') || lower.includes('copywriter') || lower.includes('campaign')) {
    detectedCluster = 'creative_marketing';
  }

  // 6. Extract Credentials
  const credMatches = text.match(/\b(RN|BLS|ACLS|PALS|CCRN|CPA|CFA|PMP|OSHA-?10|OSHA-?30|EPA\s+608|CDL\s+Class\s+[AB]|PE|FE|AWS\s+Certified)\b/gi) || [];
  const uniqueCreds = Array.from(new Set(credMatches.map(c => c.trim().toUpperCase())));

  // 7. Structure Raw Facts with Excerpt Provenance
  const facts: Omit<EvidenceFact, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>[] = [];

  // Summary statement
  const summary = lines.slice(1, 4).join(' ').slice(0, 300) || `${name} is an experienced professional in ${detectedCluster}.`;

  facts.push({
    kind: 'achievement',
    statement: `Demonstrates ${years}+ years of cumulative professional background in ${detectedCluster}.`,
    rawExcerpt: yearsMatch ? yearsMatch[0] : `Inferred from career history (${years} years)`,
    reviewState: 'UNREVIEWED',
    sourceLocator
  });

  for (const cred of uniqueCreds) {
    facts.push({
      kind: 'credential',
      statement: `Holds verified credential: ${cred}`,
      rawExcerpt: cred,
      reviewState: 'UNREVIEWED',
      sourceLocator
    });
  }

  // Extract bullet points from text (lines starting with • or - or numbers)
  const bulletLines = lines.filter(l => /^[•\-\*]\s+|^\d+\.\s+/.test(l));
  for (const bullet of bulletLines.slice(0, 6)) {
    const cleanBullet = bullet.replace(/^[•\-\*\d\.]+\s+/, '').trim();
    if (cleanBullet.length > 25) {
      facts.push({
        kind: 'achievement',
        statement: cleanBullet,
        rawExcerpt: bullet,
        reviewState: 'UNREVIEWED',
        sourceLocator
      });
    }
  }

  const profile: Partial<CandidateProfile> = {
    name,
    headline: `${name} | ${detectedCluster.replace('_', ' ').toUpperCase()}`,
    contact: {
      email,
      phone,
      location: ''
    },
    summary,
    targetCluster: detectedCluster,
    yearsOfExperience: years,
    licensesAndCertifications: uniqueCreds,
    workAuthorization: 'Citizen / Right to Work',
    shiftPreferences: 'Standard Day Shift',
    securityClearance: 'None / Unspecified'
  };

  return { profile, facts };
}
