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
