// F.R.I.D.A.Y - Universal Career Copilot & Evidence-First Job Matcher
// Type Definitions conforming to PRD v1.0, v2.0, v3.0, and v4.0

export type ReviewState = 'UNREVIEWED' | 'CONFIRMED' | 'CORRECTED' | 'REJECTED';
export type GateResult = 'PASS' | 'FAIL' | 'UNKNOWN' | 'NOT_APPLICABLE';
export type GateType = 'LICENSE' | 'WORK_AUTH' | 'CLEARANCE' | 'SHIFT' | 'LOCATION' | 'EDUCATION' | 'EXPERIENCE';

export type CareerClusterId = 
  | 'software_data'
  | 'healthcare'
  | 'skilled_trades'
  | 'education_public'
  | 'finance_legal'
  | 'retail_hospitality'
  | 'creative_marketing';

export interface CareerClusterInfo {
  id: CareerClusterId;
  name: string;
  tagline: string;
  iconName: string;
  isDeepPack: boolean; // MVP: software, healthcare, trades are deep; 4 others are generic
  keyCredentials: string[];
  docArchetype: string;
}

export interface CandidateContact {
  email: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

export interface CandidateProfile {
  id: string;
  name: string;
  headline: string;
  contact: CandidateContact;
  summary: string;
  targetCluster: CareerClusterId;
  yearsOfExperience: number;
  currentRole?: string;
  licensesAndCertifications: string[];
  workAuthorization: string; // e.g. "US Citizen", "Green Card", "H1B", "Citizen / Right to Work"
  shiftPreferences?: string; // especially for healthcare & trades
  securityClearance?: string; // especially for defense / public sector
  createdAt: string;
  updatedAt: string;
}

export type FactKind = 
  | 'employment'
  | 'skill'
  | 'achievement'
  | 'education'
  | 'credential'
  | 'authorization'
  | 'availability'
  | 'metric';

export interface EvidenceFact {
  id: string;
  profileId: string;
  kind: FactKind;
  statement: string;
  rawExcerpt: string;
  reviewState: ReviewState;
  sourceLocator?: string; // "Page 1, Paragraph 2" or "Voice Intake: Q2"
  confirmedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type JobFreshness = 'CURRENT_CONFIRMED' | 'STALE_UNKNOWN' | 'CLOSED_CONFIRMED' | 'USER_CLIPPED_UNVERIFIED';

export interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  workModel: 'remote' | 'hybrid' | 'onsite';
  source: 'user_clip' | 'greenhouse' | 'lever' | 'ashby' | 'manual';
  sourceUrl?: string;
  salaryText?: string;
  rawDescription: string;
  sanitizedDescription: string;
  capturedAt: string;
  freshnessStatus: JobFreshness;
  extractedRequirements: JobRequirement[];
  integrityFlags: {
    ghostJobRisk: boolean;
    promptInjectionDetected: boolean;
    hiddenTextFound: boolean;
    unreachableUrl?: boolean;
    notes?: string[];
  };
}

export interface JobRequirement {
  id: string;
  literalText: string;
  classification: 'REQUIRED' | 'PREFERRED' | 'UNCLEAR';
  provenance: 'JD_LITERAL' | 'JD_STRUCTURAL' | 'MODEL_INFERRED';
  gateType?: GateType;
  gateResult?: GateResult;
  matchedEvidenceFactIds?: string[];
}

export interface HardGate {
  id: string;
  gateType: GateType;
  requirementText: string;
  status: GateResult;
  reason: string;
  matchedEvidence?: string;
}

export interface MatchEvaluation {
  id: string;
  profileId: string;
  postingId: string;
  algorithmVersion: string;
  taxonomyVersion: string;
  eligibility: 'PASS' | 'FAIL' | 'REVIEW';
  fitEstimate: number; // 0-100
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  subscores: {
    skills: number;       // 40%
    experience: number;   // 25%
    preferences: number;  // 20%
    evidence: number;     // 15%
  };
  hardGates: HardGate[];
  matchedSkills: string[];
  missingSkills: string[];
  gapRecommendations: {
    skill: string;
    action: string;
    freeResourceUrl?: string;
    accreditedCourseName?: string;
  }[];
  evaluatedAt: string;
}

export interface BulletPointDraft {
  id: string;
  originalFactId?: string;
  draft: string;
  reviewStatus: 'SUPPORTED' | 'REVIEW_NEEDED' | 'BLOCKED';
  justification: string;
  flaggedEntities?: string[];
}

export interface StarInterviewQuestion {
  id: string;
  question: string;
  targetSkillOrCompetency: string;
  suggestedAngle: string;
  talkingPoints: {
    situation: string;
    task: string;
    action: string;
    result: string;
    reflection: string;
  };
}

export interface TailoredDocument {
  id: string;
  profileId: string;
  postingId: string;
  jobTitle: string;
  company: string;
  tailoredHeadline: string;
  tailoredSummary: string;
  tailoredBullets: BulletPointDraft[];
  coverLetter: string;
  outreachPitch: string; // 300-char LinkedIn/Recruiter note or WhatsApp/SMS script
  interviewPrep: StarInterviewQuestion[];
  templateId: 'modern_ats' | 'clinical_cv' | 'trades_ticket' | 'usajobs_federal' | 'executive_finance' | 'creative_portfolio';
  generatedAt: string;
  isFactGatePassed: boolean;
}

export type ApplicationStage = 
  | 'SAVED'
  | 'READY'
  | 'APPLIED'
  | 'ASSESSMENT'
  | 'INTERVIEW'
  | 'OFFER'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CLOSED';

export interface ApplicationContact {
  id: string;
  name: string;
  role: string;
  emailOrUrl?: string;
}

export interface ApplicationHistoryEvent {
  id: string;
  timestamp: string;
  stage: ApplicationStage;
  note?: string;
}

export interface ApplicationRecord {
  id: string;
  postingId: string;
  profileId: string;
  jobTitle: string;
  company: string;
  location: string;
  stage: ApplicationStage;
  appliedDate?: string;
  followUpDate?: string;
  notes?: string;
  salaryOfferedOrDiscussed?: string;
  contacts: ApplicationContact[];
  resumeVersionHash?: string;
  history: ApplicationHistoryEvent[];
  updatedAt: string;
}

export type AITier = 'tier1_local' | 'tier2_byok' | 'tier3_cloud';

export interface AISettings {
  tier: AITier;
  geminiApiKey?: string;
  groqApiKey?: string;
  openRouterApiKey?: string;
  selectedGeminiModel: 'gemini-2.5-flash' | 'gemini-1.5-flash';
  creditBalance: number;
  proLicenseKey?: string;
  isProUnlocked: boolean;
}

export interface EarnFirstOrder {
  id: string;
  clientName: string;
  clientEmail: string;
  jobTitle: string;
  company: string;
  packageType: 'manual_pack_9' | 'manual_pack_19' | 'coaching_49';
  price: number;
  currency: string;
  status: 'inquiry' | 'payment_confirmed' | 'drafting' | 'reviewed' | 'delivered';
  notes?: string;
  createdAt: string;
  deliveredAt?: string;
}
