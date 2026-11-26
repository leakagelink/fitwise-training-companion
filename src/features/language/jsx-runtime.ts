import { createElement, Fragment, useContext, useEffect, useSyncExternalStore, type ElementType, type ReactNode } from 'react';
import { jsx as reactJsx, jsxs as reactJsxs } from 'react/jsx-runtime';
import { Link } from '@tanstack/react-router';
import { LanguageContext, OriginalTextContext, TranslatedText } from './context';
export type { JSX } from 'react';
export { Fragment };

const excluded = new Set(['html', 'head', 'body', 'meta', 'link', 'script', 'style', 'svg', 'path', 'circle', 'rect', 'line', 'g', 'defs', 'clipPath', 'polygon', 'polyline', 'ellipse', 'title', 'textarea']);
const attributes = ['placeholder', 'aria-label', 'title', 'alt'] as const;
const noSubscribe = () => () => {};
const zero = () => 0;
function sourceStrings(child: ReactNode): string[] {
  if (typeof child === 'string') return [child];
  if (Array.isArray(child)) return child.flatMap(sourceStrings);
  return [];
}
function translateChildren(child: ReactNode, text: (source: string) => string): ReactNode {
  if (typeof child === 'string') return text(child);
  if (Array.isArray(child)) return child.map(value => translateChildren(value, text));
  return child;
}
function wrapText(child: ReactNode): ReactNode {
  if (typeof child === 'string') return createElement(TranslatedText, { source: child });
  if (Array.isArray(child)) return child.map((value, key) => typeof value === 'string' ? createElement(TranslatedText, { source: value, key }) : value);
  return child;
}
type HostProps = { tag: string; originalProps: Record<string, unknown> };
function LocalizedHost({ tag, originalProps }: HostProps) {
  const store = useContext(LanguageContext);
  const original = useContext(OriginalTextContext) || originalProps['translate'] === 'no';
  useSyncExternalStore(store?.subscribe ?? noSubscribe, store?.snapshot ?? zero, zero);
  const props = { ...originalProps };
  const sources = sourceStrings(props['children'] as ReactNode);
  for (const attr of attributes) if (typeof props[attr] === 'string') sources.push(props[attr] as string);
  const sourceKey = JSON.stringify(sources);
  useEffect(() => { if (!original) for (const source of sources) store?.request(source); }, [store, sourceKey, original]);
  if (store && !original) {
    for (const attr of attributes) if (typeof props[attr] === 'string') props[attr] = store.text(props[attr] as string);
    props['children'] = translateChildren(props['children'] as ReactNode, store.text);
    // Never let a translated option label change the submitted selection value.
    if (tag === 'option' && props['value'] === undefined && typeof originalProps['children'] === 'string') props['value'] = originalProps['children'];
  }
  return createElement(tag, props);
}
function localize(type: ElementType, props: Record<string, unknown> | null, key: string | undefined, runtime: typeof reactJsx) {
  if (typeof type === 'string' && !excluded.has(type)) return runtime(LocalizedHost, { tag: type, originalProps: props ?? {} }, key);
  if ((type === Fragment || type === Link) && props) return runtime(type, { ...props, children: wrapText(props['children'] as ReactNode) }, key);
  return runtime(type, props, key);
}
export const jsx: typeof reactJsx = (type, props, key) => localize(type, props, key, reactJsx);
export const jsxs: typeof reactJsxs = (type, props, key) => localize(type, props, key, reactJsxs);