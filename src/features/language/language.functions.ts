import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { isLanguageCode, translationRequestLimits } from './model';

const codeSchema = z.string().refine(isLanguageCode, 'Choose a supported language');
export const translationInputSchema = z.object({
  language: codeSchema,
  sources: z.array(z.string().trim().min(1).max(translationRequestLimits.source)).min(1).max(translationRequestLimits.batch),
}).refine(data => data.sources.reduce((sum, source) => sum + source.length, 0) <= translationRequestLimits.characters, 'Translation batch is too large');

export const getAccountLanguage = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const result = await context.supabase.from('account_languages').select('language_code').eq('user_id', context.userId).maybeSingle();
  if (result.error) throw new Error('Could not load your language. Please try again.');
  return isLanguageCode(result.data?.language_code) ? result.data.language_code : null;
});
export const saveAccountLanguage = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator(z.object({ language: codeSchema })).handler(async ({ data, context }) => {
    const saved = await context.supabase.from('account_languages').upsert({ user_id: context.userId, language_code: data.language, selected_at: new Date().toISOString() });
    if (saved.error) throw new Error('Could not save your language. Please try again.');
    return { language: data.language };
  });
