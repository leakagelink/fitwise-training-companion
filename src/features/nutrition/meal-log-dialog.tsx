import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { emptyNutrition, type Nutrients } from "./model";
import { analyzeFood, type FoodScan } from "./food-scan.functions";
import { toast } from "sonner";
import { todayISO } from "@/lib/fitness";
import { PhotoPicker } from "@/components/photo-picker";

const VERDICT = { good: "Good choice", moderate: "Moderate choice", avoid_frequently: "Avoid frequently" } as const;

function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { const max = 1024; const k = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement("canvas"); c.width = img.width * k; c.height = img.height * k; c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(img.src); resolve(c.toDataURL("image/jpeg", 0.8)); };
    img.onerror = reject; img.src = URL.createObjectURL(file);
  });
}

export function MealLogDialog({ open, close, save }: { open: boolean; close: () => void; save: (name: string, type: string, nutrition: Nutrients) => Promise<void> }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("Snack");
  const [nutrition, setNutrition] = useState<Nutrients>({ ...emptyNutrition });
  const [busy, setBusy] = useState(false);
  const [qty, setQty] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState("");
  const [scan, setScan] = useState<FoodScan | null>(null);
  const [scanning, setScanning] = useState(false);
  async function runScan() {
    setScanning(true);
    try {
      const r = await analyzeFood({ data: { name, quantity: qty, image, date: todayISO() } });
      if (r.status !== "ok") { toast.error(r.message); return; }
      setScan(r.result); if (!name.trim()) setName(r.result.name.slice(0, 120));
      setNutrition(Object.fromEntries(Object.entries(r.result.nutrition).map(([k, v]) => [k, Math.max(0, Math.round(v * 10) / 10)])) as Nutrients);
    } catch { toast.error("Could not analyse this food. Try again."); } finally { setScanning(false); }
  }
  return <Dialog open={open} onOpenChange={o => !o && close()}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Log a meal</DialogTitle></DialogHeader><form className="space-y-4" onSubmit={async e => { e.preventDefault(); setBusy(true); try { await save(name, type, nutrition); setName(""); setQty(""); setImage(null); setPhotoName(""); setScan(null); setNutrition({ ...emptyNutrition }); close(); } finally { setBusy(false); } }}>
    <label className="block space-y-2 text-sm"><span>Meal name</span><Input required aria-label="Meal name" value={name} maxLength={120} onChange={e => setName(e.target.value)} /></label>
    <div className="space-y-3 rounded-lg border border-border p-3">
      <p className="text-sm font-medium">Track your food — photo or name</p>
      <label className="block space-y-1 text-sm"><span>Quantity</span><Input aria-label="Quantity" placeholder="e.g. 2 roti, 1 bowl, 150 g" value={qty} maxLength={100} onChange={e => setQty(e.target.value)} /></label>
      <PhotoPicker label="Food photo (optional)" fileName={photoName} disabled={scanning || busy} onChange={async file => { try { setImage(await resizeImage(file)); setPhotoName(file.name); setScan(null); } catch { toast.error("Could not read this photo"); } }} />
      {image && <img src={image} alt="Selected food" className="h-32 w-full rounded-md object-cover" />}
      <Button type="button" variant="secondary" className="w-full" disabled={scanning || (!name.trim() && !image)} onClick={runScan}>{scanning ? "Checking…" : "Get nutrition details"}</Button>
      {scan && <div className="space-y-2 text-sm"><p className="font-medium">{scan.name} · {scan.quantity}</p>
        {scan.ingredients.length > 0 && <p className="text-xs text-muted-foreground">Ingredients: {scan.ingredients.join(", ")}</p>}
        <p><span className={scan.score.verdict === "good" ? "rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground" : scan.score.verdict === "moderate" ? "rounded-full bg-energy px-2 py-0.5 text-xs font-semibold text-background" : "rounded-full bg-destructive px-2 py-0.5 text-xs font-semibold text-destructive-foreground"}>{VERDICT[scan.score.verdict]}</span> <span className="text-xs text-muted-foreground">{scan.score.highProtein ? "High protein" : "Low protein"}</span></p>
        <div className="grid grid-cols-3 gap-2 text-center">{([["Nutrition", scan.score.nutrition], ["Protein", scan.score.protein], ["Health", scan.score.health]] as const).map(([l, v]) => <div key={l} className="rounded-md bg-secondary p-2"><p className="text-lg font-bold">{v}</p><p className="text-xs text-muted-foreground">{l} score</p></div>)}</div>
        <p className="text-xs">{scan.score.fitsToday ? `✓ Fits your plan — ${scan.remainingCalories} kcal left today.` : `✗ This is more than the ${scan.remainingCalories} kcal you have left today.`}</p>
        {scan.improvement && <p className="text-xs"><span className="font-semibold">Tip:</span> {scan.improvement}</p>}<div className="grid grid-cols-2 gap-x-4 gap-y-1">{scan.micronutrients.map(m => <div key={m.name} className="flex justify-between gap-2"><span className="text-muted-foreground">{m.name}</span><span>{Math.round(m.amount * 10) / 10} {m.unit}</span></div>)}</div><p className="text-xs text-muted-foreground">{scan.note} Values are estimates.</p></div>}
    </div>
    <label className="block space-y-2 text-sm"><span>Meal type</span><select aria-label="Meal type" value={type} onChange={e => setType(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3">{["Breakfast", "Lunch", "Dinner", "Snack"].map(t => <option key={t}>{t}</option>)}</select></label>
    <div className="grid grid-cols-2 gap-3">{Object.keys(nutrition).map(key => <label key={key} className="space-y-1 text-sm capitalize"><span>{key} {key === "calories" ? "(kcal)" : "(g)"}</span><Input aria-label={`Logged ${key}`} required type="number" min={0} max={10000} step={0.1} value={nutrition[key as keyof Nutrients]} onChange={e => setNutrition({ ...nutrition, [key]: Number(e.target.value) })} /></label>)}</div>
    <p className="text-xs text-muted-foreground">Enter estimates for the portion you ate, or use values from the food label.</p><Button type="submit" className="w-full" disabled={busy}>{busy ? "Saving…" : "Save meal"}</Button>
  </form></DialogContent></Dialog>;
}