// Unit tests for Cryptographic Licensing & Gross Margin Accounting
import { describe, it, expect } from 'vitest';
import {
  verifyLicenseKey,
  generateSignedLicenseToken,
  OFFICIAL_DEMO_PRO_LICENSE,
  calculateTokenCost
} from '../src/services/monetization';

describe('Cryptographic License Verification', () => {
  it('rejects trivial string prefix keys (e.g. FRIDAY-PRO-12345678)', async () => {
    const fakeKey = 'FRIDAY-PRO-FAKE-12345678';
    const result = await verifyLicenseKey(fakeKey);
    expect(result.isValid).toBe(false);
    expect(result.tier).toBe('free');
  });

  it('rejects tampered or forged signatures', async () => {
    // Modify one character in signature
    const tampered = OFFICIAL_DEMO_PRO_LICENSE.slice(0, -1) + 'a';
    const result = await verifyLicenseKey(tampered);
    expect(result.isValid).toBe(false);
    expect(result.tier).toBe('free');
  });

  it('verifies legitimate cryptographic demo token using Web Crypto', async () => {
    const result = await verifyLicenseKey(OFFICIAL_DEMO_PRO_LICENSE);
    expect(result.isValid).toBe(true);
    expect(result.tier).toBe('pro_lifetime');
    expect(result.payload?.sub).toBe('demo@friday.dev');
  });

  it('dynamically generates and validates new signed licenses', async () => {
    const customPayload = {
      sub: 'nurse.sarah@hospital.org',
      tier: 'pro_lifetime' as const,
      issuedAt: new Date().toISOString(),
      features: ['clinical_cv', 'multi_persona']
    };

    const token = await generateSignedLicenseToken(customPayload);
    const result = await verifyLicenseKey(token);
    expect(result.isValid).toBe(true);
    expect(result.tier).toBe('pro_lifetime');
    expect(result.payload?.sub).toBe('nurse.sarah@hospital.org');
  });

  it('calculates token gross margin according to PRD v3.0 §10.2', () => {
    const marginData = calculateTokenCost(150, 'flash-lite');
    // 150 calls on flash-lite costs ~$0.21, net revenue on $5 pack is $4.25 -> ~95% gross margin
    expect(marginData.estimatedCostUsd).toBeCloseTo(0.21, 2);
    expect(marginData.grossMarginPct).toBeGreaterThan(90);
  });
});
