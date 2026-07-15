jest.mock('bdk-rn', () => require('@/lib/bdk/__tests__/helpers/mock-bdk-rn'));

import { Mnemonic, WordCount } from 'bdk-rn';

import { generateMnemonic12, isValidMnemonic } from '@/lib/bdk/mnemonic';

describe('mnemonic helpers', () => {
  it('generates a 12-word mnemonic', () => {
    const phrase = generateMnemonic12();
    expect(phrase.split(' ')).toHaveLength(12);
  });

  it('validates a known 12-word phrase', () => {
    const phrase = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    expect(isValidMnemonic(phrase)).toBe(true);
  });

  it('rejects invalid phrases', () => {
    expect(isValidMnemonic('not a valid mnemonic phrase at all')).toBe(false);
  });

  it('rejects unsupported word counts', () => {
    expect(isValidMnemonic('one two three', [12])).toBe(false);
  });

  it('creates mnemonic with WordCount.Words12', () => {
    const mnemonic = new Mnemonic(WordCount.Words12);
    expect(mnemonic.toString().split(' ')).toHaveLength(12);
  });
});
