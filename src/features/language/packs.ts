/** Built-in Hindi and Hinglish app text; loaded once per chosen language, no live translation. */
export async function loadLanguagePack(code: string): Promise<Record<string, string>> {
  if (code === 'hi') return (await import('./packs/hi.json')).default as Record<string, string>;
  if (code === 'hi-Latn') return (await import('./packs/hi-Latn.json')).default as Record<string, string>;
  return {};
}
