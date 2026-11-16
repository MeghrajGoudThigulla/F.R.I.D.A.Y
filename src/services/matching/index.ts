// F.R.I.D.A.Y - 4-Pillar Matching & Rigorous Hard Gate Engine
// Conforming to PRD v3.0 FR-041 / PRD v4.0 R-05 & R-06 (Hard gates NEVER false-pass)
import type {
  CandidateProfile,
  EvidenceFact,
  JobPosting,
  MatchEvaluation,
  HardGate,
  GateResult,
  GateType
} from '../../types';
import { HARD_GATE_RULES, DOMAIN_SKILL_VOCABULARIES, normalizeSkill } from '../taxonomy';

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function evaluateMatch(
  profile: CandidateProfile,
  evidenceFacts: EvidenceFact[],
  job: JobPosting
): MatchEvaluation {
  const confirmedFacts = evidenceFacts.filter(
    f => f.reviewState === 'CONFIRMED' || f.reviewState === 'CORRECTED'
  );

  const candidateEvidenceStatements = confirmedFacts.map(f => f.statement);
  const candidateCerts = (profile.licensesAndCertifications || []).map(c => c.trim().toLowerCase());

  // 1. Evaluate Hard Mandatory Gates (PRD v3.0 FR-041: Pass / Fail / Unknown / Not Applicable)
  const hardGates: HardGate[] = [];

  for (const rule of HARD_GATE_RULES) {
    for (const pattern of rule.regexPatterns) {
      const match = job.sanitizedDescription.match(pattern);
      if (match) {
        const reqSnippet = match[0];
        let status: GateResult = 'UNKNOWN';
        let reason = '';
        let matchedEvidence = '';

        if (rule.gateType === 'WORK_AUTH') {
          const auth = (profile.workAuthorization || '').trim().toLowerCase();
          
          // Check for negative indications first
          const isExplicitlyUnauthorized = /\b(non-?citizen|not\s+authorized|requires?\s+sponsorship|sponsorship\s+needed|needs\s+sponsorship|no\s+work\s+auth)\b/i.test(auth);
          const isExplicitlyAuthorized = /\b(u\.?s\.?\s+citizen(?:ship)?|permanent\s+resident|green\s+card|authorized\s+to\s+work|right\s+to\s+work)\b/i.test(auth);

          if (isExplicitlyUnauthorized) {
            status = 'FAIL';
            reason = `Job requires valid work authorization. Candidate profile states "${profile.workAuthorization}".`;
          } else if (isExplicitlyAuthorized) {
            status = 'PASS';
            reason = `Candidate profile confirms: "${profile.workAuthorization}". Meets authorization criteria.`;
            matchedEvidence = profile.workAuthorization;
          } else {
            status = 'UNKNOWN';
            reason = `Job specifies: "${reqSnippet}". Candidate work authorization is unverified or ambiguous ("${profile.workAuthorization || 'unspecified'}").`;
          }
        } else if (rule.gateType === 'CLEARANCE') {
          const candidateClearance = (profile.securityClearance || '').trim().toLowerCase();
          const reqLower = reqSnippet.toLowerCase();

          const requiresTopSecret = /\b(top\s+secret|ts\/sci)\b/i.test(reqLower);
          const requiresSecret = /\b(secret)\b/i.test(reqLower);

          const hasTopSecret = /\b(top\s+secret|ts\/sci)\b/i.test(candidateClearance);
          const hasSecret = /\b(secret|top\s+secret|ts\/sci)\b/i.test(candidateClearance);

          if (requiresTopSecret) {
            if (hasTopSecret) {
              status = 'PASS';
              reason = `Candidate holds verified Top Secret clearance: ${profile.securityClearance}.`;
              matchedEvidence = profile.securityClearance || '';
            } else if (/\b(none|no\s+clearance)\b/i.test(candidateClearance)) {
              status = 'FAIL';
              reason = `Job requires Top Secret clearance. Candidate states "${profile.securityClearance}".`;
            } else {
              status = 'UNKNOWN';
              reason = `Job requires Top Secret clearance. Candidate clearance is unconfirmed or insufficient.`;
            }
          } else if (requiresSecret) {
            if (hasSecret) {
              status = 'PASS';
              reason = `Candidate holds verified Secret clearance: ${profile.securityClearance}.`;
              matchedEvidence = profile.securityClearance || '';
            } else if (/\b(none|no\s+clearance)\b/i.test(candidateClearance)) {
              status = 'FAIL';
              reason = `Job requires Secret clearance. Candidate states "${profile.securityClearance}".`;
            } else {
              status = 'UNKNOWN';
              reason = `Job requires Secret clearance. Candidate clearance is unverified.`;
            }
          } else {
            status = 'UNKNOWN';
            reason = `Job mentions: "${reqSnippet}". Specific clearance level requires manual verification.`;
          }
        } else if (rule.gateType === 'LICENSE') {
          // Identify the exact credential required by matching known tokens with word boundaries
          const licenseTokens = [
            { token: 'rn', label: 'RN License', regex: /\b(rn|registered\s+nurse|enlc)\b/i },
            { token: 'cdl-a', label: 'CDL Class A', regex: /\b(cdl\s+class\s+a|class\s+a\s+cdl)\b/i },
            { token: 'cdl-b', label: 'CDL Class B', regex: /\b(cdl\s+class\s+b|class\s+b\s+cdl)\b/i },
            { token: 'cpa', label: 'CPA', regex: /\b(cpa|certified\s+public\s+accountant)\b/i },
            { token: 'pe', label: 'PE License', regex: /\b(pe|professional\s+engineer)\b/i },
            { token: 'epa-608', label: 'EPA 608 Universal', regex: /\b(epa\s+universal|epa\s+608)\b/i },
            { token: 'bls', label: 'BLS Certification', regex: /\b(bls|basic\s+life\s+support)\b/i },
            { token: 'acls', label: 'ACLS Certification', regex: /\b(acls|advanced\s+cardiovascular\s+life\s+support)\b/i }
          ];

          let identifiedRequiredCert: { token: string; label: string; regex: RegExp } | null = null;
          for (const lt of licenseTokens) {
            if (lt.regex.test(reqSnippet)) {
              identifiedRequiredCert = lt;
              break;
            }
          }

          if (identifiedRequiredCert) {
            // Check if candidate profile has this EXACT certificate using word boundaries
            const hasExactCert = candidateCerts.some(c => identifiedRequiredCert!.regex.test(c)) ||
              candidateEvidenceStatements.some(s => identifiedRequiredCert!.regex.test(s));

            if (hasExactCert) {
              status = 'PASS';
              reason = `Candidate possesses confirmed ${identifiedRequiredCert.label}.`;
              matchedEvidence = identifiedRequiredCert.label;
            } else {
              status = 'UNKNOWN';
              reason = `Job requires ${identifiedRequiredCert.label}. No confirmed matching credential found in profile.`;
            }
          } else {
            // Unspecified or general license requirement
            status = 'UNKNOWN';
            reason = `Job specifies license requirement: "${reqSnippet}". Manual review required.`;
          }
        } else if (rule.gateType === 'EXPERIENCE') {
          const minYearsMatch = reqSnippet.match(/\b(\d+)\+?\s*years?\b/i);
          const reqYears = minYearsMatch ? parseInt(minYearsMatch[1], 10) : 0;
          if (profile.yearsOfExperience >= reqYears && reqYears > 0) {
            status = 'PASS';
            reason = `Candidate has ${profile.yearsOfExperience} years of experience (meets/exceeds requirement of ${reqYears} years).`;
            matchedEvidence = `${profile.yearsOfExperience} Years`;
          } else if (reqYears > 0) {
            status = 'FAIL';
            reason = `Candidate has ${profile.yearsOfExperience} years vs mandatory requirement of ${reqYears} years.`;
          } else {
            status = 'UNKNOWN';
            reason = `Experience requirement phrasing is unclear: "${reqSnippet}".`;
          }
        } else {
          status = 'UNKNOWN';
          reason = `Job requires verification of: "${reqSnippet}".`;
        }

        hardGates.push({
          id: `gate-${rule.gateType}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          gateType: rule.gateType,
          requirementText: reqSnippet,
          status,
          reason,
          matchedEvidence
        });
        break; // Match first per rule category
      }
    }
  }

  // Determine overall eligibility: Fail takes precedence, then Unknown -> REVIEW, then PASS
  const hasFail = hardGates.some(g => g.status === 'FAIL');
  const hasUnknown = hardGates.some(g => g.status === 'UNKNOWN');
  const eligibility = hasFail ? 'FAIL' : hasUnknown ? 'REVIEW' : 'PASS';

  // 2. Skill Extraction with Strict Word Boundary Matching
  // Uses expanded domain skill vocabularies (fixing "git" matching "digital" and "sql" matching "prerequisite")
  const clusterVocab = DOMAIN_SKILL_VOCABULARIES[profile.targetCluster] || DOMAIN_SKILL_VOCABULARIES.software_data;
  const candidateSkillsNormalized = [
    ...profile.licensesAndCertifications,
    ...confirmedFacts.filter(f => f.kind === 'skill').map(f => f.statement)
  ].map(s => normalizeSkill(s).toLowerCase());

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const skill of clusterVocab) {
    const escapedSkill = escapeRegex(skill);
    // Strict word boundary regex: \bgit\b will never match digital
    const boundaryRegex = new RegExp(`\\b${escapedSkill}\\b`, 'i');

    if (boundaryRegex.test(job.sanitizedDescription)) {
      const isCandidatePossessed = candidateSkillsNormalized.some(cs => {
        const csEscaped = escapeRegex(cs);
        return new RegExp(`\\b${csEscaped}\\b`, 'i').test(skill) || boundaryRegex.test(cs);
      });

      if (isCandidatePossessed) {
        matchedSkills.push(skill);
      } else {
        missingSkills.push(skill);
      }
    }
  }

  // 3. Subscores Calculation (PRD v3.0 4-Pillar Model)
  const totalSkillsFound = matchedSkills.length + missingSkills.length;
  // If zero skills found in JD, coverage is 0 (NOT inflated default 75!)
  const skillCoverage = totalSkillsFound > 0
    ? Math.round((matchedSkills.length / totalSkillsFound) * 100)
    : 0;

  // Experience Alignment (0 - 100)
  const experienceAlignment = Math.min(100, Math.round((profile.yearsOfExperience / 5) * 100));

  // Preference Alignment (0 - 100)
  let preferenceAlignment = 80;
  if (job.workModel === 'remote') preferenceAlignment = 95;
  if (job.workModel === 'onsite' && profile.shiftPreferences?.toLowerCase().includes('remote only')) {
    preferenceAlignment = 20;
  }

  // Evidence Strength (0 - 100)
  const confirmedCount = confirmedFacts.length;
  const evidenceStrength = Math.min(100, confirmedCount * 15);

  // Weighted composite fit score:
  // FitEstimate = 0.40 * SkillCoverage + 0.25 * ExperienceAlignment + 0.20 * PreferenceAlignment + 0.15 * EvidenceStrength
  const rawFitEstimate = (0.40 * skillCoverage) +
                         (0.25 * experienceAlignment) +
                         (0.20 * preferenceAlignment) +
                         (0.15 * evidenceStrength);
  const fitEstimate = Math.round(rawFitEstimate);

  const confidence = totalSkillsFound >= 4 && confirmedCount >= 3 ? 'HIGH' : totalSkillsFound >= 2 ? 'MEDIUM' : 'LOW';

  // Gap Recommendations (Honest learning resources without invented "Accredited" claims)
  const gapRecommendations = missingSkills.slice(0, 3).map(skill => {
    return {
      skill,
      action: `Review standard competency checklist and add verified experience for ${skill.toUpperCase()} to your evidence ledger.`,
      freeResourceUrl: `https://www.google.com/search?q=free+learning+resources+for+${encodeURIComponent(skill)}`,
      accreditedCourseName: `Practical ${skill.toUpperCase()} skills reference guide`
    };
  });

  return {
    id: `eval-${job.id}-${Date.now()}`,
    profileId: profile.id,
    postingId: job.id,
    algorithmVersion: 'friday-4pillar-v2.0-verified',
    taxonomyVersion: 'onet-esco-2026.1',
    eligibility,
    fitEstimate,
    confidence,
    subscores: {
      skills: skillCoverage,
      experience: experienceAlignment,
      preferences: preferenceAlignment,
      evidence: evidenceStrength
    },
    hardGates,
    matchedSkills,
    missingSkills,
    gapRecommendations,
    evaluatedAt: new Date().toISOString()
  };
}
