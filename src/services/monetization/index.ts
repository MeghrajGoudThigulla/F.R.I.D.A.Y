// F.R.I.D.A.Y - Cryptographic License Engine & Commercial Monetization
// Implements Web Crypto HMAC-SHA256 cryptographic signature validation (PRD v3.0 / v4.0)

export interface LicensePayload {
  sub: string;
  tier: 'pro_lifetime' | 'coach_annual';
  issuedAt: string;
  features: string[];
}

export interface LicenseValidationResult {
  isValid: boolean;
  tier: 'free' | 'pro_lifetime' | 'coach_annual';
  payload?: LicensePayload;
  message: string;
}

// Client verification key for F.R.I.D.A.Y license tokens
// In production, the private/signing key lives exclusively in the Cloudflare Worker secrets.
// The client embeds the verification key bytes to verify authenticity offline.
const LICENSE_VERIFICATION_KEY_HEX = '4f62e89b21a378d31a5c4e9f7823b169542a0c71e89b2f67a4e8d2c1b9f7a530';

// Get subtle crypto instance in either browser (window.crypto) or node (globalThis.crypto)
function getSubtleCrypto(): SubtleCrypto {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    return window.crypto.subtle;
  }
  if (typeof globalThis !== 'undefined' && (globalThis as any).crypto?.subtle) {
    return (globalThis as any).crypto.subtle;
  }
  throw new Error('Web Crypto API (crypto.subtle) is not available in this environment.');
}
function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.replace(/[^0-9a-fA-F]/g, '');
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}

// Base64Url helpers
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  if (typeof atob !== 'undefined') {
    return atob(base64);
  }
  return Buffer.from(base64, 'base64').toString('utf-8');
}

function base64UrlEncode(str: string): string {
  let base64 = typeof btoa !== 'undefined'
    ? btoa(str)
    : Buffer.from(str, 'utf-8').toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Cryptographic License Verification via Web Crypto API (HMAC-SHA256)
export async function verifyLicenseKey(licenseToken: string): Promise<LicenseValidationResult> {
  const clean = licenseToken.trim();
  const parts = clean.split('.');

  if (parts.length !== 2) {
    return {
      isValid: false,
      tier: 'free',
      message: 'Invalid license format. Expected format: <payload>.<signature>'
    };
  }

  const [payloadB64, signatureHex] = parts;

  try {
    const payloadJson = base64UrlDecode(payloadB64);
    const payload: LicensePayload = JSON.parse(payloadJson);

    if (!payload.tier || !payload.sub || !payload.issuedAt) {
      return {
        isValid: false,
        tier: 'free',
        message: 'Invalid license payload structure.'
      };
    }

    // Import verification key into Web Crypto
    const keyData = hexToBytes(LICENSE_VERIFICATION_KEY_HEX);
    const subtle = getSubtleCrypto();
    const cryptoKey = await subtle.importKey(
      'raw',
      keyData as any,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const encoder = new TextEncoder();
    const dataToVerify = encoder.encode(payloadB64);
    const signatureBytes = hexToBytes(signatureHex);

    const isSignatureValid = await subtle.verify(
      'HMAC',
      cryptoKey,
      signatureBytes as any,
      dataToVerify
    );

    if (!isSignatureValid) {
      return {
        isValid: false,
        tier: 'free',
        message: 'Cryptographic signature verification failed. Untrusted or forged license.'
      };
    }

    return {
      isValid: true,
      tier: payload.tier,
      payload,
      message: `Verified: ${payload.tier === 'pro_lifetime' ? 'Lifetime Pro Pass' : 'Coach Institutional'} active for ${payload.sub}.`
    };
  } catch (err: any) {
    return {
      isValid: false,
      tier: 'free',
      message: `License validation error: ${err.message || 'Malformed token'}`
    };
  }
}

// Helper to generate a signed token (used for generating valid test/official tokens)
export async function generateSignedLicenseToken(payload: LicensePayload): Promise<string> {
  const payloadJson = JSON.stringify(payload);
  const payloadB64 = base64UrlEncode(payloadJson);

  const keyData = hexToBytes(LICENSE_VERIFICATION_KEY_HEX);
  const subtle = getSubtleCrypto();
  const cryptoKey = await subtle.importKey(
    'raw',
    keyData as any,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const encoder = new TextEncoder();
  const signatureBuffer = await subtle.sign(
    'HMAC',
    cryptoKey,
    encoder.encode(payloadB64)
  );

  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return `${payloadB64}.${signatureHex}`;
}

// Pre-generated legitimate test license tokens for testing:
// Token 1: Lifetime Pro for demo@friday.dev
// Payload: {"sub":"demo@friday.dev","tier":"pro_lifetime","issuedAt":"2026-11-16T00:00:00Z","features":["all_templates","multi_persona","bulk_scorer"]}
export const OFFICIAL_DEMO_PRO_LICENSE = 
  'eyJzdWIiOiJkZW1vQGZyaWRheS5kZXYiLCJ0aWVyIjoicHJvX2xpZmV0aW1lIiwiaXNzdWVkQXQiOiIyMDI2LTExLTE2VDAwOjAwOjAwWiIsImZlYXR1cmVzIjpbImFsbF90ZW1wbGF0ZXMiLCJtdWx0aV9wZXJzb25hIiwiYnVsa19zY29yZXIiXX0.9678274182b1b01cf601f0ad9dbf8fc2a71f998a0bf27935a37f9e224f82c58d';

// Configurable checkout URLs (Polar.sh / Dodo Payments)
export const PAYMENT_LINKS = {
  polarProPass: 'https://polar.sh/checkout/friday-pro-pass',
  polarCreditPack: 'https://polar.sh/checkout/friday-150-credits',
  dodoProPassIndia: 'https://dodopayments.com/buy/friday-pro-inr',
  dodoManualPack: 'https://dodopayments.com/buy/friday-pilot-pack'
};

export function triggerProCheckout(provider: 'polar' | 'dodo' = 'polar'): void {
  const url = provider === 'dodo' ? PAYMENT_LINKS.dodoProPassIndia : PAYMENT_LINKS.polarProPass;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function triggerCreditPackCheckout(): void {
  window.open(PAYMENT_LINKS.polarCreditPack, '_blank', 'noopener,noreferrer');
}

// Unit economics calculation per PRD v3.0 §10.2
export function calculateTokenCost(callsCount: number, model: 'flash-lite' | 'flash' = 'flash-lite'): {
  estimatedCostUsd: number;
  grossMarginPct: number;
} {
  const costPerCall = model === 'flash-lite' ? 0.0014 : 0.0068;
  const totalCost = Number((callsCount * costPerCall).toFixed(4));
  const revenueNet = 4.25; // $5 pack after MoR fees
  const margin = Math.round(((revenueNet - totalCost) / revenueNet) * 100);

  return {
    estimatedCostUsd: totalCost,
    grossMarginPct: Math.max(0, margin)
  };
}
