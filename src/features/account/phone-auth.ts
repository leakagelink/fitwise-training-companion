export function normalizePhone(countryCode: string, number: string) {
  const code = countryCode.trim().replace(/\s/g, "");
  const digits = number.replace(/[\s()-]/g, "");
  const phone = digits.startsWith("+") ? digits : `${code}${digits}`;
  return /^\+[1-9]\d{7,14}$/.test(phone) ? phone : null;
}
/** SMS provider only delivers to Indian mobiles: returns +91XXXXXXXXXX or null. */
export function indianMobile(input: string) {
  const d = input.replace(/[\s()+-]/g, "");
  const ten = d.length === 12 && d.startsWith("91") ? d.slice(2) : d.length === 11 && d.startsWith("0") ? d.slice(1) : d;
  return /^[6-9]\d{9}$/.test(ten) ? `+91${ten}` : null;
}
export const OTP_LIMITS = { ttlMs: 10 * 60_000, cooldownMs: 60_000, windowMs: 60 * 60_000, maxPerWindow: 5, maxAttempts: 5 };
export function validSmsCode(code: string) {
  return /^\d{6}$/.test(code);
}
