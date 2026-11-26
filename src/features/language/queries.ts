import { queryOptions } from '@tanstack/react-query';
import { getAccountLanguage } from './language.functions';
export const accountLanguageQuery = (userId: string) => queryOptions({
  queryKey: ['account-language', userId],
  queryFn: () => getAccountLanguage(),
  staleTime: 5 * 60_000,
  retry: false,
});