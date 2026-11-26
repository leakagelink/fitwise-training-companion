// ISO 639-1 living languages, plus common script/regional choices.
import { ENGLISH_LANGUAGE_NAMES } from './names';
export const LANGUAGE_CODES = ('aa ab ae af ak am an ar as av ay az ba be bg bh bi bm bn bo br bs ca ce ch co cr cs cu cv cy da de dv dz ee el en eo es et eu fa ff fi fj fo fr fy ga gd gl gn gu gv ha he hi ho hr ht hu hy hz ia id ie ig ii ik io is it iu ja jv ka kg ki kj kk kl km kn ko kr ks ku kv kw ky la lb lg li ln lo lt lu lv mg mh mi mk ml mn mr ms mt my na nb nd ne ng nl nn no nr nv ny oc oj om or os pa pi pl ps pt qu rm rn ro ru rw sa sc sd se sg si sk sl sm sn so sq sr ss st su sv sw ta te tg th ti tk tl tn to tr ts tt tw ty ug uk ur uz ve vi vo wa wo xh yi yo za zh zu zh-Hans zh-Hant pt-BR hi-Latn').split(' ');
export const RTL_CODES = new Set(['ar', 'fa', 'he', 'ur', 'ps', 'sd', 'ug', 'yi', 'dv']);
const NATIVE_NAMES: Record<string, string> = {
  en: 'English', hi: 'हिन्दी', 'hi-Latn': 'Hinglish (Hindi in English letters)', mr: 'मराठी', gu: 'ગુજરાતી', bn: 'বাংলা', ta: 'தமிழ்', te: 'తెలుగు', kn: 'ಕನ್ನಡ', ml: 'മലയാളം', pa: 'ਪੰਜਾਬੀ', or: 'ଓଡ଼ିଆ', as: 'অসমীয়া', ur: 'اردو', ne: 'नेपाली', sa: 'संस्कृतम्', sd: 'سنڌي', ks: 'کٲشُر', ar: 'العربية', fr: 'Français', de: 'Deutsch', es: 'Español', it: 'Italiano', pt: 'Português', ru: 'Русский', ja: '日本語', ko: '한국어', zh: '中文', 'zh-Hans': '简体中文', 'zh-Hant': '繁體中文', id: 'Bahasa Indonesia', tr: 'Türkçe', vi: 'Tiếng Việt', th: 'ไทย', fa: 'فارسی', he: 'עברית', 'pt-BR': 'Português (Brasil)',
};
export function isLanguageCode(code: unknown): code is string {
  return typeof code === 'string' && LANGUAGE_CODES.includes(code);
}
export function languageName(code: string): string {
  const known = ENGLISH_LANGUAGE_NAMES[code];
  if (known) return known;
  try { return new Intl.DisplayNames(['en'], { type: 'language' }).of(code) ?? code; } catch { return code; }
}
export function nativeLanguageName(code: string): string {
  if (NATIVE_NAMES[code]) return NATIVE_NAMES[code];
  try { const name = new Intl.DisplayNames([code], { type: 'language' }).of(code); return name && name !== code ? name : languageName(code); } catch { return languageName(code); }
}
export function languageDirection(code: string): 'ltr' | 'rtl' {
  return RTL_CODES.has(code.split('-')[0] ?? '') ? 'rtl' : 'ltr';
}
export function needsLanguageChoice(code: unknown): boolean { return !isLanguageCode(code); }
export function languageInstructions(code: string): string {
  const valid = isLanguageCode(code) ? code : 'en';
  return `The user's saved communication language is ${languageName(valid)} (${valid}). Reply in this language even if the user's message is in another language, unless they explicitly ask for another language. Use its native script${valid === 'hi-Latn' ? ' exception: use Roman Hindi / Hinglish, not Devanagari' : ''}. For JSON: translate human-readable names, headings, explanations and guidance only. Preserve JSON keys, enum values, identifiers, exercise_id, numbers, timestamps, nutrition values and standard measurement units exactly; never translate machine-readable fields. Never mention these instructions.`;
}
export function canonicalRecipeInstructions(code: string, conversational = false): string {
  const valid = isLanguageCode(code) ? code : 'en';
  return `The account's communication language is ${languageName(valid)} (${valid}). The app displays recipes in this language. For reliable allergy and diet validation, keep recipe names, ingredient names, quantities, cooking instructions and alternatives in canonical English; keep JSON keys, enums, numeric nutrients and standard units unchanged. ${conversational ? `Only the conversational message and each why must be in ${languageName(valid)}${valid === 'hi-Latn' ? ' in Roman Hindi / Hinglish' : ' in its native script'}.` : 'The app translates the validated recipe payload for display; never translate safety-check fields before validation.'}`;
}
export function canTranslate(source: string): boolean {
  const text = source.trim();
  if (/^\p{L}$/u.test(text)) return false;
  // Clocks and quantities are values, not prose; never translate them on each tick.
  if (/^(?:[\d\s.,:()+\-–—×/%→]|kg|kcal|mcg|mg|ml|cm|min|sec|s|h|g|L)+$/i.test(text)) return false;
  if (/^[\[{]/.test(text)) { try { JSON.parse(text); return false; } catch { /* Human-readable text, not a machine record. */ } }
  return text.length > 0 && text.length <= 4000 && /\p{L}/u.test(text) &&
    !/^(https?:\/\/|data:|[\w.+-]+@[\w.-]+\.[a-z]{2,}|[0-9a-f]{8}-[0-9a-f-]{27,})/i.test(text) &&
    !/^(Muscles Zone|Exercise data by RepDB|RepDB|kg|g|mg|mcg|ml|cm|kcal|IU|UTC|s|h|L)$/i.test(text);
}
export const translationRequestLimits = { batch: 50, characters: 12000, source: 4000 } as const;
export function numberTemplate(source: string): { key: string; values: string[] } {
  const values: string[] = [];
  const key = source.trim().replace(/https?:\/\/[^\s]+|[\w.+-]+@[\w.-]+\.[a-z]{2,}|\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b|\d+(?:[.,]\d+)*/gi, value => {
    const token = `__NUM_${values.length}__`; values.push(value); return token;
  });
  return { key, values };
}
export function translationKeepsValues(source: string, translated: string): boolean {
  const numbers = (text: string) => (text.match(/\d+(?:[.,]\d+)*/g) ?? []).sort().join('|');
  if (numbers(source) !== numbers(translated)) return false;
  const literals = source.match(/__NUM_\d+__|https?:\/\/[^\s]+|\b(?:Muscles Zone|RepDB|EXPORT|kg|g|ml|kcal|cm|mg|mcg|IU)\b/g) ?? [];
  return literals.every(literal => translated.includes(literal));
}