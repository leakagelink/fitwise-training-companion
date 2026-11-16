export function normalizePhone(countryCode: string, number: string) {
  const code = countryCode.trim().replace(/\s/g, "");
  const digits = number.replace(/[\s()-]/g, "");
  const phone = digits.startsWith("+") ? digits : `${code}${digits}`;
  return /^\+[1-9]\d{7,14}$/.test(phone) ? phone : null;
}
export function validSmsCode(code: string) {
  return /^\d{6}$/.test(code);
}