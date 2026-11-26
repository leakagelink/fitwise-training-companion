/** @jsxImportSource react */
import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { OriginalText, useLanguageStore } from './context';
import { nativeLanguageName } from './model';

/** Keep the mounted screen/form intact while its first language pack is prepared. */
export function TranslationReadiness({ children, scope, continuous = false, contentClassName = '' }: {
  children: ReactNode; scope: string; continuous?: boolean; contentClassName?: string;
}) {
  const store = useLanguageStore();
  const revision = useSyncExternalStore(store?.subscribe ?? (() => () => {}), store?.snapshot ?? (() => 0), () => 0);
  const key = `${store?.language ?? 'en'}:${scope}`;
  const [readyFor, setReadyFor] = useState(store ? '' : key);
  useEffect(() => {
    const timer = setTimeout(() => { if (!store?.busy || store.error) setReadyFor(key); }, 250);
    return () => clearTimeout(timer);
  }, [store, key, revision]);
  const loading = !!store && !store.error && (readyFor !== key || (continuous && store.busy));
  return <div className="relative" aria-busy={loading}>
    <div className={`${contentClassName} ${loading ? 'invisible pointer-events-none' : ''}`}>{children}</div>
    {loading && <OriginalText><div role="status" className="absolute inset-0 flex min-h-32 items-center justify-center gap-3 bg-background px-5 text-sm text-muted-foreground"><Loader2 aria-hidden="true" className="size-5 animate-spin text-primary motion-reduce:animate-none" /><span lang={store.language}>{nativeLanguageName(store.language)}…</span></div></OriginalText>}
  </div>;
}