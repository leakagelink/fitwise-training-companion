import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { isLanguageCode } from './model';

export async function readUserLanguage(db: SupabaseClient<Database>, userId: string): Promise<string> {
  const result = await db.from('account_languages').select('language_code').eq('user_id', userId).maybeSingle();
  if (result.error) throw new Error('Could not load your language. Please try again.');
  return isLanguageCode(result.data?.language_code) ? result.data.language_code : 'en';
}