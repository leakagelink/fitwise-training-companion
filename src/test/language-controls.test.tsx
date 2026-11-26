import { createRef } from 'react';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LanguageContext } from '@/features/language/context';
import { TranslationStore } from '@/features/language/store';
import { LanguageDialogs, useLanguageDialogs } from '@/features/language/dialogs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
afterEach(cleanup);
describe('Localized controls preserve behavior', () => {
  it('preserves option values instead of submitting the translated label', () => {
    const store = new TranslationStore('hi', async () => []);
    render(<LanguageContext.Provider value={store}><select aria-label="Meal type"><option>Breakfast</option><option value="Dinner">Dinner</option></select></LanguageContext.Provider>);
    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('Breakfast');
    fireEvent.change(select, { target: { value: 'Dinner' } });
    expect(select).toHaveValue('Dinner');
    store.dispose();
  });
  it('forwards the original input ref and user-entered value', () => {
    const store = new TranslationStore('hi', async () => []);
    const ref = createRef<HTMLInputElement>();
    const changed = vi.fn();
    render(<LanguageContext.Provider value={store}><Input ref={ref} aria-label="Name" onChange={event => changed(event.target.value)} /></LanguageContext.Provider>);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'नमस्ते' } });
    expect(changed).toHaveBeenCalledWith('नमस्ते');
    store.dispose();
  });
  it('canceling the localized confirmation never authorizes the operation', async () => {
    const result = vi.fn();
    function Trigger() {
      const dialogs = useLanguageDialogs();
      return <Button onClick={async () => result(await dialogs.confirm('Delete record?'))}>Open</Button>;
    }
    render(<LanguageDialogs><Trigger /></LanguageDialogs>);
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(result).toHaveBeenCalledWith(false));
  });
});