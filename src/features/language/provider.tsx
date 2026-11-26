/** @jsxImportSource react */
import { useEffect, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { useRouterState } from '@tanstack/react-router';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageContext, OriginalText, useLanguageStore } from './context';
import { accountLanguageQuery } from './queries';
import { translateAppText } from './language.functions';
import { TranslationStore } from './store';
import { languageDirection, needsLanguageChoice } from './model';
import { LanguageChooser } from './chooser';
import { LanguageDialogs } from './dialogs';
import { TranslationReadiness } from './readiness';

function TranslationStatus() {
  const store = useLanguageStore();
  useSyncExternalStore(store?.subscribe ?? (() => () => {}), store?.snapshot ?? (() => 0), () => 0);
  if (!store?.error) return null;
  return <OriginalText><div role="status" className="flex flex-wrap items-center justify-center gap-2 border-b border-border bg-secondary px-3 py-2 text-xs"><span>{store.language === 'hi' ? 'कुछ टेक्स्ट का अनुवाद नहीं हो पाया।' : 'Some text could not be translated.'}</span><Button type="button" size="sm" variant="ghost" onClick={() => store.retry()}><RefreshCw />{store.language === 'hi' ? 'फिर कोशिश करें' : 'Retry translation'}</Button></div></OriginalText>;
}
export function LanguageProvider({ userId, children }: { userId: string | null | undefined; children: ReactNode }) {
  const pathname = useRouterState({ select: state => state.location.pathname });
  const publicPage = pathname === '/' || pathname === '/auth' || pathname.startsWith('/legal/');
  const language = useQuery({ ...accountLanguageQuery(userId ?? ''), enabled: !!userId });
  const translate = useServerFn(translateAppText);
  const code = language.data ?? 'en';
  const store = useMemo(() => new TranslationStore(code, sources => translate({ data: { language: code, sources } })), [code, userId, translate]);
  useEffect(() => { store.activate(); return () => store.dispose(); }, [store]);
  useEffect(() => {
    document.documentElement.lang = userId ? code : 'en';
    document.documentElement.dir = languageDirection(userId ? code : 'en');
    return () => { document.documentElement.lang = 'en'; document.documentElement.dir = 'ltr'; };
  }, [code, userId]);
  let content = children;
  if (!publicPage && (userId === undefined || (!!userId && language.isPending))) {
    content = <div role="status" className="grid min-h-dvh place-items-center"><Loader2 aria-label="Loading language" className="size-7 animate-spin text-primary motion-reduce:animate-none" /></div>;
  } else if (!publicPage && userId && language.isError) {
    content = <OriginalText><div className="mx-auto max-w-lg space-y-4 px-5 py-16"><p role="alert">Could not load your language. Please try again.</p><Button variant="outline" onClick={() => language.refetch()}><RefreshCw />Retry</Button></div></OriginalText>;
  } else if (!publicPage && userId && needsLanguageChoice(language.data)) {
    content = <LanguageChooser />;
  }
  return <LanguageContext.Provider value={userId ? store : null}><LanguageDialogs><TranslationStatus /><TranslationReadiness scope={pathname} continuous>{content}</TranslationReadiness></LanguageDialogs></LanguageContext.Provider>;
}