// F.R.I.D.A.Y - Multi-Domain Occupational Taxonomy & O*NET / ESCO Ontology Engine
import type { CareerClusterId, CareerClusterInfo, GateType } from '../../types';

export const CAREER_CLUSTERS: Record<CareerClusterId, CareerClusterInfo> = {
  software_data: {
    id: 'software_data',
    name: 'Software, Data & Engineering',
    tagline: 'Full-Stack, Cloud, DevOps, ML/AI, QA & Systems Engineering',
    iconName: 'Code2',
    isDeepPack: true,
    keyCredentials: ['AWS/GCP/Azure Certifications', 'PE/FE License', 'Git/GitHub Repos', 'System Design'],
    docArchetype: 'Single-Column ATS Technical Resume & Architecture Summary'
  },
  healthcare: {
    id: 'healthcare',
    name: 'Healthcare, Nursing & Allied Health',
    tagline: 'RNs, Physicians, Therapists, Pharmacists, Techs & Clinical Staff',
    iconName: 'Activity',
    isDeepPack: true,
    keyCredentials: ['Compact eNLC State License', 'BLS / ACLS / PALS', 'EMR (Epic / Cerner)', 'Patient-to-Nurse Ratio'],
    docArchetype: 'Clinical CV & Credential Matrix'
  },
  skilled_trades: {
    id: 'skilled_trades',
    name: 'Skilled Trades, Manufacturing & Logistics',
    tagline: 'Electricians, HVAC, Welders, CDL Drivers, Machinists & Warehouse Ops',
    iconName: 'Wrench',
    isDeepPack: true,
    keyCredentials: ['OSHA-10/30', 'EPA Universal 608', 'CDL Class A/B Endorsements', 'Journeyman / Union Ticket'],
    docArchetype: '1-Page Trade Ticket & Equipment Spec Sheet'
  },
  education_public: {
    id: 'education_public',
    name: 'Education, Academia & Public Sector',
    tagline: 'K-12 Teachers, University Faculty, Researchers & Civil Servants',
    iconName: 'GraduationCap',
    isDeepPack: false, // Generic pack in MVP, ships with truthful generic labeling
    keyCredentials: ['State Teaching Credential', 'Praxis / CTET', 'USAJobs KSA Compliance (Max 2 Pages)', 'Publications / Grants'],
    docArchetype: 'Federal USAJobs 2-Page Resume / Academic CV'
  },
  finance_legal: {
    id: 'finance_legal',
    name: 'Finance, Legal, Accounting & Corporate',
    tagline: 'CPAs, Financial Analysts, Paralegals, Attorneys & Operations',
    iconName: 'Briefcase',
    isDeepPack: false,
    keyCredentials: ['CPA / CFA / CA', 'State Bar Admission', 'Series 7 / 63', 'ERP (SAP / NetSuite / Workday)'],
    docArchetype: 'Executive Conservative Brief & Deal/Audit Sheet'
  },
  retail_hospitality: {
    id: 'retail_hospitality',
    name: 'Retail, Hospitality, Sales & Customer Care',
    tagline: 'Store Managers, Chefs, Food/Hotel Staff, Account Execs & Support',
    iconName: 'ShoppingBag',
    isDeepPack: false,
    keyCredentials: ['ServSafe Food Manager', 'POS Systems (Toast / Square / Shopify)', 'Shift Availability Matrix', 'Quota Attainment'],
    docArchetype: 'KPI-Driven Impact Resume & Shift Availability Badge'
  },
  creative_marketing: {
    id: 'creative_marketing',
    name: 'Creative, Media, Design & Marketing',
    tagline: 'Graphic/UI Designers, Copywriters, Video Editors & Growth Marketers',
    iconName: 'Palette',
    isDeepPack: false,
    keyCredentials: ['Portfolio URL Verification', 'Adobe Creative Cloud', 'Figma / Motion', 'ROAS / Growth Metrics'],
    docArchetype: 'Portfolio-Integrated Visual Resume & Case Study Deck'
  }
};

