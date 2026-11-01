/**
 * expo-crypto backed by Node's crypto, so the PIN hash in the tests is a real SHA-256.
 * Use: jest.mock('expo-crypto', () => require('@/lib/app-lock/__tests__/helpers/fake-expo-crypto'));
 */
import { createHash, randomBytes } from 'crypto';

export enum CryptoDigestAlgorithm {
  SHA256 = 'SHA-256',
}

export enum CryptoEncoding {
  HEX = 'hex',
  BASE64 = 'base64',
}

export const getRandomBytes = jest.fn((byteCount: number) => new Uint8Array(randomBytes(byteCount)));

export const digestStringAsync = jest.fn(async (algorithm: CryptoDigestAlgorithm, data: string, options?: { encoding?: CryptoEncoding }) => {
  if (algorithm !== CryptoDigestAlgorithm.SHA256) {
    throw new Error(`Unsupported algorithm in the fake: ${algorithm}`);
  }
  return createHash('sha256')
    .update(data, 'utf8')
    .digest(options?.encoding === CryptoEncoding.BASE64 ? 'base64' : 'hex');
});
