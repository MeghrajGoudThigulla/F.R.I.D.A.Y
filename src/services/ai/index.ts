// F.R.I.D.A.Y - 3-Tier AI Router & Deterministic Drafter-Reviewer Engine
import type {
  CandidateProfile,
  EvidenceFact,
  JobPosting,
  TailoredDocument,
  BulletPointDraft,
  StarInterviewQuestion,
  AISettings
} from '../../types';
import { evaluateSentenceAgainstFacts } from '../security';

export async function generateTailoredDeliverables(
  profile: CandidateProfile,
  evidenceFacts: EvidenceFact[],
  job: JobPosting,
  settings: AISettings
): Promise<TailoredDocument> {
  const confirmedFacts = evidenceFacts.filter(
    f => f.reviewState === 'CONFIRMED' || f.reviewState === 'CORRECTED'
  );

  if (settings.tier === 'tier2_byok' && settings.geminiApiKey) {
    try {
      return await generateWithGeminiBYOK(profile, confirmedFacts, job, settings);
    } catch (err) {
      console.warn('Gemini BYOK call failed, falling back to Tier 1 Deterministic engine:', err);
    }
  }

  // Fallback to Tier 1 In-Browser Deterministic Engine (100% Free, Offline, Zero Cost)
  return generateDeterministicTier1(profile, confirmedFacts, job);
}

