// Unit tests for Closed-Loop PDF Text-Layer Verification & USAJobs Rules
import { describe, it, expect } from 'vitest';
import { generateAtsPdf, verifyCompiledPdfTextLayer } from '../src/services/export';
import type { CandidateProfile, TailoredDocument } from '../src/types';

describe('Closed-Loop PDF Text-Layer Verifier', () => {
  const profile: CandidateProfile = {
    id: 'p-export-test',
    name: 'Taylor Swiftly',
    headline: 'Senior Clinical Specialist',
    contact: {
      email: 'taylor.clinical@example.com',
      phone: '+1 555-0199',
      location: 'Denver, CO'
    },
    summary: 'Clinical specialist with 8 years in acute trauma care.',
    targetCluster: 'healthcare',
    yearsOfExperience: 8,
    licensesAndCertifications: ['RN License', 'BLS', 'ACLS'],
    workAuthorization: 'US Citizen',
    createdAt: '',
    updatedAt: ''
  };

  const tailoredDoc: TailoredDocument = {
    id: 'td-1',
    profileId: 'p-export-test',
    postingId: 'job-1',
    jobTitle: 'Charge Nurse',
    company: 'Rocky Mountain Medical',
    tailoredHeadline: 'Taylor Swiftly | Charge Nurse Candidate',
    tailoredSummary: 'Proven nursing practitioner with 8+ years acute care experience.',
    tailoredBullets: [
      {
        id: 'b1',
        draft: 'Managed acute patient admissions and coordinated with physicians.',
        reviewStatus: 'SUPPORTED',
        justification: 'Verified in evidence'
      }
    ],
    coverLetter: 'Dear Hiring Manager...',
    outreachPitch: 'Hello from Taylor.',
    interviewPrep: [],
    templateId: 'clinical_cv',
    generatedAt: new Date().toISOString(),
    isFactGatePassed: true
  };

  it('compiles PDF and extracts literal contact email and candidate name from binary text layer', async () => {
    const doc = generateAtsPdf(profile, tailoredDoc);
    const verification = await verifyCompiledPdfTextLayer(doc, profile, tailoredDoc);

    expect(verification.candidateNameFound).toBe(true);
    expect(verification.contactTextFound).toBe(true);
    expect(verification.readingOrderValid).toBe(true);
    expect(verification.pageCount).toBe(1);
    expect(verification.passed).toBe(true);
  });

  it('enforces USAJobs federal template rules and detects missing hours-per-week or month/year dates', async () => {
    const federalDoc: TailoredDocument = {
      ...tailoredDoc,
      templateId: 'usajobs_federal'
    };

    const doc = generateAtsPdf(profile, federalDoc);
    const verification = await verifyCompiledPdfTextLayer(doc, profile, federalDoc);

    // Document is 1 page so within 2-page limit, but lacks explicit federal compliance markers (hrs/wk)
    expect(verification.isWithinPageLimits).toBe(true);
    expect(verification.federalComplianceWarnings.length).toBeGreaterThan(0);
    expect(verification.federalComplianceWarnings[0]).toContain('hours per week');
  });
});
