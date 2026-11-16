import { expect, it } from "vitest";
import { bodyErrors } from "@/features/onboarding/body-validation";
it("rejects the screenshot measurements", () => {
  const errors = bodyErrors({ height_cm: "12", weight_kg: "7.5", target_weight_kg: "15.6" });
  expect(errors.height_cm).not.toBeNull();
  expect(errors.weight_kg).not.toBeNull();
  expect(errors.target_weight_kg).not.toBeNull();
});
it("accepts valid body measurements", () => {
  expect(bodyErrors({ height_cm: "170", weight_kg: "75", target_weight_kg: "70" })).toEqual({ height_cm: null, weight_kg: null, target_weight_kg: null });
});
it("rejects missing measurements", () => {
  expect(bodyErrors({ height_cm: "", weight_kg: "", target_weight_kg: "" }).height_cm).not.toBeNull();
});