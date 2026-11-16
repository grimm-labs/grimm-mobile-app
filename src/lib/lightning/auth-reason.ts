/** The website's reason is shown inside the app's own message: never empty, never a wall of text. */
const MAX_REASON_LENGTH = 150;

/** The reason a website gives for refusing a Lightning Login, trimmed and shortened; null when it gives none. */
export function readableReason(reason: string | undefined): string | null {
  const trimmed = (reason ?? '').trim();
  if (!trimmed) return null;
  return trimmed.length > MAX_REASON_LENGTH ? `${trimmed.slice(0, MAX_REASON_LENGTH)}…` : trimmed;
}