// Tier 1: Deterministic In-Browser Engine (PRD v2.0 / v4.0 Zero-Capital)
function generateDeterministicTier1(
  profile: CandidateProfile,
  confirmedFacts: EvidenceFact[],
  job: JobPosting
): TailoredDocument {
  const jobTitle = job.title;
  const company = job.company;

  // 1. Tailored Headline
  const tailoredHeadline = `${profile.name} | ${profile.targetCluster === 'healthcare' ? 'Registered Clinical Specialist' : profile.targetCluster === 'skilled_trades' ? 'Certified Technical Specialist' : profile.currentRole || profile.headline} — Targeting ${jobTitle} at ${company}`;

  // 2. Truthfully Formulated Summary
  const tailoredSummary = `${profile.summary} Bringing ${profile.yearsOfExperience}+ years of verifiable background. Targeting the ${jobTitle} opportunity at ${company} with strong alignment in ${profile.licensesAndCertifications.slice(0, 3).join(', ') || 'core operational deliverables'}. Fully committed to quality execution and compliance.`;

  // 3. Evidence-Grounded Bullet Points
  const achievementFacts = confirmedFacts.filter(f => f.kind === 'achievement' || f.kind === 'employment');
  const bulletsSource = achievementFacts.length > 0 ? achievementFacts : confirmedFacts;

  const tailoredBullets: BulletPointDraft[] = bulletsSource.slice(0, 5).map((fact, index) => {
    // Rephrase politely into active accomplishment format without changing numbers
    const draftText = `Delivered key impact: ${fact.statement}. (Aligned with ${jobTitle} objectives at ${company}).`;
    const check = evaluateSentenceAgainstFacts(draftText, confirmedFacts);

    return {
      id: `bullet-${index}-${Date.now()}`,
      originalFactId: fact.id,
      draft: draftText,
      reviewStatus: check.status,
      justification: check.justification,
      flaggedEntities: check.flaggedEntities
    };
  });

  // If no bullets exist, add at least one from summary
  if (tailoredBullets.length === 0) {
    const fallbackText = `${profile.headline} with ${profile.yearsOfExperience} years of experience in ${profile.targetCluster}.`;
    const check = evaluateSentenceAgainstFacts(fallbackText, confirmedFacts);
    tailoredBullets.push({
      id: `bullet-fallback-${Date.now()}`,
      draft: fallbackText,
      reviewStatus: check.status,
      justification: check.justification
    });
  }

  // 4. Evidence-Linked Cover Letter
  const coverLetter = `Dear Hiring Team at ${company},

I am writing to express my strong enthusiasm for the ${jobTitle} position. With over ${profile.yearsOfExperience} years of substantive experience in ${profile.targetCluster.replace('_', ' ')}, my professional background closely mirrors the operational and technical requirements outlined in your job posting.

Throughout my career, I have prioritized empirical outcomes, verifiable results, and adherence to high industry standards. My verified background includes active credentials in ${profile.licensesAndCertifications.join(', ') || 'industry best practices'} and direct hands-on execution.

Key highlights of what I bring to ${company}:
${tailoredBullets.slice(0, 3).map(b => `• ${b.draft}`).join('\n')}

I welcome the opportunity to discuss how my qualifications directly support your team's goals for this role. Thank you for your consideration.

Sincerely,
${profile.name}
${profile.contact.email} ${profile.contact.phone ? `| ${profile.contact.phone}` : ''}`;

  // 5. High-Impact Recruiter Outreach / WhatsApp Script (PRD v2.0 Flow C)
  const isTradeOrHospitality = profile.targetCluster === 'skilled_trades' || profile.targetCluster === 'retail_hospitality';
  const outreachPitch = isTradeOrHospitality
    ? `Hi ${company} Hiring Team! This is ${profile.name}. I saw your opening for ${jobTitle}. I have ${profile.yearsOfExperience}+ yrs exp, hold valid ${profile.licensesAndCertifications[0] || 'trade credentials'}, and am available immediately. Resume ready to share!`
    : `Hi! I noticed the ${jobTitle} opening at ${company}. With ${profile.yearsOfExperience}+ years in ${profile.targetCluster.replace('_', ' ')} specializing in ${profile.licensesAndCertifications[0] || 'core execution'}, I'd love to connect and share my portfolio. Best, ${profile.name}`;

  // 6. STAR Behavioral & Technical Interview Questions
  const interviewPrep: StarInterviewQuestion[] = [
    {
      id: 'star-1',
      question: `Can you describe a situation where you had to solve a high-stakes challenge relevant to ${jobTitle}?`,
      targetSkillOrCompetency: 'Problem Solving & Operational Execution',
      suggestedAngle: 'Focus on measurable outcomes and how you mitigated risks.',
      talkingPoints: {
        situation: `In my role as ${profile.currentRole || 'practitioner'}, our team encountered complex demands.`,
        task: `I was responsible for maintaining quality while delivering on strict deadlines.`,
        action: `I implemented systematic workflows, verified all inputs, and collaborated across departments.`,
        result: `Successfully achieved operational goals with zero safety or compliance infractions.`,
        reflection: `This reinforced the importance of clear evidence and repeatable standards.`
      }
    },
    {
      id: 'star-2',
      question: `How do you stay up-to-date and maintain compliance with required standards like ${profile.licensesAndCertifications[0] || 'industry certifications'}?`,
      targetSkillOrCompetency: 'Regulatory Compliance & Continuous Improvement',
      suggestedAngle: 'Cite specific continuing education or procedural habits.',
      talkingPoints: {
        situation: `Operating in demanding professional environments with evolving requirements.`,
        task: `Ensure personal and team alignment with latest safety, clinical, or technical codes.`,
        action: `Routinely audit practices and complete certified renewal courses ahead of deadlines.`,
        result: `Maintained 100% active standing and audit readiness across all duties.`,
        reflection: `Proactive compliance saves time and prevents critical project delays.`
      }
    }
  ];

  // Determine template based on cluster
  let templateId: TailoredDocument['templateId'] = 'modern_ats';
  if (profile.targetCluster === 'healthcare') templateId = 'clinical_cv';
  else if (profile.targetCluster === 'skilled_trades') templateId = 'trades_ticket';
  else if (profile.targetCluster === 'education_public') templateId = 'usajobs_federal';
  else if (profile.targetCluster === 'finance_legal') templateId = 'executive_finance';
  else if (profile.targetCluster === 'creative_marketing') templateId = 'creative_portfolio';

  const isFactGatePassed = !tailoredBullets.some(b => b.reviewStatus === 'BLOCKED');

  return {
    id: `tailored-${job.id}-${Date.now()}`,
    profileId: profile.id,
    postingId: job.id,
    jobTitle,
    company,
    tailoredHeadline,
    tailoredSummary,
    tailoredBullets,
    coverLetter,
    outreachPitch,
    interviewPrep,
    templateId,
    generatedAt: new Date().toISOString(),
    isFactGatePassed
  };
}

