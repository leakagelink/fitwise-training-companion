import { z } from "zod";

export const nutrientsSchema = z.object({ calories: z.number(), protein: z.number(), carbs: z.number(), fat: z.number(), fiber: z.number() });
export const mealSchema = z.object({
  name: z.string(), type: z.string(), time: z.string(), quantity: z.string(),
  nutrition: nutrientsSchema,
  micronutrients: z.string(), alternatives: z.array(z.string()),
  ingredients: z.array(z.object({ name: z.string(), quantity: z.number(), unit: z.string(), category: z.string() })),
  instructions: z.array(z.string()), prep_minutes: z.number(), cook_minutes: z.number(),
});
export const dietSchema = z.object({ name: z.string(), days: z.array(z.object({ meals: z.array(mealSchema) })) });
export type Nutrients = z.infer<typeof nutrientsSchema>;
export type Meal = z.infer<typeof mealSchema>;
export type Diet = z.infer<typeof dietSchema>;
export const emptyNutrition: Nutrients = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
export function totalNutrition(items: Nutrients[]): Nutrients {
  return items.reduce((sum, n) => ({ calories: sum.calories + n.calories, protein: sum.protein + n.protein, carbs: sum.carbs + n.carbs, fat: sum.fat + n.fat, fiber: sum.fiber + n.fiber }), { ...emptyNutrition });
}
export function scaleMeal(meal: Meal, factor: number): Meal {
  return { ...meal, nutrition: Object.fromEntries(Object.entries(meal.nutrition).map(([k, v]) => [k, Math.round(v * factor * 10) / 10])) as Nutrients, ingredients: meal.ingredients.map(i => ({ ...i, quantity: Math.round(i.quantity * factor * 10) / 10 })), quantity: `${factor} × ${meal.quantity}` };
}
export function groceryForDays(days: Diet["days"], count: number) {
  const items = new Map<string, { ingredient: string; quantity: number; unit: string; category: string; per_meal: string }>();
  if (!days.length) return [];
  for (let d = 0; d < count; d++) {
    for (const meal of days[d % days.length]?.meals ?? []) for (const i of meal.ingredients) {
      const key = `${i.name.trim().toLowerCase()}|${i.unit.trim().toLowerCase()}`;
      const current = items.get(key);
      if (current) current.quantity += i.quantity;
      else items.set(key, { ingredient: i.name, quantity: i.quantity, unit: i.unit, category: i.category, per_meal: `${i.quantity} ${i.unit} · ${meal.name}` });
    }
  }
  return [...items.values()].map(i => ({ ...i, quantity: Math.round(i.quantity * 10) / 10 }));
}
const allergens = {
  Dairy: ["milk", "yogurt", "yoghurt", "cheese", "paneer", "butter", "cream", "whey", "ghee"],
  Gluten: ["wheat", "bread", "pasta", "semolina", "barley", "rye", "roti", "chapati", "couscous"],
  Peanuts: ["peanut", "groundnut"], "Tree nuts": ["almond", "walnut", "cashew", "pistachio", "pecan", "hazelnut"],
  Soy: ["soy", "tofu", "tempeh", "edamame"], Eggs: ["egg"], Shellfish: ["shrimp", "prawn", "crab", "lobster", "mussel"], Fish: ["fish", "salmon", "tuna", "cod", "sardine"],
};
export function mealFitsDiet(meal: Meal, diet: string | null, allergies: string[]) {
  const text = [meal.name, ...meal.ingredients.map(i => i.name), ...meal.instructions, ...meal.alternatives].join(" ").toLowerCase();
  const banned = allergies.flatMap(a => allergens[a as keyof typeof allergens] ?? [a.toLowerCase()]);
  if (diet !== "non_vegetarian") banned.push("chicken", "beef", "pork", "lamb", "turkey", "bacon", "gelatin", ...allergens.Fish, ...allergens.Shellfish);
  if (diet === "vegan" || diet === "vegetarian") banned.push(...allergens.Eggs);
  if (diet === "vegan") banned.push(...allergens.Dairy, "honey");
  return !banned.some(word => new RegExp(`\\b${word}\\w*\\b`, "i").test(text));
}