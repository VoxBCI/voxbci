/** Time helpers. Everything the API emits or stores is ISO-8601 UTC. */

export function nowIso(): string {
  return new Date().toISOString();
}

export function addDaysIso(days: number, from: Date = new Date()): string {
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

export function addSecondsIso(seconds: number, from: Date = new Date()): string {
  return new Date(from.getTime() + seconds * 1000).toISOString();
}

const UNIT_SECONDS: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86_400 };

/**
 * `15m` → 900. Mirrors the duration format accepted by `jose` so the token
 * lifetime and the `expiresIn` we report to clients can never drift apart.
 */
export function parseDurationSeconds(value: string): number {
  const unit = value.slice(-1);
  const amount = Number.parseInt(value.slice(0, -1), 10);
  const multiplier = UNIT_SECONDS[unit];

  if (!Number.isFinite(amount) || multiplier === undefined) {
    throw new Error(`Unsupported duration "${value}"`);
  }

  return amount * multiplier;
}
