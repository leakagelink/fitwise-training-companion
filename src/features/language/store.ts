import { bootstrapTranslations } from './bootstrap';
import { canTranslate, translationRequestLimits } from './model';

export type TranslationResult = { source: string; translated: string };
export type TranslationFetcher = (sources: string[]) => Promise<TranslationResult[]>;

/** Private, provider-owned memory cache. No health text is written to browser storage. */
export class TranslationStore {
  private translations: Map<string, string>;
  private rendered = new Set<string>();
  private waiting = new Set<string>();
  private inFlight = new Set<string>();
  private failed = new Set<string>();
  private listeners = new Set<() => void>();
  private timer: ReturnType<typeof setTimeout> | undefined;
  private disposed = false;
  private active = false;
  private revision = 0;
  error = false;
  constructor(readonly language: string, private fetcher: TranslationFetcher) {
    this.translations = new Map(Object.entries(bootstrapTranslations(language)));
    for (const value of this.translations.values()) this.rendered.add(value);
  }
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  snapshot = () => this.revision;
  private notify() { this.revision++; for (const listener of this.listeners) listener(); }
  text = (source: string): string => {
    const key = source.trim();
    const result = this.translations.get(key);
    return result === undefined ? source : source.replace(key, result);
  };
  request(source: string) {
    const key = source.trim();
    if (this.disposed || this.language === 'en' || !canTranslate(key) || this.translations.has(key) || this.rendered.has(key) || this.inFlight.has(key) || this.failed.has(key)) return;
    this.waiting.add(key);
    if (!this.timer && !this.active) this.timer = setTimeout(() => { this.timer = undefined; void this.flush(); }, 150);
  }
  async flush(): Promise<void> {
    if (this.active || this.disposed || !this.waiting.size) return;
    this.active = true;
    const sources: string[] = [];
    let length = 0;
    for (const text of this.waiting) {
      if (sources.length >= translationRequestLimits.batch || length + text.length > translationRequestLimits.characters) break;
      sources.push(text); length += text.length; this.waiting.delete(text); this.inFlight.add(text);
    }
    try {
      const result = await this.fetcher(sources);
      if (this.disposed) return;
      for (const item of result) if (sources.includes(item.source) && item.translated.trim()) { this.translations.set(item.source, item.translated); this.rendered.add(item.translated); }
      for (const source of sources) if (!this.translations.has(source)) this.failed.add(source);
      this.error = this.failed.size > 0;
    } catch {
      if (this.disposed) return;
      for (const source of sources) this.failed.add(source);
      this.error = true;
    } finally {
      this.active = false;
      for (const source of sources) this.inFlight.delete(source);
      if (!this.disposed) { this.notify(); if (this.waiting.size) void this.flush(); }
    }
  }
  retry() {
    for (const source of this.failed) this.waiting.add(source);
    this.failed.clear(); this.error = false; this.notify(); void this.flush();
  }
  async resolve(sources: string[]): Promise<string[]> {
    const missing = sources.filter(source => canTranslate(source) && !this.translations.has(source.trim()));
    if (this.language !== 'en' && missing.length) {
      const result = await this.fetcher([...new Set(missing.map(s => s.trim()))]);
      if (this.disposed) throw new Error('Language changed');
      for (const item of result) { this.translations.set(item.source, item.translated); this.rendered.add(item.translated); }
      this.notify();
    }
    return sources.map(this.text);
  }
  dispose() { this.disposed = true; if (this.timer) clearTimeout(this.timer); this.waiting.clear(); this.listeners.clear(); }
  activate() { this.disposed = false; }
}