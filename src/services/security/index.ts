// F.R.I.D.A.Y - Deterministic Security Sanitizer & Anti-Fabrication Fact Gate
import type { EvidenceFact } from '../../types';

export interface SanitizationResult {
  sanitizedText: string;
  isClean: boolean;
  promptInjectionDetected: boolean;
  hiddenCharactersRemoved: number;
  ghostJobFlags: string[];
}

// Pre-Eval Security Gate (ai-job-search & career-ops benchmarks)
export function sanitizeJobDescription(rawInput: string): SanitizationResult {
  const flags: string[] = [];
  let promptInjection = false;
  let hiddenCharsCount = 0;

  // 1. Check for zero-width / invisible unicode characters often used for stealth injections
  const zeroWidthRegex = /[\u200B-\u200D\uFEFF\u00A0\u202A-\u202E]/g;
  const matches = rawInput.match(zeroWidthRegex);
  if (matches) {
    hiddenCharsCount = matches.length;
  }
  let sanitized = rawInput.replace(zeroWidthRegex, ' ');

  // 2. Scan for prompt injection patterns targeting LLMs
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

  // 3. Scan for job legitimacy red flags (Ghost jobs, wire scams, suspicious PII requests)
  const scamPatterns = [
    { regex: /\b(?:send|wire|transfer)\s+(?:money|funds|fee|crypto|bitcoin)\b/i, flag: 'Job demands upfront candidate payment/fee (high scam risk).' },
    { regex: /\b(?:purchase|buy)\s+your\s+own\s+(?:equipment|laptop|check)\b/i, flag: 'Mentions candidate purchasing equipment with reimbursement checks.' },
    { regex: /\bprovide\s+(?:ssn|social\s+security|bank\s+account|routing\s+number)\s+to\s+apply\b/i, flag: 'Suspicious request for banking details/SSN prior to formal interview.' },
    { regex: /\b(?:telegram|whatsapp)\s+interview\s+only\b/i, flag: 'Interview strictly conducted via WhatsApp/Telegram without formal company channel.' }
  ];

  for (const item of scamPatterns) {
    if (item.regex.test(sanitized)) {
      flags.push(item.flag);
    }
  }

  // 4. Sanitize unsafe HTML or script tags
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

// Deterministic Fact Gate (career-ops benchmark: "Reformulate, never fabricate")
export interface FactCheckResult {
  sentence: string;
  status: 'SUPPORTED' | 'REVIEW_NEEDED' | 'BLOCKED';
  justification: string;
  flaggedEntities: string[];
}

export function evaluateSentenceAgainstFacts(
  draftSentence: string,
  confirmedFacts: EvidenceFact[]
): FactCheckResult {
  const combinedEvidenceText = confirmedFacts
    .filter(f => f.reviewState === 'CONFIRMED' || f.reviewState === 'CORRECTED')
    .map(f => `${f.statement} ${f.rawExcerpt}`)
    .join(' ')
    .toLowerCase();

  // Extract critical numerical claims: percentages, dollar values, multipliers, large counts
  // e.g. "45%", "$1.2M", "3x", "500+", "10,000 users", "12 nurses"
  const metricRegex = /\b(\$?\d+(?:\.\d+)?(?:k|m|b|%|x|\+)?)\b/gi;
  const draftedMetrics = (draftSentence.match(metricRegex) || []).map(m => m.toLowerCase());

  // Filter out trivial numbers like years 2020-2026 if contextually common
  const criticalMetrics = draftedMetrics.filter(m => {
    const num = parseInt(m.replace(/[^0-9]/g, ''), 10);
    // Ignore stand-alone years 1990-2030 or small integers like 1, 2
    if (!isNaN(num) && num >= 1990 && num <= 2030) return false;
    if (m === '1' || m === '2') return false;
    return true;
  });

  const unsupportedEntities: string[] = [];

  for (const metric of criticalMetrics) {
    // Check if metric appears literally in candidate evidence
    if (!combinedEvidenceText.includes(metric)) {
      unsupportedEntities.push(metric);
    }
  }

  // Check for unauthorized high-risk credentials/titles: CPA, RN, PMP, Secret Clearance, MD
  const credentialRegex = /\b(cpa|rn|pmp|cfa|pe|md|bls|acls|osha-?30|cdl|secret\s+clearance)\b/gi;
  const draftedCreds = (draftSentence.match(credentialRegex) || []).map(c => c.toLowerCase());
  for (const cred of draftedCreds) {
    if (!combinedEvidenceText.includes(cred.toLowerCase())) {
      unsupportedEntities.push(cred.toUpperCase());
    }
  }

  if (unsupportedEntities.length > 0) {
    return {
      sentence: draftSentence,
      status: 'BLOCKED',
      justification: `Contains unverified metric(s) or credential(s) not found in confirmed candidate evidence: [${unsupportedEntities.join(', ')}]. Export blocked until verified or removed.`,
      flaggedEntities: unsupportedEntities
    };
  }

  // Soft check for subjective executive claims without explicit proof ("single-handedly", "spearheaded", "expert")
  const exaggeratedClaims = /\b(single-handedly|expert\s+in|world-class|undisputed)\b/i;
  if (exaggeratedClaims.test(draftSentence)) {
    return {
      sentence: draftSentence,
      status: 'REVIEW_NEEDED',
      justification: 'Contains bold or superlative assertion that may require candidate review before external submission.',
      flaggedEntities: ['Superlative claim']
    };
  }

  return {
    sentence: draftSentence,
    status: 'SUPPORTED',
    justification: 'All quantitative metrics and claims are grounded in confirmed evidence.',
    flaggedEntities: []
  };
}
