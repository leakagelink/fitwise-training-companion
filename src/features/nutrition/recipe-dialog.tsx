import { Clock, ChefHat } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Meal } from "./model";

export function RecipeDialog({ meal, close }: { meal: Meal | null; close: () => void }) {
  return <Dialog open={!!meal} onOpenChange={o => !o && close()}><DialogContent className="max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>{meal?.name}</DialogTitle></DialogHeader>{meal && <div className="space-y-5">
    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground"><span className="flex items-center gap-2"><Clock className="size-4" /> Prep {meal.prep_minutes} min</span><span className="flex items-center gap-2"><ChefHat className="size-4" /> Cook {meal.cook_minutes} min</span></div>
    <p className="text-sm">{meal.quantity} · {Math.round(meal.nutrition.calories)} kcal · {meal.nutrition.protein} g protein · {meal.nutrition.carbs} g carbs · {meal.nutrition.fat} g fat · {meal.nutrition.fiber} g fiber <span className="text-muted-foreground">(estimates)</span></p>
    <section><h3 className="font-semibold">Ingredients</h3><ul className="mt-2 divide-y divide-border">{meal.ingredients.map((i, n) => <li key={n} className="flex justify-between gap-4 py-2 text-sm"><span>{i.name}</span><span>{i.quantity} {i.unit}</span></li>)}</ul></section>
    <section><h3 className="font-semibold">Cooking instructions</h3><ol className="mt-3 list-decimal space-y-3 pl-5 text-sm">{meal.instructions.map((s, i) => <li key={i}>{s}</li>)}</ol></section>
    <section><h3 className="font-semibold">Alternatives</h3><ul className="mt-2 space-y-2 text-sm text-muted-foreground">{meal.alternatives.map((s, i) => <li key={i}>{s}</li>)}</ul></section>
    <p className="text-xs text-muted-foreground">Estimated vitamins &amp; minerals: {meal.micronutrients}</p><p className="text-xs text-muted-foreground">Nutrition is approximate. For allergies, check ingredient labels and avoid cross-contamination. Medical conditions need guidance from a qualified professional.</p>
  </div>}</DialogContent></Dialog>;
}