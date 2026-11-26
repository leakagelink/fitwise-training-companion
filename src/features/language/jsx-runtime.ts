import { cloneElement, createElement, isValidElement, Fragment, useContext, useEffect, useSyncExternalStore, type ElementType, type ReactNode, type Key } from 'react';
import { jsx as reactJsx, jsxs as reactJsxs } from 'react/jsx-runtime';
import { Link } from '@tanstack/react-router';
import { LanguageContext, OriginalTextContext, TranslatedText } from './context';
export type { JSX } from 'react';
export { Fragment };

const excluded = new Set(['html', 'head', 'body', 'meta', 'link', 'script', 'style', 'svg', 'path', 'circle', 'rect', 'line', 'g', 'defs', 'clipPath', 'polygon', 'polyline', 'ellipse', 'title', 'pre', 'code', 'kbd']);
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
  if (Array.isArray(child)) return child.map((value, key) => typeof value === 'string' ? createElement(TranslatedText, { source: value, key }) : isValidElement(value) && value.key === null ? cloneElement(value, { key }) : value);
  return child;
}
type HostProps = { tag: ElementType; originalProps: Record<string, unknown> };
function LocalizedHost({ tag, originalProps }: HostProps) {
  const store = useContext(LanguageContext);
  const original = useContext(OriginalTextContext) || originalProps['translate'] === 'no';
  useSyncExternalStore(store?.subscribe ?? noSubscribe, store?.snapshot ?? zero, zero);
  const props = { ...originalProps };
  const sources = tag === 'textarea' ? [] : sourceStrings(props['children'] as ReactNode);
  for (const attr of attributes) if (typeof props[attr] === 'string') sources.push(props[attr] as string);
  const sourceKey = JSON.stringify(sources);
  useEffect(() => { if (!original) for (const source of sources) store?.request(source); }, [store, sourceKey, original]);
  if (store && !original) {
    for (const attr of attributes) if (typeof props[attr] === 'string') props[attr] = store.text(props[attr] as string);
    if (tag !== 'textarea') props['children'] = translateChildren(props['children'] as ReactNode, store.text);
    // Never let a translated option label change the submitted selection value.
    if (tag === 'option' && props['value'] === undefined && typeof originalProps['children'] === 'string') props['value'] = originalProps['children'];
  }
  if (Array.isArray(props['children'])) props['children'] = props['children'].map((child: ReactNode, key: number) => isValidElement(child) && child.key === null ? cloneElement(child, { key }) : child);
  return createElement(tag, props);
}
export function localize(type: ElementType, input: unknown, key: Key | undefined, runtime: typeof reactJsx) {
  const props = input !== null && typeof input === 'object' ? input as Record<string, unknown> : null;
  if (typeof type === 'string' && !excluded.has(type)) return runtime(LocalizedHost, { tag: type, originalProps: props ?? {} }, key);
  if (type === Fragment && props) return runtime(type, { ...props, children: wrapText(props['children'] as ReactNode) }, key);
  if (type === Link && props) return runtime(LocalizedHost, { tag: type, originalProps: { ...props, children: wrapText(props['children'] as ReactNode) } }, key);
  // Radix primitives and motion elements render their host nodes inside library code.
  // Localize plain string children without changing their type or their submitted values.
  if (typeof type !== 'string' && props && (sourceStrings(props['children'] as ReactNode).length || attributes.some(attr => typeof props[attr] === 'string'))) return runtime(LocalizedHost, { tag: type, originalProps: props }, key);
  return runtime(type, props, key);
}
export const jsx: typeof reactJsx = (type, props, key) => localize(type, props, key, reactJsx);
export const jsxs: typeof reactJsxs = (type, props, key) => localize(type, props, key, reactJsxs);