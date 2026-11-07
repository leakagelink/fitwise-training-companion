import { describe, it, expect } from "vitest";
import { groceryForDays, mealFitsDiet, scaleMeal, totalNutrition, type Meal } from "@/features/nutrition/model";
const meal: Meal = { name: "Chickpea bowl", type: "Lunch", time: "13:00", quantity: "1 bowl", nutrition: { calories: 500, protein: 20, carbs: 60, fat: 15, fiber: 10 }, micronutrients: "Iron 4 mg", alternatives: ["Lentil bowl"], ingredients: [{ name: "Chickpeas", quantity: 100, unit: "g", category: "Legumes" }], instructions: ["Cook chickpeas and serve."], prep_minutes: 10, cook_minutes: 20 };
describe("dietary restrictions", () => {
  it("vegetarian meals exclude meat", () => { expect(mealFitsDiet({ ...meal, ingredients: [{ name: "Chicken", quantity: 100, unit: "g", category: "Protein" }] }, "vegetarian", [])).toBe(false); });
  it("vegan meals exclude dairy", () => { expect(mealFitsDiet({ ...meal, ingredients: [{ name: "Paneer", quantity: 100, unit: "g", category: "Dairy" }] }, "vegan", [])).toBe(false); });
  it("allergic users cannot receive peanuts in alternatives", () => { expect(mealFitsDiet({ ...meal, alternatives: ["Peanut bowl"] }, "vegetarian", ["Peanuts"])).toBe(false); });
  it("eggetarian meals may include eggs", () => { expect(mealFitsDiet({ ...meal, name: "Egg bowl" }, "eggetarian", [])).toBe(true); });
});
describe("nutrition quantities", () => {
  it("editing quantity scales ingredient amounts and nutrition", () => { const scaled = scaleMeal(meal, 2); expect(scaled.nutrition.calories).toBe(1000); expect(scaled.ingredients[0]?.quantity).toBe(200); expect(meal.nutrition.calories).toBe(500); });
  it("daily totals include consumed fiber and all macros", () => { expect(totalNutrition([meal.nutrition, meal.nutrition])).toEqual({ calories: 1000, protein: 40, carbs: 120, fat: 30, fiber: 20 }); });
  it("weekly groceries aggregate seven days", () => { expect(groceryForDays([{ meals: [meal] }], 7)[0]?.quantity).toBe(700); });
  it("monthly groceries aggregate thirty days", () => { expect(groceryForDays([{ meals: [meal] }], 30)[0]?.quantity).toBe(3000); });
});