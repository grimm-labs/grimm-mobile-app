import { Mnemonic, WordCount } from 'bdk-rn';

export function generateMnemonic12(): string {
  return new Mnemonic(WordCount.Words12).toString();
}

export function parseMnemonic(phrase: string) {
  return Mnemonic.fromString(phrase);
}

export function isValidMnemonic(mnemonic: string, allowedWordCounts: number[] = [12, 24]): boolean {
  if (!mnemonic || typeof mnemonic !== 'string') {
    return false;
  }

  const normalizedMnemonic = mnemonic.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!normalizedMnemonic) {
    return false;
  }

  const words = normalizedMnemonic.split(' ');
  if (!allowedWordCounts.includes(words.length)) {
    return false;
  }

  if (words.some((word) => !word || word.length === 0)) {
    return false;
  }

  try {
    Mnemonic.fromString(normalizedMnemonic);
    return true;
  } catch {
    return false;
  }
}
