import { useLanguageDialogs } from "@/features/language/dialogs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Save, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { listAdminRecords, saveAdminRecord } from "./admin.functions";
import { resourceConfig, type ResourceName, validateRecord } from "./resources";

export function RecordManager({ resource, userId }: { resource: ResourceName; userId?: string }) {
  const dialogs = useLanguageDialogs();
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const qc = useQueryClient();
  const list = useServerFn(listAdminRecords);
  const save = useServerFn(saveAdminRecord);
  const config = resourceConfig(resource);
  const records = useQuery({ queryKey: ["admin-records", resource, userId, page], queryFn: () => list({ data: { resource, userId: userId ?? null, page } }) });
  const fields = Object.entries(config.fields);
  const key = config.key ?? "id";
  function open(row: Record<string, unknown>) {
    setEditing(row); setReason(""); setError("");
    setValues(Object.fromEntries(fields.map(([name, field]) => [name, name in row ? row[name] : name === config.owner && userId ? userId : field.initial === null ? null : field.initial ?? ""])));
  }
  async function refresh() { await qc.invalidateQueries(); }
  async function submit() {
    if (!editing) return;
    setBusy(true); setError("");
    try {
      const next = { ...values };
      if (editing[key] && config.owner) delete next[config.owner];
      if (editing[key] && config.key) delete next[config.key];
      // Owner/key fields are omitted from updates, not reassigned.
      const parsed = validateRecord(resource, next, !editing[key]);
      await save({ data: { resource, id: editing[key] ? String(editing[key]) : null, values: parsed, remove: false, reason } });
      setEditing(null); await refresh(); toast.success("Record saved");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save"); }
    finally { setBusy(false); }
  }
  async function remove(row: Record<string, unknown>) {
    if (!await dialogs.confirm(`Delete this ${config.label.toLowerCase()} record? Related child records may also be deleted.`)) return;
    const why = await dialogs.prompt("Reason for deletion"); if (!why) return;
    setBusy(true);
    try { await save({ data: { resource, id: String(row[key]), values: {}, remove: true, reason: why } }); await refresh(); toast.success("Record deleted"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not delete"); }
    finally { setBusy(false); }
  }
  return <section className="min-w-0 space-y-4">
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between"><h2 className="min-w-0 break-words text-lg font-semibold sm:text-xl">{config.label}</h2>{config.create !== false && !(resource === "app_controls" && records.data?.rows.length) && <Button size="sm" onClick={() => open({})}><Plus /> Add record</Button>}</header>
    {records.isPending && <p className="py-8 text-muted-foreground">Loading records…</p>}
    {records.isError && <p role="alert" className="text-destructive">{records.error.message}</p>}
    {!records.isPending && !records.data?.rows.length && <p className="border-y border-border py-10 text-muted-foreground">No records.</p>}
    {!!records.data?.rows.length && <div className="admin-record-table hidden max-w-full overflow-x-auto md:block" tabIndex={0} aria-label={`${config.label} records`}><table className="w-full text-left text-sm"><thead className="border-y border-border text-xs text-muted-foreground"><tr><th className="py-3 pr-4">Record</th>{fields.slice(0, 4).map(([name, f]) => <th key={name} className="px-3 py-3">{f.label}</th>)}<th className="py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-border">{records.data.rows.map(row => <tr key={String(row[key])}><td className="max-w-28 truncate py-4 pr-3 text-xs text-muted-foreground" title={String(row[key])}>{String(row[key])}</td>{fields.slice(0, 4).map(([name]) => <td key={name} className="max-w-52 truncate px-3 py-4">{typeof row[name] === "object" ? JSON.stringify(row[name]) : String(row[name] ?? "—")}</td>)}<td className="py-3"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon-sm" title="Edit record" aria-label="Edit record" disabled={busy} onClick={() => open(row)}><Pencil /></Button>{config.remove !== false && <Button variant="ghost" size="icon-sm" title="Delete record" aria-label="Delete record" disabled={busy} onClick={() => remove(row)}><Trash2 className="text-destructive" /></Button>}</div></td></tr>)}</tbody></table></div>}
    {!!records.data?.rows.length && <div className="admin-record-list md:hidden">{records.data.rows.map(row => <article key={String(row[key])} className="min-w-0 py-4"><header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"><p className="truncate text-xs text-muted-foreground" title={String(row[key])}>{String(row[key])}</p><div className="flex shrink-0 gap-1"><Button variant="outline" size="icon" className="size-11" title="Edit record" aria-label="Edit record" disabled={busy} onClick={() => open(row)}><Pencil /></Button>{config.remove !== false && <Button variant="ghost" size="icon" className="size-11" title="Delete record" aria-label="Delete record" disabled={busy} onClick={() => remove(row)}><Trash2 className="text-destructive" /></Button>}</div></header><dl className="mt-3 grid min-w-0 grid-cols-2 gap-3">{fields.slice(0, 4).map(([name, field]) => <div key={name} className="min-w-0"><dt className="text-xs text-muted-foreground">{field.label}</dt><dd className="mt-1 line-clamp-3 break-words text-sm [overflow-wrap:anywhere]">{typeof row[name] === "object" ? JSON.stringify(row[name]) : String(row[name] ?? "—")}</dd></div>)}</dl></article>)}</div>}
    <div className="flex items-center justify-end gap-3 text-xs text-muted-foreground"><span>{records.data?.total ?? 0} records · page {page}</span><Button variant="outline" size="icon-sm" aria-label="Previous records" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft /></Button><Button variant="outline" size="icon-sm" aria-label="Next records" disabled={page * 25 >= (records.data?.total ?? 0)} onClick={() => setPage(p => p + 1)}><ChevronRight /></Button></div>
    <Dialog open={editing !== null} onOpenChange={o => !o && setEditing(null)}><DialogContent className="admin-workspace max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg p-4 sm:max-w-2xl sm:p-6"><DialogHeader className="min-w-0 pr-7 text-left"><DialogTitle className="break-words leading-snug">{editing?.[key] ? "Edit" : "Add"} · {config.label}</DialogTitle><DialogDescription>Changes are recorded in admin activity.</DialogDescription></DialogHeader><div className="grid gap-4 sm:grid-cols-2">{fields.map(([name, field]) => {
      const locked = !!editing?.[key] && (name === config.owner || name === config.key);
      return <label key={name} className={`min-w-0 space-y-1.5 text-sm ${field.type === "json" ? "sm:col-span-2" : ""}`}><span className="block font-medium">{field.label}</span>{field.type === "boolean" ? <input type="checkbox" aria-label={field.label} checked={!!values[name]} disabled={locked} onChange={e => setValues(v => ({ ...v, [name]: e.target.checked }))} className="size-5 accent-primary" /> : field.type === "json" ? <Textarea aria-label={field.label} defaultValue={JSON.stringify(values[name], null, 2)} rows={4} onBlur={e => { try { setValues(v => ({ ...v, [name]: JSON.parse(e.target.value) })); setError(""); } catch { setError(`${field.label}: invalid JSON`); } }} /> : <Input aria-label={field.label} disabled={locked} type={field.type === "datetime" ? "datetime-local" : field.type === "number" ? "number" : field.type === "date" ? "date" : "text"} step="any" value={field.type === "datetime" && values[name] ? String(values[name]).slice(0, 16) : String(values[name] ?? "")} onChange={e => { let value: unknown = e.target.value; if (field.type === "number") value = e.target.value === "" ? null : Number(e.target.value); if (field.type === "datetime" && e.target.value) value = new Date(e.target.value).toISOString(); if (!e.target.value && field.initial === null) value = null; setValues(v => ({ ...v, [name]: value })); }} />}</label>;
    })}<label className="min-w-0 space-y-1.5 text-sm sm:col-span-2"><span>Reason for change</span><Input aria-label="Reason for change" value={reason} onChange={e => setReason(e.target.value)} /></label></div>{error && <p role="alert" className="break-words text-sm text-destructive">{error}</p>}<div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end"><Button variant="outline" onClick={() => setEditing(null)}><X /> Cancel</Button><Button disabled={busy || reason.trim().length < 3} onClick={submit}><Save /> {busy ? "Saving…" : "Save changes"}</Button></div></DialogContent></Dialog>
  </section>;
}