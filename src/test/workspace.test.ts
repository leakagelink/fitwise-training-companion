import { describe, expect, it, vi } from "vitest";
vi.mock("@/features/admin/admin.functions", () => ({ getAdminIdentity: vi.fn() }));
import { workspaceDestination } from "@/features/account/workspace";

describe("login workspace", () => {
  it("sends administrators only to the admin panel", () => {
    expect(workspaceDestination(true)).toBe("/admin");
  });
  it("keeps ordinary users in the user app", () => {
    expect(workspaceDestination(false)).toBe("/home");
  });
});