// Tier 2: BYOK Google Gemini REST API Client
async function generateWithGeminiBYOK(
  profile: CandidateProfile,
  confirmedFacts: EvidenceFact[],
  job: JobPosting,
  settings: AISettings
): Promise<TailoredDocument> {
  const apiKey = settings.geminiApiKey?.trim();
  if (!apiKey) throw new Error('Gemini API key is required');

  const model = settings.selectedGeminiModel || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const prompt = `
You are F.R.I.D.A.Y, an elite career copilot and truthful resume drafter.
STRICT RULE: "Reformulate, NEVER fabricate." You must NOT invent employers, dates, metrics, numbers, or certifications not explicitly present in the candidate's confirmed evidence.

Candidate Profile:
Name: ${profile.name}
Headline: ${profile.headline}
Experience: ${profile.yearsOfExperience} years
Summary: ${profile.summary}
Credentials: ${profile.licensesAndCertifications.join(', ')}
Work Authorization: ${profile.workAuthorization}

Confirmed Candidate Facts:
${confirmedFacts.map((f, i) => `${i + 1}. [${f.kind.toUpperCase()}] ${f.statement} (Excerpt: "${f.rawExcerpt}")`).join('\n')}

Target Job Posting:
Title: ${job.title}
Company: ${job.company}
Description:
${job.sanitizedDescription.slice(0, 3000)}

Respond strictly in valid JSON matching this structure:
{
  "tailoredHeadline": "Concise high-impact headline targeting this role",
  "tailoredSummary": "2-3 sentences summary tailored to the role, using ONLY true facts",
  "tailoredBullets": [
    {
      "draft": "Active accomplishment bullet point phrased for the target role without inventing metrics",
      "originalFactIndex": 1
    }
  ],
  "coverLetter": "Tailored, professional 3-paragraph cover letter grounded in true facts",
  "outreachPitch": "300-char max recruiter pitch message or SMS script",
  "starInterviewQuestions": [
    {
      "question": "Role-specific interview question",
      "targetSkill": "Skill",
      "situation": "Situation grounded in candidate history",
      "task": "Task",
      "action": "Action",
      "result": "Result",
      "reflection": "Reflection"
    }
  ]
}
`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json'
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API Error (${response.status}): ${errorText}`);
  }

  const json = await response.json();
  const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error('Empty response received from Gemini API');

  const parsed = JSON.parse(rawText);

  // Validate bullets with Deterministic Fact Gate
  const validatedBullets: BulletPointDraft[] = (parsed.tailoredBullets || []).map((b: any, idx: number) => {
    const check = evaluateSentenceAgainstFacts(b.draft, confirmedFacts);
    return {
      id: `bullet-gemini-${idx}-${Date.now()}`,
      draft: b.draft,
      reviewStatus: check.status,
      justification: check.justification,
      flaggedEntities: check.flaggedEntities
    };
  });

  const starQuestions: StarInterviewQuestion[] = (parsed.starInterviewQuestions || []).map((sq: any, i: number) => ({
    id: `star-gemini-${i}-${Date.now()}`,
    question: sq.question,
    targetSkillOrCompetency: sq.targetSkill || 'Core Competency',
    suggestedAngle: 'Provide concrete context from your career.',
    talkingPoints: {
      situation: sq.situation || '',
      task: sq.task || '',
      action: sq.action || '',
      result: sq.result || '',
      reflection: sq.reflection || ''
    }
  }));

  let templateId: TailoredDocument['templateId'] = 'modern_ats';
  if (profile.targetCluster === 'healthcare') templateId = 'clinical_cv';
  else if (profile.targetCluster === 'skilled_trades') templateId = 'trades_ticket';
  else if (profile.targetCluster === 'education_public') templateId = 'usajobs_federal';
  else if (profile.targetCluster === 'finance_legal') templateId = 'executive_finance';
  else if (profile.targetCluster === 'creative_marketing') templateId = 'creative_portfolio';

  const isFactGatePassed = !validatedBullets.some(b => b.reviewStatus === 'BLOCKED');

  return {
    id: `tailored-gemini-${job.id}-${Date.now()}`,
    profileId: profile.id,
    postingId: job.id,
    jobTitle: job.title,
    company: job.company,
    tailoredHeadline: parsed.tailoredHeadline || profile.headline,
    tailoredSummary: parsed.tailoredSummary || profile.summary,
    tailoredBullets: validatedBullets,
    coverLetter: parsed.coverLetter || '',
    outreachPitch: parsed.outreachPitch || '',
    interviewPrep: starQuestions,
    templateId,
    generatedAt: new Date().toISOString(),
    isFactGatePassed
  };
}
