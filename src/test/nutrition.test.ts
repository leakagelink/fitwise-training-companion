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
import { scoreMeal, weeklyNutritionReport } from "@/lib/fitness";
describe("meal scoring", () => {
  it("high-protein balanced meal is a good choice", () => {
    const s = scoreMeal({ calories: 500, protein: 40, fat: 15, fiber: 8 }, 2100, 1500);
    expect(s.verdict).toBe("good"); expect(s.highProtein).toBe(true); expect(s.fitsToday).toBe(true);
  });
  it("fatty low-protein large meal is avoid frequently and does not fit", () => {
    const s = scoreMeal({ calories: 1400, protein: 20, fat: 80, fiber: 2 }, 2100, 900);
    expect(s.verdict).toBe("avoid_frequently"); expect(s.highProtein).toBe(false); expect(s.fitsToday).toBe(false);
  });
  it("weekly report averages tracked days and counts adherence", () => {
    const d = (date: string, calories: number, protein: number, logged: number, missed: number) => ({ date, calories, protein, logged, missed });
    const r = weeklyNutritionReport([d("a", 2000, 120, 3, 0), d("b", 1000, 40, 1, 2), d("c", 0, 0, 0, 0), d("d", 0, 0, 0, 0), d("e", 0, 0, 0, 0), d("f", 0, 0, 0, 0), d("g", 0, 0, 0, 0)], 2000, 120);
    expect(r.avgCalories).toBe(1500); expect(r.adherence).toBe(67); expect(r.best[0]).toBe("a"); expect(r.improve).toContain("Miss fewer meals");
  });
});

import { dietConflict } from "@/features/nutrition/model";
describe("diet check false positives", () => {
  it("vegetarian plans may contain eggplant and eggless dishes", () => { expect(dietConflict("Baingan bharta with roasted eggplant, eggless besan cheela", "vegetarian", [])).toBeNull(); });
  it("vegetarian plans still reject real eggs and meat", () => {
    expect(dietConflict("Boiled eggs with toast", "vegetarian", [])).toBe("egg");
    expect(dietConflict("Mutton curry", "vegetarian", [])).toBe("mutton");
  });
  it("negated mentions are allowed but a later real mention is caught", () => {
    expect(dietConflict("Tofu scramble instead of eggs; no chicken", "vegetarian", [])).toBeNull();
    expect(dietConflict("Without eggs. Top with a fried egg", "vegetarian", [])).toBe("egg");
  });
  it("vegan allows coconut milk and peanut butter but not cow milk", () => {
    expect(dietConflict("Oats with coconut milk and peanut butter", "vegan", [])).toBeNull();
    expect(dietConflict("Oats with milk", "vegan", [])).toBe("milk");
  });
  it("peanut allergy still catches peanut butter", () => { expect(dietConflict("Toast with peanut butter", "vegetarian", ["Peanuts"])).toBe("peanut"); });
  it("dairy allergy allows dairy-free yogurt", () => { expect(dietConflict("Dairy-free coconut yogurt bowl", "vegetarian", ["Dairy"])).toBeNull(); });
});
