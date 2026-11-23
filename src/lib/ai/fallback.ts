/**
 * Runs the preferred AI provider first and the built-in provider only when the
 * preferred one is not configured or fails before producing a result.
 */
export async function withFallback<T>(
  primary: (() => Promise<T>) | null,
  fallback: () => Promise<T>,
  onPrimaryError?: (error: unknown) => void,
): Promise<{ value: T; usedPrimary: boolean }> {
  if (primary) {
    try {
      return { value: await primary(), usedPrimary: true };
    } catch (error) {
      onPrimaryError?.(error);
    }
  }
  return { value: await fallback(), usedPrimary: false };
}

/** How long a key whose balance ran out is skipped before it is tried again. */
export const KEY_COOLDOWN_MS = 10 * 60_000;
/** Total time spent trying AI STAR keys before handing over to the built-in AI. */
export const STAR_BUDGET_MS = 45_000;

function errorStatus(error: unknown): number | undefined {
  const e = error as { statusCode?: number; status?: number } | null;
  return e?.statusCode ?? e?.status;
}

/** Errors that mean this key itself is unusable (tokens exhausted, revoked, blocked). */
export function isKeyLimitError(error: unknown): boolean {
  const status = errorStatus(error);
  if (status === 401 || status === 402 || status === 403) return true;
  const message = String((error as { message?: string } | null)?.message ?? "").toLowerCase();
  return /allowance|exhausted|insufficient|quota exceeded|balance/.test(message);
}

const exhaustedUntil = new Map<string, number>();

export function resetKeyCooldowns() {
  exhaustedUntil.clear();
}

/**
 * Tries every AI STAR key in order (and each model on a key). A key that runs out
 * of tokens is skipped for a while so the next key with balance takes over.
 */
export async function tryStarKeys<T>(
  keys: string[],
  models: string[],
  run: (apiKey: string, model: string) => Promise<T>,
  options: { onError?: (error: unknown) => void; stopRetrying?: () => boolean; now?: () => number } = {},
): Promise<{ value: T; key: string; model: string }> {
  const now = options.now ?? Date.now;
  const started = now();
  let lastError: unknown = new Error("No AI STAR key with balance");
  for (const key of keys) {
    if ((exhaustedUntil.get(key) ?? 0) > now()) continue;
    for (const model of models) {
      if (now() - started > STAR_BUDGET_MS) throw lastError;
      try {
        const value = await run(key, model);
        exhaustedUntil.delete(key);
        return { value, key, model };
      } catch (error) {
        lastError = error;
        options.onError?.(error);
        if (options.stopRetrying?.()) throw error;
        if (isKeyLimitError(error)) {
          exhaustedUntil.set(key, now() + KEY_COOLDOWN_MS);
          break;
        }
      }
    }
  }
  throw lastError;
}
