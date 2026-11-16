// F.R.I.D.A.Y - 3-Tier AI Router & Deterministic Drafter-Reviewer Engine
// Conforming to PRD v3.0 §8 / PRD v4.0 (Zero fabricated claims, header-based API keys)
import type {
  CandidateProfile,
  EvidenceFact,
  JobPosting,
  TailoredDocument,
  BulletPointDraft,
  StarInterviewQuestion,
  AISettings
} from '../../types';
import { evaluateSentenceAgainstFacts, evaluateFullDocumentAgainstFacts } from '../security';

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

  // 1. Truthful Headline: NEVER hardcode unconfirmed titles like "Registered Clinical Specialist"
  // Uses strictly candidate's actual confirmed role or headline
  const baseTitle = profile.currentRole || profile.headline || 'Professional';
  const tailoredHeadline = `${profile.name} | ${baseTitle} — Targeting ${jobTitle} at ${company}`;

  // 2. Truthfully Formulated Summary using only confirmed candidate facts
  const candidateCreds = profile.licensesAndCertifications.length > 0
    ? `Verified background in: ${profile.licensesAndCertifications.slice(0, 3).join(', ')}.`
    : '';

  const tailoredSummary = `${profile.summary} Bringing ${profile.yearsOfExperience}+ years of verifiable experience. Targeting the ${jobTitle} position at ${company}. ${candidateCreds} Focused on operational excellence and evidence-backed execution.`;

  // 3. Evidence-Grounded Bullet Points derived strictly from confirmed facts
  const achievementFacts = confirmedFacts.filter(f => f.kind === 'achievement' || f.kind === 'employment');
  const bulletsSource = achievementFacts.length > 0 ? achievementFacts : confirmedFacts;

  const tailoredBullets: BulletPointDraft[] = bulletsSource.slice(0, 5).map((fact, index) => {
    // Reformulate fact without altering metrics or asserting new claims
    const draftText = `Delivered verified impact: ${fact.statement} (Aligned with ${jobTitle} objectives at ${company}).`;
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

  if (tailoredBullets.length === 0) {
    const fallbackText = `${profile.headline} with ${profile.yearsOfExperience} years of experience.`;
    const check = evaluateSentenceAgainstFacts(fallbackText, confirmedFacts);
    tailoredBullets.push({
      id: `bullet-fallback-${Date.now()}`,
      draft: fallbackText,
      reviewStatus: check.status,
      justification: check.justification
    });
  }

  // 4. Evidence-Linked Cover Letter
  const credentialsClause = profile.licensesAndCertifications.length > 0
    ? `including credentials in ${profile.licensesAndCertifications.join(', ')}`
    : 'in industry best practices';

  const coverLetter = `Dear Hiring Team at ${company},

I am writing to express my interest in the ${jobTitle} position. With over ${profile.yearsOfExperience} years of substantive experience in ${profile.targetCluster.replace('_', ' ')}, my background aligns with the core requirements outlined in your job posting.

Throughout my career, I have prioritized empirical outcomes, verifiable deliverables, and adherence to professional standards, ${credentialsClause}.

Key verified accomplishments:
${tailoredBullets.slice(0, 3).map(b => `• ${b.draft}`).join('\n')}

I welcome the opportunity to discuss how my qualifications support ${company}'s operational goals. Thank you for your consideration.

Sincerely,
${profile.name}
${profile.contact.email} ${profile.contact.phone ? `| ${profile.contact.phone}` : ''}`;

  // 5. Outreach Pitch / SMS script (strictly truthful)
  const isTradeOrHospitality = profile.targetCluster === 'skilled_trades' || profile.targetCluster === 'retail_hospitality';
  const credsSnippet = profile.licensesAndCertifications[0] ? `hold ${profile.licensesAndCertifications[0]}` : 'experienced background';

  const outreachPitch = isTradeOrHospitality
    ? `Hi ${company} Hiring Team! This is ${profile.name}. I saw your opening for ${jobTitle}. I have ${profile.yearsOfExperience}+ yrs exp, ${credsSnippet}, and am ready to share my verified resume!`
    : `Hi! I noticed the ${jobTitle} opening at ${company}. With ${profile.yearsOfExperience}+ years in ${profile.targetCluster.replace('_', ' ')} and ${credsSnippet}, I'd love to connect and share my work history. Best, ${profile.name}`;

  // 6. STAR Behavioral Questions derived from actual candidate history
  // (NO fake hardcoded assertions like "zero safety infractions" or "100% active standing"!)
  const firstFactStatement = confirmedFacts[0]?.statement || 'complex professional deliverables';
  const interviewPrep: StarInterviewQuestion[] = [
    {
      id: 'star-1',
      question: `Can you describe a key accomplishment from your background relevant to ${jobTitle}?`,
      targetSkillOrCompetency: 'Professional Execution & Problem Solving',
      suggestedAngle: 'Ground your answer directly in the project history confirmed in your evidence ledger.',
      talkingPoints: {
        situation: `In my role as ${profile.currentRole || 'practitioner'}, I handled core responsibilities.`,
        task: `I was responsible for: ${firstFactStatement}.`,
        action: `I applied systematic procedures and verified all work before delivery.`,
        result: `Successfully met organizational standards and delivered expected milestones.`,
        reflection: `This experience confirmed the value of empirical standards and rigorous execution.`
      }
    }
  ];

  let templateId: TailoredDocument['templateId'] = 'modern_ats';
  if (profile.targetCluster === 'healthcare') templateId = 'clinical_cv';
  else if (profile.targetCluster === 'skilled_trades') templateId = 'trades_ticket';
  else if (profile.targetCluster === 'education_public') templateId = 'usajobs_federal';
  else if (profile.targetCluster === 'finance_legal') templateId = 'executive_finance';
  else if (profile.targetCluster === 'creative_marketing') templateId = 'creative_portfolio';

  // Evaluate the ENTIRE document against the Fact Gate
  const fullDocEvaluation = evaluateFullDocumentAgainstFacts({
    headline: tailoredHeadline,
    summary: tailoredSummary,
    bullets: tailoredBullets,
    coverLetter,
    outreachPitch,
    interviewTalkingPoints: interviewPrep.flatMap(q => [
      q.talkingPoints.situation,
      q.talkingPoints.task,
      q.talkingPoints.action,
      q.talkingPoints.result
    ])
  }, confirmedFacts);

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
    isFactGatePassed: fullDocEvaluation.isFactGatePassed
  };
}

