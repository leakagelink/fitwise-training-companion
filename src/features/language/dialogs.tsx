import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Check, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type DialogRequest = { message: string; prompt: boolean; initial: string; resolve: (value: string | boolean | null) => void };
type DialogApi = { confirm: (message: string) => Promise<boolean>; prompt: (message: string, initial?: string) => Promise<string | null> };
const DialogContext = createContext<DialogApi | null>(null);
export function useLanguageDialogs(): DialogApi {
  const api = useContext(DialogContext);
  if (!api) throw new Error('Localized dialogs need the app language provider');
  return api;
}
export function LanguageDialogs({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<DialogRequest[]>([]);
  const pending = useRef<DialogRequest[]>([]);
  const [value, setValue] = useState('');
  const current = requests[0];
  const api = useMemo<DialogApi>(() => ({
    confirm: message => new Promise<boolean>(resolve => {
      const request: DialogRequest = { message, prompt: false, initial: '', resolve: result => resolve(result === true) };
      pending.current.push(request); setRequests([...pending.current]);
    }),
    prompt: (message, initial = '') => new Promise<string | null>(resolve => {
      const request: DialogRequest = { message, prompt: true, initial, resolve: result => resolve(typeof result === 'string' ? result : null) };
      pending.current.push(request); setRequests([...pending.current]);
    }),
  }), []);
  useEffect(() => { setValue(current?.initial ?? ''); }, [current]);
  useEffect(() => () => { for (const request of pending.current) request.resolve(null); pending.current = []; }, []);
  function finish(result: string | boolean | null) {
    const request = pending.current.shift(); request?.resolve(result); setRequests([...pending.current]);
  }
  return <DialogContext.Provider value={api}>{children}<Dialog open={!!current} onOpenChange={open => { if (!open) finish(null); }}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle className="break-words leading-relaxed">{current?.message}</DialogTitle></DialogHeader><form className="space-y-4" onSubmit={event => { event.preventDefault(); finish(current?.prompt ? value : true); }}>{current?.prompt && <Input autoFocus aria-label="Your response" value={value} onChange={event => setValue(event.target.value)} />}<div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => finish(null)}><X />Cancel</Button><Button type="submit"><Check />Continue</Button></div></form></DialogContent></Dialog></DialogContext.Provider>;
}