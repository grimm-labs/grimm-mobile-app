jest.mock('expo-crypto', () => require('@/lib/app-lock/__tests__/helpers/fake-expo-crypto'));

import { createHash } from 'crypto';

import { createPinSalt, hashPin, isValidPin, verifyPin } from '@/lib/app-lock/pin';

describe('PIN', () => {
  it('is exactly 6 digits', () => {
    expect(isValidPin('123456')).toBe(true);
    expect(isValidPin('000000')).toBe(true);
    expect(isValidPin('12345')).toBe(false);
    expect(isValidPin('1234567')).toBe(false);
    expect(isValidPin('12345a')).toBe(false);
    expect(isValidPin('')).toBe(false);
  });

  it('creates a salt of 16 random bytes, in hex', () => {
    const salt = createPinSalt();

    expect(salt).toMatch(/^[0-9a-f]{32}$/);
    expect(createPinSalt()).not.toBe(salt);
  });

  it('the hash is the hex SHA-256 of salt + PIN, and is not the PIN', async () => {
    const salt = '00112233445566778899aabbccddeeff';

    const hash = await hashPin('123456', salt);

    expect(hash).toBe(createHash('sha256').update(`${salt}123456`).digest('hex'));
    expect(hash).not.toContain('123456');
  });

  it('two salts give two hashes for the same PIN', async () => {
    expect(await hashPin('123456', createPinSalt())).not.toBe(await hashPin('123456', createPinSalt()));
  });

  it('verifies the right PIN and refuses a wrong one', async () => {
    const salt = createPinSalt();
    const hash = await hashPin('482915', salt);

    expect(await verifyPin('482915', { hash, salt })).toBe(true);
    expect(await verifyPin('482916', { hash, salt })).toBe(false);
    expect(await verifyPin('482915', { hash, salt: createPinSalt() })).toBe(false);
  });
});