// Tier 2: BYOK Google Gemini REST API Client
// Secure key transmission via 'x-goog-api-key' Header (NEVER in URL query parameters!)
async function generateWithGeminiBYOK(
  profile: CandidateProfile,
  confirmedFacts: EvidenceFact[],
  job: JobPosting,
  settings: AISettings
): Promise<TailoredDocument> {
  const apiKey = settings.geminiApiKey?.trim();
  if (!apiKey) throw new Error('Gemini API key is required');

  const model = settings.selectedGeminiModel || 'gemini-2.5-flash';
  // Safe URL: Key is omitted from query parameter to prevent logging in history, proxies, or headers
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

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
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey // Header-based key passing prevents query string leaks
    },
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

  // Evaluate the ENTIRE document against the Fact Gate
  const fullDocEvaluation = evaluateFullDocumentAgainstFacts({
    headline: parsed.tailoredHeadline || profile.headline,
    summary: parsed.tailoredSummary || profile.summary,
    bullets: validatedBullets,
    coverLetter: parsed.coverLetter,
    outreachPitch: parsed.outreachPitch,
    interviewTalkingPoints: starQuestions.flatMap(q => [
      q.talkingPoints.situation,
      q.talkingPoints.task,
      q.talkingPoints.action,
      q.talkingPoints.result
    ])
  }, confirmedFacts);

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
    isFactGatePassed: fullDocEvaluation.isFactGatePassed
  };
}
