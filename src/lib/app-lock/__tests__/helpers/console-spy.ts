/**
 * Secrets stay out of logs: spy on console.* during an App Lock suite, then assert that no call contains a PIN or the
 * Recovery Phrase. The console keeps printing, so a failing test still shows its logs.
 */
const METHODS = ['log', 'info', 'warn', 'error', 'debug'] as const;

export function spyOnConsole() {
  const spies = METHODS.map((method) => jest.spyOn(console, method));

  return {
    /** Fails if any console call (any argument, serialised) contains one of the secrets. */
    expectNoSecretLogged(secrets: string[]) {
      const calls = spies.flatMap((spy) => spy.mock.calls);
      for (const args of calls) {
        const text = args.map((arg) => (arg instanceof Error ? `${arg.message} ${arg.stack}` : typeof arg === 'string' ? arg : safeStringify(arg))).join(' ');
        for (const secret of secrets) {
          expect(text).not.toContain(secret);
        }
      }
    },
    restore() {
      spies.forEach((spy) => spy.mockRestore());
    },
  };
}

function safeStringify(value: unknown) {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}
