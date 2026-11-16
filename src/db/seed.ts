// F.R.I.D.A.Y - Sample Starter Data (Instant out-of-the-box demo)
import { db } from './index';
import type { CandidateProfile, EvidenceFact, JobPosting } from '../types';

export async function seedDemoDataIfEmpty(): Promise<void> {
  const profileCount = await db.profiles.count();
  if (profileCount > 0) return;

  const demoProfileId = 'profile-demo-001';
  const demoProfile: CandidateProfile = {
    id: demoProfileId,
    name: 'Alex Rivera',
    headline: 'Senior Full-Stack & Cloud Systems Engineer',
    contact: {
      email: 'alex.rivera.dev@example.com',
      phone: '+1 (555) 234-5678',
      location: 'Austin, TX (Remote Eligible)',
      linkedin: 'linkedin.com/in/alex-rivera-demo',
      github: 'github.com/alexrivera-demo'
    },
    summary: 'Full-stack software engineer with 6+ years of production experience designing scalable distributed microservices, TypeScript/React frontends, and cloud infrastructure on AWS and Kubernetes. Proven track record of optimizing database queries and CI/CD pipelines.',
    targetCluster: 'software_data',
    yearsOfExperience: 6,
    currentRole: 'Senior Software Engineer',
    licensesAndCertifications: ['AWS Certified Solutions Architect', 'Kubernetes CKA'],
    workAuthorization: 'US Citizen (Authorized to work for any US employer)',
    shiftPreferences: 'Standard Day Shift / Remote',
    securityClearance: 'Secret Eligible',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const demoFacts: EvidenceFact[] = [
    {
      id: 'fact-1',
      profileId: demoProfileId,
      kind: 'employment',
      statement: 'Served as Senior Software Engineer leading a 5-person platform engineering squad.',
      rawExcerpt: 'Senior Software Engineer at Horizon Cloud Labs (2022 - Present). Mentored 4 engineers and led cloud migration.',
      reviewState: 'CONFIRMED',
      sourceLocator: 'Resume Page 1, Experience Section',
      confirmedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'fact-2',
      profileId: demoProfileId,
      kind: 'achievement',
      statement: 'Architected high-throughput microservices handling 15,000 requests per second with 99.98% uptime.',
      rawExcerpt: 'Redesigned core ingestion API using Go and Node.js, achieving 15,000 req/sec and 99.98% SLA.',
      reviewState: 'CONFIRMED',
      sourceLocator: 'Resume Page 1, Bullet 2',
      confirmedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'fact-3',
      profileId: demoProfileId,
      kind: 'achievement',
      statement: 'Reduced AWS infrastructure operational spend by 35% through container right-sizing and spot instances.',
      rawExcerpt: 'Led cloud cost optimization audit reducing annual AWS compute bill by 35%.',
      reviewState: 'CONFIRMED',
      sourceLocator: 'Resume Page 1, Bullet 4',
      confirmedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'fact-4',
      profileId: demoProfileId,
      kind: 'skill',
      statement: 'Expert in TypeScript, React, Node.js, Docker, Kubernetes, PostgreSQL, and AWS.',
      rawExcerpt: 'Technical Skills: TypeScript, React, Node.js, Docker, Kubernetes, AWS, PostgreSQL, Redis, CI/CD.',
      reviewState: 'CONFIRMED',
      sourceLocator: 'Resume Page 2, Skills Section',
      confirmedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'fact-5',
      profileId: demoProfileId,
      kind: 'credential',
      statement: 'Holds active AWS Certified Solutions Architect credential.',
      rawExcerpt: 'Certifications: AWS Certified Solutions Architect - Associate (Validation: AWS-8921-2024)',
      reviewState: 'CONFIRMED',
      sourceLocator: 'Resume Page 2, Certifications Section',
      confirmedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const demoJob: JobPosting = {
    id: 'job-demo-001',
    title: 'Senior Full-Stack Engineer',
    company: 'Apex Distributed Systems',
    location: 'Remote (US)',
    workModel: 'remote',
    source: 'user_clip',
    sourceUrl: 'https://jobs.example.com/apex/senior-engineer',
    salaryText: '$140,000 - $175,000 USD',
    rawDescription: `Apex Distributed Systems is seeking a Senior Full-Stack Engineer to build reliable, high-scale cloud platforms.
Requirements:
- 5+ years of full-stack software development experience.
- Strong proficiency with TypeScript, React, and Node.js.
- Deep hands-on experience with Docker, Kubernetes, and AWS cloud environments.
- Experience with relational databases like PostgreSQL and distributed caching (Redis).
- Must be authorized to work in the United States (No visa sponsorship available).
- Excellent communication and code-review practices.`,
    sanitizedDescription: `Apex Distributed Systems is seeking a Senior Full-Stack Engineer to build reliable, high-scale cloud platforms.
Requirements:
- 5+ years of full-stack software development experience.
- Strong proficiency with TypeScript, React, and Node.js.
- Deep hands-on experience with Docker, Kubernetes, and AWS cloud environments.
- Experience with relational databases like PostgreSQL and distributed caching (Redis).
- Must be authorized to work in the United States (No visa sponsorship available).
- Excellent communication and code-review practices.`,
    capturedAt: new Date().toISOString(),
    freshnessStatus: 'CURRENT_CONFIRMED',
    extractedRequirements: [
      {
        id: 'req-1',
        literalText: '5+ years of full-stack software development experience',
        classification: 'REQUIRED',
        provenance: 'JD_LITERAL',
        gateType: 'EXPERIENCE'
      },
      {
        id: 'req-2',
        literalText: 'Must be authorized to work in the United States (No visa sponsorship available)',
        classification: 'REQUIRED',
        provenance: 'JD_LITERAL',
        gateType: 'WORK_AUTH'
      }
    ],
    integrityFlags: {
      ghostJobRisk: false,
      promptInjectionDetected: false,
      hiddenTextFound: false
    }
  };

  await db.profiles.add(demoProfile);
  await db.evidenceFacts.bulkAdd(demoFacts);
  await db.jobPostings.add(demoJob);
}
