import { jsxDEV as reactJsxDEV } from 'react/jsx-dev-runtime';
import { localize } from './jsx-runtime';
export { Fragment } from 'react';
export type { JSX } from 'react';
export const jsxDEV: typeof reactJsxDEV = (type, props, key, staticChildren, source, self) =>
  localize(type, props, key, (element, values, elementKey) => reactJsxDEV(element, values, elementKey, staticChildren, source, self));