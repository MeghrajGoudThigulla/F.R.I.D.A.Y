// Unit tests for Hard Gate Eligibility & Word Boundary Matching
import { describe, it, expect } from 'vitest';
import { evaluateMatch } from '../src/services/matching';
import type { CandidateProfile, EvidenceFact, JobPosting } from '../src/types';

describe('Hard Gate Eligibility & Word Boundary Skill Matching', () => {
  const baseProfile: CandidateProfile = {
    id: 'p-test',
    name: 'Jordan Lee',
    headline: 'Software Developer',
    contact: { email: 'jordan@example.com' },
    summary: 'Full-stack software developer.',
    targetCluster: 'software_data',
    yearsOfExperience: 3,
    licensesAndCertifications: ['AWS Solutions Architect'],
    workAuthorization: 'US Citizen',
    securityClearance: 'None',
    createdAt: '',
    updatedAt: ''
  };

  const emptyFacts: EvidenceFact[] = [];

  it('prevents substring bug where "git" matches "digital" or "sql" matches "prerequisite"', () => {
    const jobWithNoGit: JobPosting = {
      id: 'j1',
      title: 'Digital Marketing Strategist',
      company: 'Digital Co',
      location: 'Remote',
      workModel: 'remote',
      source: 'manual',
      rawDescription: 'Requires deep digital marketing skills and understanding prerequisite tools.',
      sanitizedDescription: 'Requires deep digital marketing skills and understanding prerequisite tools.',
      capturedAt: '',
      freshnessStatus: 'CURRENT_CONFIRMED',
      extractedRequirements: [],
      integrityFlags: { ghostJobRisk: false, promptInjectionDetected: false, hiddenTextFound: false }
    };

    const evalResult = evaluateMatch(baseProfile, emptyFacts, jobWithNoGit);
    // Neither 'git' nor 'sql' should be matched as skills from "digital" or "prerequisite"
    expect(evalResult.matchedSkills).not.toContain('git');
    expect(evalResult.matchedSkills).not.toContain('sql');
  });

  it('does NOT false-pass work authorization on "non-citizen"', () => {
    const nonCitizenProfile: CandidateProfile = {
      ...baseProfile,
      workAuthorization: 'Non-citizen, requires sponsorship'
    };

    const strictAuthJob: JobPosting = {
      id: 'j-auth',
      title: 'Defense Contractor Dev',
      company: 'Gov Corp',
      location: 'DC',
      workModel: 'onsite',
      source: 'manual',
      rawDescription: 'Must be a U.S. Citizen. No visa sponsorship provided.',
      sanitizedDescription: 'Must be a U.S. Citizen. No visa sponsorship provided.',
      capturedAt: '',
      freshnessStatus: 'CURRENT_CONFIRMED',
      extractedRequirements: [],
      integrityFlags: { ghostJobRisk: false, promptInjectionDetected: false, hiddenTextFound: false }
    };

    const evalResult = evaluateMatch(nonCitizenProfile, emptyFacts, strictAuthJob);
    const authGate = evalResult.hardGates.find(g => g.gateType === 'WORK_AUTH');
    expect(authGate).toBeDefined();
    expect(authGate?.status).toBe('FAIL');
    expect(evalResult.eligibility).toBe('FAIL');
  });

  it('returns UNKNOWN (never silent pass) when candidate license is missing or unverified', () => {
    const nurseJob: JobPosting = {
      id: 'j-nurse',
      title: 'Registered Nurse (RN) - Med Surg',
      company: 'Metro Health',
      location: 'Dallas, TX',
      workModel: 'onsite',
      source: 'manual',
      rawDescription: 'Must hold an active state RN license or compact eNLC license required.',
      sanitizedDescription: 'Must hold an active state RN license or compact eNLC license required.',
      capturedAt: '',
      freshnessStatus: 'CURRENT_CONFIRMED',
      extractedRequirements: [],
      integrityFlags: { ghostJobRisk: false, promptInjectionDetected: false, hiddenTextFound: false }
    };

    // Candidate is a software developer with AWS cert, NOT an RN
    const evalResult = evaluateMatch(baseProfile, emptyFacts, nurseJob);
    const licGate = evalResult.hardGates.find(g => g.gateType === 'LICENSE');
    expect(licGate).toBeDefined();
    expect(licGate?.status).toBe('UNKNOWN');
    // Eligibility must be REVIEW or FAIL, NEVER PASS!
    expect(evalResult.eligibility).not.toBe('PASS');
  });

  it('does NOT false-pass clearance based on substring "ts"', () => {
    const clearanceJob: JobPosting = {
      id: 'j-clear',
      title: 'Systems Analyst',
      company: 'Secure Systems',
      location: 'Reston, VA',
      workModel: 'onsite',
      source: 'manual',
      rawDescription: 'Active Top Secret clearance required for federal client.',
      sanitizedDescription: 'Active Top Secret clearance required for federal client.',
      capturedAt: '',
      freshnessStatus: 'CURRENT_CONFIRMED',
      extractedRequirements: [],
      integrityFlags: { ghostJobRisk: false, promptInjectionDetected: false, hiddenTextFound: false }
    };

    // Candidate has clearance: "None"
    const evalResult = evaluateMatch(baseProfile, emptyFacts, clearanceJob);
    const clearGate = evalResult.hardGates.find(g => g.gateType === 'CLEARANCE');
    expect(clearGate).toBeDefined();
    expect(clearGate?.status).toBe('FAIL');
    expect(evalResult.eligibility).toBe('FAIL');
  });
});
