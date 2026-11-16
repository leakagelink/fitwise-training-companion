import { expect, it } from "vitest";
import { csvCell, operationSchema, requiredCapability } from "@/features/admin/operations-model";
it("restricts permission grants to administrators", () => { expect(requiredCapability("permission")).toBe("admin"); });
it("restricts broadcasts to administrators", () => { expect(requiredCapability("broadcast")).toBe("admin"); });
it("restricts privacy request decisions to privacy staff", () => { expect(requiredCapability("privacy_status")).toBe("privacy"); });
it("restricts support replies to support staff", () => { expect(requiredCapability("reply")).toBe("support"); });
it("rejects unsupported staff permissions", () => { expect(operationSchema.safeParse({ action: "permission", userId: "11111111-1111-4111-8111-111111111111", capability: "all", enabled: true }).success).toBe(false); });
it("rejects announcements without recipients", () => { expect(operationSchema.safeParse({ action: "broadcast", userIds: [], title: "Hello", body: "Test" }).success).toBe(false); });
it("neutralizes spreadsheet formulas", () => { expect(csvCell("=1+2")).toBe('"\'=1+2"'); expect(csvCell('a"b')).toBe('"a""b"'); });