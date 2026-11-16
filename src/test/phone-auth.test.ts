import { expect, it } from "vitest";
import { normalizePhone, validSmsCode } from "@/features/account/phone-auth";
it("normalizes Indian numbers with a country code", () => { expect(normalizePhone("+91", "98765 43210")).toBe("+919876543210"); });
it("retains an explicit international number", () => { expect(normalizePhone("+91", "+44 7700 900123")).toBe("+447700900123"); });
it("rejects malformed phone numbers", () => { expect(normalizePhone("91", "9876543210")).toBeNull(); expect(normalizePhone("+91", "abc")).toBeNull(); });
it("accepts only six digit SMS codes", () => { expect(validSmsCode("123456")).toBe(true); expect(validSmsCode("12345")).toBe(false); expect(validSmsCode("abcdef")).toBe(false); });