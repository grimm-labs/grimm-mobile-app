jest.mock('@breeztech/breez-sdk-spark-react-native', () => ({
  PaymentStatus: { Completed: 'completed' },
  PaymentType: { Receive: 'receive' },
}));

jest.mock('bdk-rn', () => ({
  Mnemonic: jest.fn(),
}));

jest.mock('@/api', () => ({
  supportedBitcoinCurrencies: [],
}));

jest.mock('expo-crypto', () => ({
  getRandomValues: (array: Uint32Array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 0xffffffff);
    }
    return array;
  },
}));

import { generateRandomUsername, LN_USERNAME_MIN_LENGTH, validateLnUsername } from '../utils';

const t = (key: string) => key;

describe('LN_USERNAME_MIN_LENGTH', () => {
  it('should be 2', () => {
    expect(LN_USERNAME_MIN_LENGTH).toBe(2);
  });
});

describe('generateRandomUsername', () => {
  it('returns a string matching the pattern adjective-noun-number', () => {
    const username = generateRandomUsername();
    expect(username).toMatch(/^[a-z]+-[a-z]+-\d{1,3}$/);
  });

  it('generates usernames that pass validation', () => {
    for (let i = 0; i < 20; i++) {
      const username = generateRandomUsername();
      expect(validateLnUsername(username, t)).toBeNull();
    }
  });

  it('generates different usernames across calls', () => {
    const usernames = new Set(Array.from({ length: 30 }, () => generateRandomUsername()));
    expect(usernames.size).toBeGreaterThan(1);
  });
});

describe('validateLnUsername', () => {
  it('returns null for a valid username', () => {
    expect(validateLnUsername('satoshi', t)).toBeNull();
  });

  it('returns null for a username with hyphens and numbers', () => {
    expect(validateLnUsername('my-node-42', t)).toBeNull();
  });

  it('returns null for a username at the minimum length', () => {
    expect(validateLnUsername('ab', t)).toBeNull();
  });

  it('returns null for a username at the maximum length (25)', () => {
    expect(validateLnUsername('a'.repeat(25), t)).toBeNull();
  });

  it('returns tooShort error for a single character', () => {
    expect(validateLnUsername('a', t)).toBe('lnAddressSettings.create.tooShort');
  });

  it('returns tooShort error for an empty string', () => {
    expect(validateLnUsername('', t)).toBe('lnAddressSettings.create.tooShort');
  });

  it('returns tooLong error for a username exceeding 25 characters', () => {
    expect(validateLnUsername('a'.repeat(26), t)).toBe('lnAddressSettings.create.tooLong');
  });

  it('returns invalidFormat error for uppercase letters', () => {
    expect(validateLnUsername('Satoshi', t)).toBe('lnAddressSettings.create.invalidFormat');
  });

  it('returns invalidFormat error for spaces', () => {
    expect(validateLnUsername('my name', t)).toBe('lnAddressSettings.create.invalidFormat');
  });

  it('returns invalidFormat error for special characters', () => {
    expect(validateLnUsername('user@name', t)).toBe('lnAddressSettings.create.invalidFormat');
    expect(validateLnUsername('user.name', t)).toBe('lnAddressSettings.create.invalidFormat');
    expect(validateLnUsername('user_name', t)).toBe('lnAddressSettings.create.invalidFormat');
  });

  it('prioritizes length errors over format errors', () => {
    // Single uppercase char → tooShort takes priority over invalidFormat
    expect(validateLnUsername('A', t)).toBe('lnAddressSettings.create.tooShort');
  });
});
