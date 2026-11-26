import staticSources from './static-sources.json';
const staticText = new Set(staticSources);
/** Only public/static application text may enter durable translation caches. */
export function canPersistTranslation(source: string): boolean { return staticText.has(source.trim()); }