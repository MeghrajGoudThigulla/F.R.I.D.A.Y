// F.R.I.D.A.Y - Deterministic Security Sanitizer & Word-Boundary Anti-Fabrication Fact Gate
// Conforming to PRD v3.0 §8.4 / PRD v4.0 R-08 ("Reformulate, NEVER fabricate")
import type { EvidenceFact } from '../../types';

export interface SanitizationResult {
  sanitizedText: string;
  isClean: boolean;
  promptInjectionDetected: boolean;
  hiddenCharactersRemoved: number;
  ghostJobFlags: string[];
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 1. Pre-Eval Security Gate (ai-job-search & career-ops benchmarks)
export function sanitizeJobDescription(rawInput: string): SanitizationResult {
  const flags: string[] = [];
  let promptInjection = false;
  let hiddenCharsCount = 0;

  // Scan and strip zero-width / invisible unicode characters
  const zeroWidthRegex = /[\u200B-\u200D\uFEFF\u00A0\u202A-\u202E]/g;
  const matches = rawInput.match(zeroWidthRegex);
  if (matches) {
    hiddenCharsCount = matches.length;
  }
  let sanitized = rawInput.replace(zeroWidthRegex, ' ');

  // Scan for prompt injection patterns
  const injectionPatterns = [
    /ignore\s+(?:all\s+)?previous\s+instructions/i,
    /system\s+directive\s*:/i,
    /you\s+must\s+(?:now\s+)?rate\s+this\s+candidate\s+(?:as\s+)?(?:100%|perfect)/i,
    /override\s+(?:eval|rules|guardrails)/i,
    /bypass\s+ats\s+scoring/i,
    /\[INST\].*\[\/INST\]/i,
    /<\|im_start\|>/i
  ];

  for (const pattern of injectionPatterns) {
    if (pattern.test(sanitized)) {
      promptInjection = true;
      flags.push('Prompt injection pattern detected in job description and neutralized.');
      sanitized = sanitized.replace(pattern, '[FLAGGED UNTRUSTED INSTRUCTION REMOVED]');
    }
  }

  // Scan for job legitimacy red flags (wire scams, equipment check scams)
  const scamPatterns = [
    { regex: /\b(?:send|wire|transfer)\s+(?:money|funds|fee|crypto|bitcoin)\b/i, flag: 'Job demands upfront candidate payment/fee (scam indicator).' },
    { regex: /\b(?:purchase|buy)\s+your\s+own\s+(?:equipment|laptop|check)\b/i, flag: 'Mentions candidate purchasing equipment with reimbursement checks.' },
    { regex: /\bprovide\s+(?:ssn|social\s+security|bank\s+account|routing\s+number)\s+to\s+apply\b/i, flag: 'Suspicious request for banking details/SSN prior to formal interview.' },
    { regex: /\b(?:telegram|whatsapp)\s+interview\s+only\b/i, flag: 'Interview strictly conducted via WhatsApp/Telegram without verified corporate channel.' }
  ];

  for (const item of scamPatterns) {
    if (item.regex.test(sanitized)) {
      flags.push(item.flag);
    }
  }

  // Strip unsafe HTML / script tags
  sanitized = sanitized
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .trim();

  return {
    sanitizedText: sanitized,
    isClean: !promptInjection && flags.length === 0,
    promptInjectionDetected: promptInjection,
    hiddenCharactersRemoved: hiddenCharsCount,
    ghostJobFlags: flags
  };
}

// 2. High-Risk Professional Credentials Registry
export const HIGH_RISK_CREDENTIALS = [
  'rn',
  'registered nurse',
  'enlc',
  'bls',
  'acls',
  'pals',
  'ccrn',
  'cpa',
  'cfa',
  'pmp',
  'pe',
  'fe',
  'md',
  'bar admission',
  'osha-10',
  'osha-30',
  'epa 608',
  'cdl class a',
  'cdl class b',
  'secret clearance',
  'top secret',
  'ts/sci'
];

export interface FactCheckResult {
  sentence: string;
  status: 'SUPPORTED' | 'REVIEW_NEEDED' | 'BLOCKED';
  justification: string;
  flaggedEntities: string[];
}

// Check if a discrete metric token exists in evidence using exact boundaries
function isMetricSupportedInEvidence(metric: string, combinedEvidenceText: string): boolean {
  // Clean metric for boundary comparison
  const escaped = escapeRegex(metric);
  // Match using word boundaries or symbol boundaries so \b5\b never matches 15 or 50
  const boundaryPattern = new RegExp(`(?:^|[^0-9a-zA-Z])${escaped}(?:[^0-9a-zA-Z]|$)`, 'i');
  return boundaryPattern.test(combinedEvidenceText);
}

// Check if a credential exists in evidence using word boundaries (preventing "concern" matching "rn")
function isCredentialSupportedInEvidence(cred: string, combinedEvidenceText: string): boolean {
  const escaped = escapeRegex(cred);
  const boundaryPattern = new RegExp(`\\b${escaped}\\b`, 'i');
  return boundaryPattern.test(combinedEvidenceText);
}

// Evaluates a single sentence against confirmed facts
export function evaluateSentenceAgainstFacts(
  draftSentence: string,
  confirmedFacts: EvidenceFact[]
): FactCheckResult {
  const combinedEvidenceText = confirmedFacts
    .filter(f => f.reviewState === 'CONFIRMED' || f.reviewState === 'CORRECTED')
    .map(f => `${f.statement} ${f.rawExcerpt}`)
    .join(' ');

  // 1. Extract quantitative claims: percentages, dollar amounts, multipliers, numerical counts
  // e.g. "45%", "$1.2M", "3x", "500+", "15,000", "12"
  const metricRegex = /\b(\$?\d+(?:,\d{3})*(?:\.\d+)?(?:[kmbx%+]|\+)?)(?![0-9a-zA-Z])/gi;
  const matches = draftSentence.match(metricRegex) || [];

  const criticalMetrics = matches.filter(m => {
    const rawNumber = parseInt(m.replace(/[^0-9]/g, ''), 10);
    // Ignore common standard years 1990-2030 or single digit numbers 1 or 2
    if (!isNaN(rawNumber) && rawNumber >= 1990 && rawNumber <= 2030) return false;
    if (m === '1' || m === '2') return false;
    return true;
  });

  const unsupportedEntities: string[] = [];

  for (const metric of criticalMetrics) {
    if (!isMetricSupportedInEvidence(metric, combinedEvidenceText)) {
      unsupportedEntities.push(metric);
    }
  }

  // 2. Check for unauthorized high-risk credentials using strict word boundaries
  for (const cred of HIGH_RISK_CREDENTIALS) {
    const credRegex = new RegExp(`\\b${escapeRegex(cred)}\\b`, 'i');
    if (credRegex.test(draftSentence)) {
      // Must exist in confirmed evidence with word boundary
      if (!isCredentialSupportedInEvidence(cred, combinedEvidenceText)) {
        unsupportedEntities.push(cred.toUpperCase());
      }
    }
  }

  if (unsupportedEntities.length > 0) {
    return {
      sentence: draftSentence,
      status: 'BLOCKED',
      justification: `Contains unverified metric(s) or credential(s) not in confirmed candidate evidence: [${unsupportedEntities.join(', ')}]. Export blocked until verified or removed.`,
      flaggedEntities: unsupportedEntities
    };
  }

  // 3. Superlatives check
  const superlativeRegex = /\b(single-handedly|expert\s+in|world-class|undisputed|flawless|100%\s+active\s+standing|zero\s+safety\s+infractions)\b/i;
  if (superlativeRegex.test(draftSentence)) {
    return {
      sentence: draftSentence,
      status: 'REVIEW_NEEDED',
      justification: 'Contains superlative assertion that requires candidate review before external submission.',
      flaggedEntities: ['Superlative claim']
    };
  }

  return {
    sentence: draftSentence,
    status: 'SUPPORTED',
    justification: 'All quantitative metrics and credentials are substantiated by confirmed evidence.',
    flaggedEntities: []
  };
}

// Comprehensive Fact Gate that inspects ALL deliverable texts (PRD v3.0 §8.4)
export function evaluateFullDocumentAgainstFacts(
  doc: {
    headline: string;
    summary: string;
    bullets: { draft: string }[];
    coverLetter?: string;
    outreachPitch?: string;
    interviewTalkingPoints?: string[];
  },
  confirmedFacts: EvidenceFact[]
): {
  isFactGatePassed: boolean;
  blockedCount: number;
  reviewNeededCount: number;
  issues: string[];
} {
  const allTexts: { source: string; text: string }[] = [
    { source: 'Headline', text: doc.headline },
    { source: 'Summary', text: doc.summary },
    ...doc.bullets.map((b, i) => ({ source: `Bullet #${i + 1}`, text: b.draft })),
    ...(doc.coverLetter ? [{ source: 'Cover Letter', text: doc.coverLetter }] : []),
    ...(doc.outreachPitch ? [{ source: 'Outreach Pitch', text: doc.outreachPitch }] : []),
    ...(doc.interviewTalkingPoints ? doc.interviewTalkingPoints.map((tp, i) => ({ source: `STAR Point #${i + 1}`, text: tp })) : [])
  ];

  let blockedCount = 0;
  let reviewNeededCount = 0;
  const issues: string[] = [];

  for (const item of allTexts) {
    const result = evaluateSentenceAgainstFacts(item.text, confirmedFacts);
    if (result.status === 'BLOCKED') {
      blockedCount++;
      issues.push(`[${item.source}] ${result.justification}`);
    } else if (result.status === 'REVIEW_NEEDED') {
      reviewNeededCount++;
      issues.push(`[${item.source}] ${result.justification}`);
    }
  }

  return {
    isFactGatePassed: blockedCount === 0,
    blockedCount,
    reviewNeededCount,
    issues
  };
}
