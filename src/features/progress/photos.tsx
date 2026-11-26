import { useLanguageDialogs } from "@/features/language/dialogs";
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { todayISO } from '@/lib/fitness';
import { PhotoPicker } from '@/components/photo-picker';

export function ProgressPhotos() {
  const dialogs = useLanguageDialogs();
  const qc=useQueryClient();
  const [busy,setBusy]=useState(false), [before,setBefore]=useState(''), [after,setAfter]=useState('');
  const [photo,setPhoto]=useState<File|null>(null);
  const q=useQuery({queryKey:['progress','photos'],staleTime: 5*60_000,queryFn:async()=>{
    const r=await supabase.from('progress_photos').select('*').order('taken_on').order('created_at');
    if(r.error) throw new Error('Could not load photos');
    return Promise.all(r.data.map(async row=>{
      const signed=await supabase.storage.from('progress-photos').createSignedUrl(row.storage_path,1800);
      if(signed.error) throw new Error('Could not load private photo');
      return {...row,url:signed.data.signedUrl};
    }));
  }});
  const rows=q.data ?? [];
  const a=rows.find(r=>r.id===before) ?? rows[0];
  const b=rows.find(r=>r.id===after) ?? [...rows].reverse().find(r=>r.pose===a?.pose);
  async function upload(e:React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form=e.currentTarget; const f=new FormData(form); const file=photo;
    if(!(file instanceof File)||!file.size) return;
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){toast.error('Choose a JPG, PNG or WebP photo under 5 MB');return;}
    setBusy(true);
    let path:string|null=null;
    try{
      const auth=await supabase.auth.getSession();const id=auth.data.session?.user.id;if(!id)throw new Error('Please sign in again');
      path=`${id}/${crypto.randomUUID()}.${file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg'}`;
      const r=await supabase.storage.from('progress-photos').upload(path,file);if(r.error)throw r.error;
      const saved=await supabase.from('progress_photos').insert({user_id:id,storage_path:path,taken_on:String(f.get('date')),pose:String(f.get('pose')),note:String(f.get('note')??'')});
      if(saved.error){await supabase.storage.from('progress-photos').remove([path]);throw saved.error;}
      form.reset();setPhoto(null);await qc.invalidateQueries({queryKey:['progress','photos']});toast.success('Private photo saved');
    }catch{toast.error('Could not save photo');}finally{setBusy(false);}
  }
  async function remove(id:string,path:string){
    if(!await dialogs.confirm('Permanently delete this progress photo?'))return;
    setBusy(true);
    try{const r=await supabase.storage.from('progress-photos').remove([path]);if(r.error)throw r.error;const d=await supabase.from('progress_photos').delete().eq('id',id);if(d.error)throw d.error;await qc.invalidateQueries({queryKey:['progress','photos']});toast.success('Photo deleted');}catch{toast.error('Could not delete photo');}finally{setBusy(false);}
  }
  return <section className="space-y-4 border-b border-border pb-5"><h2 className="text-lg font-semibold">Progress photos</h2><p className="text-xs text-muted-foreground">Private to your account. Use the same pose, lighting and distance for comparisons.</p>
    <form onSubmit={upload} className="grid gap-3 sm:grid-cols-2">
      <PhotoPicker label="Progress photo" fileName={photo?.name ?? ''} disabled={busy} onChange={setPhoto}/>
      <label className="text-sm">Taken on<Input className="mt-1" name="date" type="date" defaultValue={todayISO()} max={todayISO()} required/></label>
      <label className="text-sm">Pose<select name="pose" className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3"><option value="front">Front</option><option value="side">Side</option><option value="back">Back</option></select></label>
      <label className="text-sm">Note (optional)<Input className="mt-1" name="note" maxLength={200}/></label>
      <Button disabled={busy || !photo} type="submit"><Upload/> {busy?'Saving…':'Save photo'}</Button>
    </form>
    {q.isError && <p role="alert" className="text-sm text-destructive">Could not load photos.</p>}
    {rows.length>0 && <><h3 className="font-semibold">Before &amp; after</h3><div className="grid grid-cols-2 gap-3">{([{label:'Before',row:a,set:setBefore},{label:'After',row:b,set:setAfter}]).map(({label,row,set})=><div key={label} className="min-w-0 space-y-2"><label className="text-sm">{label}<select aria-label={`${label} photo`} value={row?.id??''} onChange={e=>set(e.target.value)} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-2 text-xs">{rows.map(r=><option key={r.id} value={r.id}>{r.taken_on} · {r.pose}</option>)}</select></label>{row && <><img src={row.url} alt={`${label} ${row.pose} progress photo`} className="aspect-[3/4] w-full rounded-md bg-muted object-contain"/><p className="break-words text-xs text-muted-foreground">{row.note}</p></>}</div>)}</div>{a?.pose!==b?.pose && <p className="text-xs text-muted-foreground">Different poses selected; this comparison may be misleading.</p>}
    <div className="space-y-2">{rows.map(r=><div key={r.id} className="flex items-center justify-between border-t border-border py-2 text-sm"><span>{r.taken_on} · {r.pose}</span><Button size="icon" variant="ghost" aria-label={`Delete photo ${r.taken_on} ${r.pose}`} disabled={busy} onClick={()=>remove(r.id,r.storage_path)}><Trash2/></Button></div>)}</div></>}
    {!q.isPending&&!rows.length&&!q.isError&&<p className="text-sm text-muted-foreground">No progress photos yet.</p>}
  </section>;
}
