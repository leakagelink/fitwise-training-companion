import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { emptyNutrition, type Nutrients } from "./model";

export function MealLogDialog({ open, close, save }: { open: boolean; close: () => void; save: (name: string, type: string, nutrition: Nutrients) => Promise<void> }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("Snack");
  const [nutrition, setNutrition] = useState<Nutrients>({ ...emptyNutrition });
  const [busy, setBusy] = useState(false);
  return <Dialog open={open} onOpenChange={o => !o && close()}><DialogContent><DialogHeader><DialogTitle>Log a meal</DialogTitle></DialogHeader><form className="space-y-4" onSubmit={async e => { e.preventDefault(); setBusy(true); try { await save(name, type, nutrition); setName(""); setNutrition({ ...emptyNutrition }); close(); } finally { setBusy(false); } }}>
    <label className="block space-y-2 text-sm"><span>Meal name</span><Input required aria-label="Meal name" value={name} maxLength={120} onChange={e => setName(e.target.value)} /></label>
    <label className="block space-y-2 text-sm"><span>Meal type</span><select aria-label="Meal type" value={type} onChange={e => setType(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3">{["Breakfast", "Lunch", "Dinner", "Snack"].map(t => <option key={t}>{t}</option>)}</select></label>
    <div className="grid grid-cols-2 gap-3">{Object.keys(nutrition).map(key => <label key={key} className="space-y-1 text-sm capitalize"><span>{key} {key === "calories" ? "(kcal)" : "(g)"}</span><Input aria-label={`Logged ${key}`} required type="number" min={0} max={10000} step={0.1} value={nutrition[key as keyof Nutrients]} onChange={e => setNutrition({ ...nutrition, [key]: Number(e.target.value) })} /></label>)}</div>
    <p className="text-xs text-muted-foreground">Enter estimates for the portion you ate, or use values from the food label.</p><Button type="submit" className="w-full" disabled={busy}>{busy ? "Saving…" : "Save meal"}</Button>
  </form></DialogContent></Dialog>;
}