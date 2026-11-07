import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Download, Plus, RefreshCw, Share2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { groceryForDays, type Diet } from "@/features/nutrition/model";

export function GroceryList({ days, planId, userId }: { days: Diet["days"]; planId: string | undefined; userId: string }) {
  const qc = useQueryClient();
  const [period, setPeriod] = useState(7);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const q = useQuery({ queryKey: ["groceries", period], queryFn: async () => { const { data, error } = await supabase.from("grocery_items").select("*").eq("user_id", userId).eq("period_days", period).order("category").order("ingredient"); if (error) throw new Error("Could not load groceries"); return data; } });
  async function update(id: string, patch: { purchased?: boolean; quantity?: number }) {
    const { error } = await supabase.from("grocery_items").update(patch).eq("id", id);
    if (error) toast.error("Could not update item");
    await qc.invalidateQueries({ queryKey: ["groceries"] });
  }
  async function generate() {
    if (!planId || !days.length) return;
    setBusy(true);
    const { error } = await supabase.from("grocery_items").insert(groceryForDays(days, period).map(i => ({ ...i, user_id: userId, plan_id: planId, period_days: period })));
    setBusy(false);
    if (error) toast.error("Could not save grocery list");
    else { toast.success("Grocery list ready"); await qc.invalidateQueries({ queryKey: ["groceries"] }); }
  }
  const text = `Fitness AI · ${period}-day groceries\n` + (q.data ?? []).map(i => `${i.purchased ? '[x]' : '[ ]'} ${i.ingredient}: ${i.quantity} ${i.unit} (${i.category})`).join("\n");
  function download() { const a = document.createElement("a"); const url = URL.createObjectURL(new Blob([text], { type: "text/plain" })); a.href = url; a.download = "fitness-groceries.txt"; a.click(); URL.revokeObjectURL(url); }
  return <section className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">Grocery list</h2><div className="flex gap-2"><select aria-label="Grocery period" value={period} onChange={e => setPeriod(Number(e.target.value))} className="rounded-md border border-input bg-background px-3 text-sm"><option value={7}>Weekly</option><option value={30}>Monthly</option></select><Button variant="outline" size="icon" title="Download list" onClick={download} disabled={!q.data?.length}><Download /></Button><Button variant="outline" size="icon" title="Share list" onClick={async () => { try { if (navigator.share) await navigator.share({ title: "My grocery list", text }); else { await navigator.clipboard.writeText(text); toast.success("List copied"); } } catch { toast.error("Sharing cancelled or unavailable"); } }} disabled={!q.data?.length}><Share2 /></Button></div></div>
    <p className="text-xs text-muted-foreground">Estimated quantities for {period} days; your current meal cycle repeats when the list covers a longer period.</p>
    {q.isError && <p role="alert" className="text-destructive">{q.error.message}</p>}
    {!q.data?.some(i => i.plan_id) && <Button onClick={generate} disabled={busy || !days.length}><RefreshCw className={busy ? "animate-spin" : ""} />{busy ? "Creating list…" : "Generate from meal plan"}</Button>}
    <div className="divide-y divide-border">{(q.data ?? []).map(i => <div key={i.id} className="flex items-center gap-3 py-3"><Checkbox aria-label={`Purchased ${i.ingredient}`} checked={i.purchased} onCheckedChange={v => update(i.id, { purchased: !!v })} /><div className="min-w-0 flex-1"><p className={i.purchased ? "text-muted-foreground line-through" : "font-medium"}>{i.ingredient}</p><p className="text-xs text-muted-foreground">{i.category} · {i.per_meal || "Custom item"}</p></div><Input aria-label={`Quantity for ${i.ingredient}`} type="number" min={0.1} step={0.1} defaultValue={i.quantity} key={`${i.id}-${i.quantity}`} className="w-20" onBlur={e => Number(e.target.value) > 0 && update(i.id, { quantity: Number(e.target.value) })} /><span className="w-8 text-xs">{i.unit}</span><Button variant="ghost" size="icon" title={`Remove ${i.ingredient}`} onClick={async () => { const { error } = await supabase.from("grocery_items").delete().eq("id", i.id); if (error) toast.error("Could not remove item"); await qc.invalidateQueries({ queryKey: ["groceries"] }); }}><Trash2 /></Button></div>)}</div>
    <form className="flex gap-2" onSubmit={async e => { e.preventDefault(); if (!name.trim()) return; const { error } = await supabase.from("grocery_items").insert({ user_id: userId, ingredient: name.trim(), period_days: period, unit: "piece" }); if (error) toast.error("Could not add ingredient"); else setName(""); await qc.invalidateQueries({ queryKey: ["groceries"] }); }}><Input aria-label="Custom ingredient" placeholder="Add an ingredient" value={name} maxLength={120} onChange={e => setName(e.target.value)} /><Button type="submit" size="icon" title="Add ingredient"><Plus /></Button></form>
  </section>;
}