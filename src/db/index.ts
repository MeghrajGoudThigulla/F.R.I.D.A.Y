// F.R.I.D.A.Y - Client-side IndexedDB Local Vault via Dexie
// Conforming to PRD v3.0 §9 / PRD v4.0 (Encrypted settings, ciphertext-only integrity)
import Dexie, { type Table } from 'dexie';
import type {
  CandidateProfile,
  EvidenceFact,
  JobPosting,
  MatchEvaluation,
  TailoredDocument,
  ApplicationRecord,
  AISettings,
  EarnFirstOrder
} from '../types';

export class FridayDatabase extends Dexie {
  profiles!: Table<CandidateProfile, string>;
  evidenceFacts!: Table<EvidenceFact, string>;
  jobPostings!: Table<JobPosting, string>;
  matchEvaluations!: Table<MatchEvaluation, string>;
  tailoredDocuments!: Table<TailoredDocument, string>;
  applications!: Table<ApplicationRecord, string>;
  settings!: Table<AISettings, string>;
  earnFirstOrders!: Table<EarnFirstOrder, string>;

  constructor() {
    super('FridayCareerCopilotDB');
    this.version(1).stores({
      profiles: 'id, targetCluster, createdAt',
      evidenceFacts: 'id, profileId, kind, reviewState',
      jobPostings: 'id, title, company, source, freshnessStatus, capturedAt',
      matchEvaluations: 'id, profileId, postingId, eligibility, fitEstimate',
      tailoredDocuments: 'id, profileId, postingId, templateId',
      applications: 'id, postingId, profileId, stage, appliedDate, followUpDate',
      settings: 'tier',
      earnFirstOrders: 'id, clientEmail, status, packageType, createdAt'
    });
  }
}

export const db = new FridayDatabase();

// Default initial settings
export const DEFAULT_AI_SETTINGS: AISettings = {
  tier: 'tier1_local',
  selectedGeminiModel: 'gemini-2.5-flash',
  creditBalance: 0,
  isProUnlocked: false,
};

// Database helper: ensure default settings exist
export async function getOrInitSettings(): Promise<AISettings> {
  const existing = await db.settings.toCollection().first();
  if (existing) {
    return existing;
  }
  await db.settings.add(DEFAULT_AI_SETTINGS);
  return DEFAULT_AI_SETTINGS;
}

// Passphrase strength validation
export function validatePassphraseStrength(passphrase: string): { isValid: boolean; error?: string } {
  if (passphrase.length < 8) {
    return { isValid: false, error: 'Passphrase must be at least 8 characters long.' };
  }
  const hasLetter = /[a-zA-Z]/.test(passphrase);
  const hasNumber = /[0-9]/.test(passphrase);
  if (!hasLetter || !hasNumber) {
    return { isValid: false, error: 'Passphrase must contain both letters and numbers for cryptographic security.' };
  }
  return { isValid: true };
}

// AES-GCM Encrypted Backup & Restore Utilities (PRD v3.0 FR-120 / R-12)
// Protects candidate privacy: Checksum is calculated strictly over CIPHERTEXT, never plaintext!
export async function exportEncryptedBackup(passphrase: string): Promise<string> {
  const strength = validatePassphraseStrength(passphrase);
  if (!strength.isValid) {
    throw new Error(strength.error);
  }

  const allData = {
    schemaVersion: '2.0.0',
    exportedAt: new Date().toISOString(),
    profiles: await db.profiles.toArray(),
    evidenceFacts: await db.evidenceFacts.toArray(),
    jobPostings: await db.jobPostings.toArray(),
    matchEvaluations: await db.matchEvaluations.toArray(),
    tailoredDocuments: await db.tailoredDocuments.toArray(),
    applications: await db.applications.toArray(),
    earnFirstOrders: await db.earnFirstOrders.toArray(),
  };

  const jsonString = JSON.stringify(allData);
  const encoder = new TextEncoder();
  const data = encoder.encode(jsonString);

  // Derive AES-GCM 256 key via PBKDF2 with 100,000 iterations
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const key = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encryptedContent = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  // Ciphertext-only SHA-256 checksum (zero plaintext data or plaintext hashes in the envelope)
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', encryptedContent);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const ciphertextChecksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  const packageObj = {
    version: 2,
    ciphertextChecksum,
    salt: Array.from(salt),
    iv: Array.from(iv),
    ciphertext: Array.from(new Uint8Array(encryptedContent)),
  };

  return JSON.stringify(packageObj, null, 2);
}

export async function importAndRestoreBackup(backupJsonStr: string, passphrase: string): Promise<{ success: boolean; message: string }> {
  try {
    const parsed = JSON.parse(backupJsonStr);
    if (!parsed.ciphertext || !parsed.salt || !parsed.iv) {
      throw new Error('Corrupted or invalid F.R.I.D.A.Y backup file structure.');
    }

    const ciphertext = new Uint8Array(parsed.ciphertext);

    // Verify ciphertext checksum if present
    if (parsed.ciphertextChecksum) {
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', ciphertext);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const computedChecksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      if (computedChecksum !== parsed.ciphertextChecksum) {
        throw new Error('Ciphertext checksum mismatch. Backup file is corrupted.');
      }
    }

    const salt = new Uint8Array(parsed.salt);
    const iv = new Uint8Array(parsed.iv);
    const encoder = new TextEncoder();

    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(passphrase),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const key = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    const decoder = new TextDecoder();
    const data = JSON.parse(decoder.decode(decrypted));

    // Transactional restore
    await db.transaction('rw', [
      db.profiles,
      db.evidenceFacts,
      db.jobPostings,
      db.matchEvaluations,
      db.tailoredDocuments,
      db.applications,
      db.earnFirstOrders
    ], async () => {
      if (data.profiles?.length) await db.profiles.bulkPut(data.profiles);
      if (data.evidenceFacts?.length) await db.evidenceFacts.bulkPut(data.evidenceFacts);
      if (data.jobPostings?.length) await db.jobPostings.bulkPut(data.jobPostings);
      if (data.matchEvaluations?.length) await db.matchEvaluations.bulkPut(data.matchEvaluations);
      if (data.tailoredDocuments?.length) await db.tailoredDocuments.bulkPut(data.tailoredDocuments);
      if (data.applications?.length) await db.applications.bulkPut(data.applications);
      if (data.earnFirstOrders?.length) await db.earnFirstOrders.bulkPut(data.earnFirstOrders);
    });

    return { success: true, message: 'Vault restored successfully with verified ciphertext integrity.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Decryption failed. Incorrect passphrase or corrupted backup.' };
  }
}

// Complete local delete (PRD v3.0 FR-005 / R-13)
export async function clearAllLocalVault(): Promise<void> {
  await db.transaction('rw', [
    db.profiles,
    db.evidenceFacts,
    db.jobPostings,
    db.matchEvaluations,
    db.tailoredDocuments,
    db.applications,
    db.earnFirstOrders
  ], async () => {
    await db.profiles.clear();
    await db.evidenceFacts.clear();
    await db.jobPostings.clear();
    await db.matchEvaluations.clear();
    await db.tailoredDocuments.clear();
    await db.applications.clear();
    await db.earnFirstOrders.clear();
  });
}
