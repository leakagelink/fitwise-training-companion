import { bootstrapTranslations } from './bootstrap';
import { canTranslate, numberTemplate, translationRequestLimits } from './model';
import { canPersistTranslation } from './sources';

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
  get busy(): boolean { return this.active || this.waiting.size > 0; }
  constructor(readonly language: string, private fetcher: TranslationFetcher) {
    this.translations = new Map(Object.entries(bootstrapTranslations(language)));
    for (const [source, value] of Object.entries(readLocal(language))) this.translations.set(source, value);
    for (const value of this.translations.values()) this.rendered.add(value);
  }
  /** Merge saved static translations so revisited screens render instantly in the chosen language. */
  merge(items: TranslationResult[]) {
    if (this.disposed || !items.length) return;
    for (const item of items) if (item.translated.trim() && !this.translations.has(item.source)) { this.translations.set(item.source, item.translated); this.rendered.add(item.translated); }
    this.persist(items); this.notify();
  }
  private persist(items: TranslationResult[]) {
    const statics = items.filter(item => canPersistTranslation(item.source));
    if (!statics.length || this.language === 'en') return;
    writeLocal(this.language, statics);
  }
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  snapshot = () => this.revision;
  private notify() { this.revision++; for (const listener of this.listeners) listener(); }
  text = (source: string): string => {
    const original = source.trim();
    const direct = this.translations.get(original);
    if (direct !== undefined) return source.replace(original, direct);
    const { key, values } = numberTemplate(source);
    const result = this.translations.get(key);
    if (result === undefined) return source;
    const restored = result.replace(/__NUM_(\d+)__/g, (_token, index: string) => values[Number(index)] ?? '');
    return source.replace(original, restored);
  };
  request(source: string) {
    const original = source.trim();
    const { key } = numberTemplate(original);
    if (this.disposed || (this.language === 'en' && canPersistTranslation(key)) || !canTranslate(original) || key.length > translationRequestLimits.source || this.translations.has(original) || this.translations.has(key) || this.rendered.has(key) || this.inFlight.has(key) || this.failed.has(key)) return;
    const wasBusy = this.busy;
    this.waiting.add(key);
    if (!wasBusy) this.notify();
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
      this.persist(result);
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
    const missing = [...new Set(sources.filter(source => canTranslate(source) && !this.translations.has(source.trim()) && !(this.language === 'en' && canPersistTranslation(source))).map(source => numberTemplate(source).key).filter(key => !this.translations.has(key) && !this.rendered.has(key) && key.length <= translationRequestLimits.source))];
    for (let index = 0; index < missing.length;) {
      const batch: string[] = [];
      let size = 0;
      while (index < missing.length && batch.length < translationRequestLimits.batch) {
        const source = missing[index];
        if (!source || size + source.length > translationRequestLimits.characters) break;
        batch.push(source); size += source.length; index++;
      }
      if (!batch.length) break;
      const result = await this.fetcher(batch);
      if (this.disposed) throw new Error('Language changed');
      for (const item of result) { this.translations.set(item.source, item.translated); this.rendered.add(item.translated); }
      this.persist(result);
      this.notify();
      if (batch.some(source => !this.translations.has(source))) throw new Error('Some translations were incomplete');
    }
    return sources.map(this.text);
  }
  dispose() { this.disposed = true; if (this.timer) clearTimeout(this.timer); this.waiting.clear(); this.listeners.clear(); }
  activate() { this.disposed = false; }
}
const localKey = (language: string) => `fa-static-translations-${language}`;
/** Only allowlisted static app text is kept on the device; health text and user data stay in memory. */
function readLocal(language: string): Record<string, string> {
  if (language === 'en' || typeof localStorage === 'undefined') return {};
  try {
    const parsed = JSON.parse(localStorage.getItem(localKey(language)) ?? '{}') as Record<string, unknown>;
    return Object.fromEntries(Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === 'string' && canPersistTranslation(entry[0])));
  } catch { return {}; }
}
function writeLocal(language: string, items: TranslationResult[]) {
  if (typeof localStorage === 'undefined') return;
  try {
    const current = readLocal(language);
    for (const item of items) current[item.source] = item.translated;
    localStorage.setItem(localKey(language), JSON.stringify(current));
  } catch { /* storage full or blocked: memory cache still works */ }
}
