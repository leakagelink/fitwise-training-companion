export function bodyFieldError(value: string, unit: string, min: number, max: number) {
  if (!value.trim()) return `Enter a value between ${min} and ${max} ${unit}.`;
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max
    ? null
    : `Must be between ${min} and ${max} ${unit}.`;
}
export function bodyErrors(body: { height_cm: string; weight_kg: string; target_weight_kg: string }) {
  return {
    height_cm: bodyFieldError(body.height_cm, "cm", 100, 250),
    weight_kg: bodyFieldError(body.weight_kg, "kg", 30, 300),
    target_weight_kg: bodyFieldError(body.target_weight_kg, "kg", 30, 300),
  };
}