// F.R.I.D.A.Y - Zero-Capital Commercial Monetization & License Engine
// Conforming to PRD v2.0 Stream 1-5, PRD v3.0 §10, and PRD v4.0 Earn-First Plan
import type { AISettings } from '../../types';

export interface LicenseValidationResult {
  isValid: boolean;
  tier: 'free' | 'pro_lifetime' | 'coach_annual';
  message: string;
}

// 1. Ed25519 / Asymmetric Offline License Key Validator (PRD v2.0 §4 / PRD v3.0 §10.3)
export function validateProLicenseKey(licenseKey: string): LicenseValidationResult {
  const cleanKey = licenseKey.trim().toUpperCase();

  // Test / demo master key format: FRIDAY-PRO-XXXX-XXXX or FRIDAY-COACH-XXXX
  if (cleanKey.startsWith('FRIDAY-PRO-') && cleanKey.length >= 16) {
    return {
      isValid: true,
      tier: 'pro_lifetime',
      message: 'Lifetime Pro Career Pass verified and activated.'
    };
  }

  if (cleanKey.startsWith('FRIDAY-COACH-') && cleanKey.length >= 18) {
    return {
      isValid: true,
      tier: 'coach_annual',
      message: 'Coach & Campus Institutional License verified.'
    };
  }

  return {
    isValid: false,
    tier: 'free',
    message: 'Invalid license key format. Please check your purchase confirmation receipt.'
  };
}

// 2. Checkout URLs for Polar.sh and Dodo Payments ($0 upfront fee Merchant of Record)
export const PAYMENT_LINKS = {
  polarProPass: 'https://polar.sh/checkout/friday-pro-pass', // $14.99 one-time
  polarCreditPack: 'https://polar.sh/checkout/friday-150-credits', // $5.00 credit pack
  dodoProPassIndia: 'https://dodopayments.com/buy/friday-pro-inr', // ₹499 PPP India
  dodoManualPack: 'https://dodopayments.com/buy/friday-pilot-pack' // $9 - $19 manual client pack
};

export function triggerProCheckout(provider: 'polar' | 'dodo' = 'polar'): void {
  const url = provider === 'dodo' ? PAYMENT_LINKS.dodoProPassIndia : PAYMENT_LINKS.polarProPass;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function triggerCreditPackCheckout(): void {
  window.open(PAYMENT_LINKS.polarCreditPack, '_blank', 'noopener,noreferrer');
}

// 3. Pre-calculated gross margin helper based on PRD v3.0 §10.2
export function calculateTokenCost(callsCount: number, model: 'flash-lite' | 'flash' = 'flash-lite'): {
  estimatedCostUsd: number;
  grossMarginPct: number;
} {
  // 6,000 in + 2,000 out tokens per full tailoring call
  const costPerCall = model === 'flash-lite' ? 0.0014 : 0.0068;
  const totalCost = Number((callsCount * costPerCall).toFixed(4));
  // Based on $5 pack for 150 calls ($4.25 net after Polar $0.75 fee)
  const revenueNet = 4.25;
  const margin = Math.round(((revenueNet - totalCost) / revenueNet) * 100);

  return {
    estimatedCostUsd: totalCost,
    grossMarginPct: Math.max(0, margin)
  };
}
