import staticSources from './static-sources.json';
import { numberTemplate } from './model';
const staticText = new Set(staticSources.flatMap(source => [source, numberTemplate(source).key]));
/** Only public/static application text may enter durable translation caches. */
export function canPersistTranslation(source: string): boolean { return staticText.has(source.trim()); }