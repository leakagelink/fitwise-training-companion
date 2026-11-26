/** @jsxImportSource react */
import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Check, Languages, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/brand/logo';
import { LANGUAGE_CODES, languageName, nativeLanguageName } from './model';
import { OriginalText } from './context';
import { saveAccountLanguage } from './language.functions';

export function LanguageChooser({ current = null, onComplete }: { current?: string | null; onComplete?: () => void | Promise<void> }) {
  const [selected, setSelected] = useState<string | null>(current);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const save = useServerFn(saveAccountLanguage);
  const qc = useQueryClient();
  const languages = useMemo(() => LANGUAGE_CODES.map(code => ({ code, name: languageName(code), native: nativeLanguageName(code) })), []);
  const filtered = languages.filter(language => `${language.code} ${language.name} ${language.native}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  const selectedName = languages.find(language => language.code === selected)?.native;
  async function continueWithLanguage() {
    if (!selected || busy) return;
    setBusy(true); setError('');
    try {
      await save({ data: { language: selected } });
      await qc.invalidateQueries({ queryKey: ['account-language'] });
      await onComplete?.();
    } catch { setError('Could not save your language. Please try again.'); }
    finally { setBusy(false); }
  }
  return <OriginalText><section className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-5 py-8 sm:py-12">
    <header className="space-y-4"><Logo /><Languages className="size-8 text-primary" /><h1 className="font-display text-3xl font-semibold">Choose your language</h1><p className="text-muted-foreground">अपनी भाषा चुनें</p></header>
    <div className="relative"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input aria-label="Search languages" placeholder="Search languages / भाषा खोजें" value={search} onChange={event => setSearch(event.target.value)} className="h-11 pl-10" /></div>
    <div role="radiogroup" aria-label="Languages" className="grid max-h-[45dvh] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
      {filtered.map(language => <Button key={language.code} type="button" role="radio" aria-checked={selected === language.code} variant={selected === language.code ? 'secondary' : 'outline'} disabled={busy} onClick={() => setSelected(language.code)} className="h-auto min-h-14 justify-start whitespace-normal px-3 py-3 text-start"><span className="min-w-0 flex-1"><span className="block break-words text-base" lang={language.code}>{language.native}</span><span className="block text-xs text-muted-foreground">{language.name}</span></span>{selected === language.code && <Check className="shrink-0 text-primary" />}</Button>)}
      {!filtered.length && <p className="py-6 text-sm text-muted-foreground">No languages found</p>}
    </div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <Button type="button" disabled={!selected || busy} onClick={continueWithLanguage} className="h-12 w-full whitespace-normal">{busy ? 'Saving…' : selectedName ? `Continue · ${selectedName}` : 'Continue'}</Button>
  </section></OriginalText>;
}