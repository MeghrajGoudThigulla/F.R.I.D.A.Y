// Unit tests for Vault Passphrase Strength & Ciphertext Integrity Check
import { describe, it, expect } from 'vitest';
import { validatePassphraseStrength } from '../src/db';

describe('Vault Passphrase Strength Validation', () => {
  it('rejects passphrases shorter than 8 characters', () => {
    const res = validatePassphraseStrength('Pass1');
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('at least 8 characters');
  });

  it('rejects passphrases with letters only (no numbers)', () => {
    const res = validatePassphraseStrength('PasswordOnly');
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('both letters and numbers');
  });

  it('rejects passphrases with numbers only (no letters)', () => {
    const res = validatePassphraseStrength('1234567890');
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('both letters and numbers');
  });

  it('accepts strong passphrases meeting cryptographic standards', () => {
    const res = validatePassphraseStrength('VaultKey2026!');
    expect(res.isValid).toBe(true);
  });
});
