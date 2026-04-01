import { describe, it, expect, beforeEach } from 'vitest';
import { encrypt, decrypt } from './crypto';

describe('Crypto Utility', () => {
  const testText = 'Hello, this is a secret message!';

  it('should encrypt and decrypt correctly', () => {
    const encrypted = encrypt(testText);
    expect(encrypted).not.toBe(testText);
    expect(encrypted).toContain(':');

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(testText);
  });

  it('should return null when encrypting null or undefined', () => {
    expect(encrypt(null)).toBeNull();
    expect(encrypt(undefined)).toBeNull();
  });

  it('should return the original text if decryption fails (compatibility)', () => {
    const plainText = 'not encrypted';
    const result = decrypt(plainText);
    expect(result).toBe(plainText);
  });

  it('should handle different strings', () => {
    const cases = ['123', '!@#$%^&*()', '🚀 emoji test'];
    cases.forEach(text => {
      const enc = encrypt(text);
      expect(decrypt(enc)).toBe(text);
    });
  });
});
