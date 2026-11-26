import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LanguageChooser } from '@/features/language/chooser';
import { getAccountLanguage } from '@/features/language/language.functions';
import { workspaceQuery, workspaceDestination } from '@/features/account/workspace';
export const Route = createFileRoute('/_authenticated/language')({
  head: () => ({ meta: [
    { title: 'Choose your language — Muscles Zone' },
    { name: 'description', content: 'Choose your preferred language for Muscles Zone and your personalized coach.' },
    { property: 'og:title', content: 'Choose your language — Muscles Zone' },
    { property: 'og:description', content: 'Your Muscles Zone account, in your preferred language.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
  ] }),
  component: LanguagePage,
});
function LanguagePage() {
  const preference = useQuery({ queryKey: ['language-settings'], queryFn: () => getAccountLanguage() });
  const qc = useQueryClient();
  const navigate = useNavigate();
  return <LanguageChooser key={preference.data ?? 'new'} current={preference.data ?? null} onComplete={async () => {
    await qc.invalidateQueries({ queryKey: ['language-settings'] });
    const identity = await qc.fetchQuery(workspaceQuery);
    await navigate({ to: workspaceDestination(identity.isAdmin), replace: true });
  }} />;
}