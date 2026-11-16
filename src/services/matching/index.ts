// F.R.I.D.A.Y - 4-Pillar Matching & Hard Gate Eligibility Engine (PRD v3.0 / v4.0 compliant)
import type {
  CandidateProfile,
  EvidenceFact,
  JobPosting,
  MatchEvaluation,
  HardGate,
  GateResult
} from '../../types';
import { HARD_GATE_RULES, normalizeSkill } from '../taxonomy';

export function evaluateMatch(
  profile: CandidateProfile,
  evidenceFacts: EvidenceFact[],
  job: JobPosting
): MatchEvaluation {
  const confirmedFacts = evidenceFacts.filter(
    f => f.reviewState === 'CONFIRMED' || f.reviewState === 'CORRECTED'
  );

  const combinedCandidateEvidence = [
    profile.summary,
    profile.headline,
    profile.currentRole || '',
    profile.workAuthorization,
    profile.licensesAndCertifications.join(' '),
    profile.securityClearance || '',
    profile.shiftPreferences || '',
    ...confirmedFacts.map(f => `${f.statement} ${f.rawExcerpt}`)
  ].join(' ').toLowerCase();

  // 1. Evaluate Hard Mandatory Gates (PRD v3.0 FR-041 & PRD v4.0 R-05)
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
          const auth = (profile.workAuthorization || '').toLowerCase();
          if (auth.includes('citizen') || auth.includes('green card') || auth.includes('permanent')) {
            status = 'PASS';
            reason = `Candidate profile confirms: "${profile.workAuthorization}". Meets citizenship/authorization criteria.`;
            matchedEvidence = profile.workAuthorization;
          } else if (auth.length > 0) {
            status = 'FAIL';
            reason = `Job specifies strict work authorization requirement. Candidate profile states "${profile.workAuthorization}".`;
          } else {
            status = 'UNKNOWN';
            reason = 'Candidate work authorization is unspecified in profile. Manual review required.';
          }
        } else if (rule.gateType === 'LICENSE') {
          const hasLicenseInProfile = profile.licensesAndCertifications.some(lic => {
            const normalizedLic = lic.toLowerCase();
            return reqSnippet.toLowerCase().split(/\s+/).some(word => word.length > 2 && normalizedLic.includes(word));
          }) || combinedCandidateEvidence.includes('license') || combinedCandidateEvidence.includes('certified');

          if (hasLicenseInProfile) {
            status = 'PASS';
            reason = 'Candidate possesses matching active credential in profile.';
            matchedEvidence = profile.licensesAndCertifications.join(', ');
          } else {
            status = 'UNKNOWN';
            reason = `Job requires: "${reqSnippet}". No confirmed credential found in candidate profile.`;
          }
        } else if (rule.gateType === 'CLEARANCE') {
          const clearance = (profile.securityClearance || '').toLowerCase();
          if (clearance.includes('secret') || clearance.includes('ts') || clearance.includes('public trust')) {
            status = 'PASS';
            reason = `Candidate holds verified clearance: ${profile.securityClearance}.`;
            matchedEvidence = profile.securityClearance || '';
          } else {
            status = 'UNKNOWN';
            reason = `Job mentions: "${reqSnippet}". Candidate clearance is unverified or absent.`;
          }
        } else if (rule.gateType === 'EXPERIENCE') {
          const minYearsMatch = reqSnippet.match(/\d+/);
          const reqYears = minYearsMatch ? parseInt(minYearsMatch[0], 10) : 0;
          if (profile.yearsOfExperience >= reqYears) {
            status = 'PASS';
            reason = `Candidate has ${profile.yearsOfExperience} years of experience (meets/exceeds requirement of ${reqYears} years).`;
            matchedEvidence = `${profile.yearsOfExperience} Years`;
          } else {
            status = 'FAIL';
            reason = `Candidate has ${profile.yearsOfExperience} years vs mandatory requirement of ${reqYears} years.`;
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

  // Determine overall eligibility state
  const hasFail = hardGates.some(g => g.status === 'FAIL');
  const hasUnknown = hardGates.some(g => g.status === 'UNKNOWN');
  const eligibility = hasFail ? 'FAIL' : hasUnknown ? 'REVIEW' : 'PASS';

  // 2. Skill Extraction & Matching
  const rawJdWords = job.sanitizedDescription.toLowerCase();
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  // Common target skills based on candidate's cluster and generic taxonomy
  const candidateSkills = [
    ...profile.licensesAndCertifications,
    ...confirmedFacts.filter(f => f.kind === 'skill').map(f => f.statement)
  ].map(s => normalizeSkill(s));

  // Extract skills from JD
  const potentialSkills = [
    'react', 'typescript', 'javascript', 'node.js', 'python', 'sql', 'docker', 'kubernetes', 'aws', 'git', 'ci/cd',
    'bls', 'acls', 'pals', 'epic emr', 'cerner', 'telemetry', 'patient assessment',
    'osha-10', 'osha-30', 'epa 608', 'cdl class a', 'cdl class b', 'hvac maintenance', 'plc programming',
    'agile', 'scrum', 'rest api', 'graphql', 'microservices', 'unit testing'
  ];

  for (const skill of potentialSkills) {
    const normalized = normalizeSkill(skill);
    if (rawJdWords.includes(skill) || rawJdWords.includes(normalized)) {
      if (candidateSkills.some(cs => cs.toLowerCase() === normalized.toLowerCase()) || combinedCandidateEvidence.includes(normalized)) {
        matchedSkills.push(skill);
      } else {
        missingSkills.push(skill);
      }
    }
  }

  // Calculate 4 Subscores:
  // 1. Skill Coverage (0 - 100)
  const totalSkillsIdentified = matchedSkills.length + missingSkills.length;
  const skillCoverage = totalSkillsIdentified > 0
    ? Math.round((matchedSkills.length / totalSkillsIdentified) * 100)
    : 75; // Default if no explicit keywords found

  // 2. Experience Alignment (0 - 100)
  const experienceAlignment = Math.min(100, Math.round((profile.yearsOfExperience / 5) * 100));

  // 3. Preference Alignment (0 - 100)
  let preferenceAlignment = 85;
  if (job.workModel === 'remote') preferenceAlignment = 95;
  if (job.workModel === 'onsite' && profile.shiftPreferences?.includes('Remote Only')) preferenceAlignment = 30;

  // 4. Evidence Strength (0 - 100)
  const confirmedCount = confirmedFacts.length;
  const evidenceStrength = Math.min(100, Math.max(30, confirmedCount * 12));

  // Weighted composite fit score:
  // FitEstimate = 0.40 * SkillCoverage + 0.25 * ExperienceAlignment + 0.20 * PreferenceAlignment + 0.15 * EvidenceStrength
  const rawFitEstimate = (0.40 * skillCoverage) +
                         (0.25 * experienceAlignment) +
                         (0.20 * preferenceAlignment) +
                         (0.15 * evidenceStrength);
  const fitEstimate = Math.round(rawFitEstimate);

  // Confidence estimation
  const confidence = totalSkillsIdentified >= 4 && confirmedCount >= 3 ? 'HIGH' : totalSkillsIdentified >= 2 ? 'MEDIUM' : 'LOW';

  // Gap Bridging Recommendations (Free resources first, then accredited courses)
  const gapRecommendations = missingSkills.slice(0, 3).map(skill => {
    return {
      skill,
      action: `Review standard competency checklist and add verified experience for ${skill.toUpperCase()} to your evidence ledger.`,
      freeResourceUrl: `https://www.google.com/search?q=free+learning+resources+for+${encodeURIComponent(skill)}`,
      accreditedCourseName: `Accredited ${skill.toUpperCase()} Certificate & Practical Training`
    };
  });

  return {
    id: `eval-${job.id}-${Date.now()}`,
    profileId: profile.id,
    postingId: job.id,
    algorithmVersion: 'friday-4pillar-v1.0',
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