// Curated O*NET / ESCO Skill Aliases & Normalization
export const SKILL_NORMALIZATION_MAP: Record<string, string[]> = {
  // Software / Tech
  'react': ['reactjs', 'react.js', 'react native', 'react 18', 'react 19'],
  'typescript': ['ts', 'typescript 5', 'strict typescript'],
  'javascript': ['js', 'es6', 'ecmascript', 'modern javascript'],
  'node.js': ['nodejs', 'node', 'express', 'nest.js', 'nestjs'],
  'python': ['python3', 'py', 'django', 'fastapi', 'flask'],
  'sql': ['postgresql', 'postgres', 'mysql', 'sqlite', 'rdbms', 'sql queries'],
  'docker': ['containerization', 'containers', 'docker compose', 'dockerfile'],
  'kubernetes': ['k8s', 'helm', 'k8s clusters'],
  'aws': ['amazon web services', 's3', 'ec2', 'lambda', 'dynamodb', 'cloudwatch'],
  'git': ['github', 'gitlab', 'git version control', 'version control'],
  'ci/cd': ['github actions', 'jenkins', 'gitlab ci', 'continuous integration'],

  // Healthcare
  'bls': ['basic life support', 'aha bls', 'cpr bls'],
  'acls': ['advanced cardiovascular life support', 'aha acls'],
  'pals': ['pediatric advanced life support'],
  'rn license': ['registered nurse license', 'enlc', 'compact nursing license', 'state rn board'],
  'epic emr': ['epic systems', 'epic', 'epic charting', 'hyperspace'],
  'cerner': ['cerner millennium', 'cerner ehr'],
  'telemetry': ['telemetry monitoring', 'cardiac telemetry', 'ekg interpretation'],
  'patient assessment': ['triage', 'head to toe assessment', 'vitals monitoring'],

  // Skilled Trades
  'osha-10': ['osha 10', 'osha 10-hour', 'osha construction'],
  'osha-30': ['osha 30', 'osha 30-hour general industry'],
  'epa 608': ['epa universal', 'epa type ii', 'epa section 608', 'refrigerant handling'],
  'cdl class a': ['commercial drivers license class a', 'class a cdl', 'tractor trailer'],
  'cdl class b': ['class b cdl'],
  'hvac maintenance': ['refrigeration troubleshooting', 'air conditioning diagnostics', 'compressor replacement'],
  'plc programming': ['programmable logic controller', 'allen bradley', 'siemens s7'],
  'mig/tig welding': ['shielded metal arc', 'flux core', 'welding certification', 'aws d1.1']
};

export interface HardGateRule {
  gateType: GateType;
  regexPatterns: RegExp[];
  canonicalLabel: string;
}

export const HARD_GATE_RULES: HardGateRule[] = [
  {
    gateType: 'LICENSE',
    canonicalLabel: 'Professional Licensure / Board Certification',
    regexPatterns: [
      /\b(?:active|valid|current)\s+(?:state\s+)?(?:rn|registered\s+nurse|md|pe|cpa|bar|cdl|journeyman)\s+license\b/i,
      /\bmust\s+(?:hold|possess|have)\s+(?:an?\s+)?(?:active|valid)\s+(?:license|board\s+certification)\b/i,
      /\bcompact\s+(?:enlc|state)\s+license\s+required\b/i,
      /\bepa\s+(?:universal|608)\s+certification\s+required\b/i,
      /\b(?:cdl\s+class\s+[ab]|commercial\s+driver'?s\s+license)\s+required\b/i
    ]
  },
  {
    gateType: 'WORK_AUTH',
    canonicalLabel: 'Work Authorization / Visa Sponsorship',
    regexPatterns: [
      /\b(?:must\s+be\s+a\s+)?u\.?s\.?\s+citizen(?:ship\s+required)?\b/i,
      /\bno\s+(?:visa\s+)?sponsorship\s+(?:available|provided)\b/i,
      /\bmust\s+be\s+authorized\s+to\s+work\s+in\s+the\s+(?:united\s+states|u\.?s\.?|india|uk|canada)\b/i,
      /\bpermanent\s+resident|green\s+card\s+holder\s+only\b/i
    ]
  },
  {
    gateType: 'CLEARANCE',
    canonicalLabel: 'Government / Defense Security Clearance',
    regexPatterns: [
      /\b(?:active\s+)?(?:secret|top\s+secret|ts\/sci|public\s+trust)\s+clearance\s+required\b/i,
      /\bmust\s+be\s+able\s+to\s+obtain\s+(?:and\s+maintain\s+)?(?:a\s+)?(?:secret|security)\s+clearance\b/i
    ]
  },
  {
    gateType: 'SHIFT',
    canonicalLabel: 'Mandatory Shift / Weekend / On-Call Requirements',
    regexPatterns: [
      /\b(?:night|grave|rotating|12-hour)\s+shifts?\s+required\b/i,
      /\bmust\s+be\s+available\s+for\s+(?:weekends|holidays|on-call)\b/i
    ]
  },
  {
    gateType: 'EXPERIENCE',
    canonicalLabel: 'Mandatory Minimum Experience Threshold',
    regexPatterns: [
      /\bminimum\s+(?:of\s+)?(\d+)\+?\s+years(?:\s+of)?\s+(?:direct|relevant|clinical|professional)?\s+experience\b/i,
      /\bat\s+least\s+(\d+)\s+years(?:\s+of)?\s+experience\b/i
    ]
  }
];

// Helper to normalize and match skills
export function normalizeSkill(skill: string): string {
  const clean = skill.trim().toLowerCase();
  for (const [canonical, aliases] of Object.entries(SKILL_NORMALIZATION_MAP)) {
    if (canonical.toLowerCase() === clean || aliases.some(a => a.toLowerCase() === clean)) {
      return canonical;
    }
  }
  return skill.trim();
}
