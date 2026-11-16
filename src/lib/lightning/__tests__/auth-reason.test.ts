import { readableReason } from '../auth-reason';

describe('readableReason', () => {
  it('keeps a short reason, trimmed', () => {
    expect(readableReason('  session expired  ')).toBe('session expired');
  });

  it('gives null for no reason, an empty one or only spaces', () => {
    expect(readableReason(undefined)).toBeNull();
    expect(readableReason('')).toBeNull();
    expect(readableReason('   ')).toBeNull();
  });

  it('cuts a reason longer than 150 characters, with an ellipsis', () => {
    const reason = readableReason('x'.repeat(400));
    expect(reason).toBe(`${'x'.repeat(150)}…`);
    expect(readableReason('y'.repeat(150))).toBe('y'.repeat(150));
  });
});
