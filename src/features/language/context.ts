import { createContext, createElement, useContext, useEffect, useSyncExternalStore, type ReactNode } from 'react';
import type { TranslationStore } from './store';

export const LanguageContext = createContext<TranslationStore | null>(null);
export const OriginalTextContext = createContext(false);
const subscribeEmpty = () => () => {};
const zero = () => 0;
export function useLanguageStore(): TranslationStore | null { return useContext(LanguageContext); }
export function useTranslatedText(source: string): string {
  const store = useLanguageStore();
  const original = useContext(OriginalTextContext);
  useSyncExternalStore(store?.subscribe ?? subscribeEmpty, store?.snapshot ?? zero, zero);
  useEffect(() => { if (!original) store?.request(source); }, [store, source, original]);
  return original ? source : store?.text(source) ?? source;
}
export function TranslatedText({ source }: { source: string }) { return useTranslatedText(source); }
export function OriginalText({ children }: { children: ReactNode }) {
  return createElement(OriginalTextContext.Provider, { value: true }, children);
}