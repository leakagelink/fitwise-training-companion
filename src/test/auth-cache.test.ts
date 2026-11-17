import { describe, expect, it, vi } from "vitest";
const { getUser } = vi.hoisted(() => ({ getUser: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { getUser } } }));
import { authenticatedUserQuery } from "@/features/account/auth-query";
import { createAppQueryClient, createCacheIdentityGuard } from "@/lib/query-cache";

describe("Navigation identity cache", () => {
  it("shares a verified user across rapid navigation and clears it on sign-out", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "first" } }, error: null });
    const client = createAppQueryClient();
    await client.fetchQuery(authenticatedUserQuery);
    await client.fetchQuery(authenticatedUserQuery);
    expect(getUser).toHaveBeenCalledTimes(1);
    const guard = createCacheIdentityGuard(client);
    guard("first");
    guard(null);
    expect(client.getQueryData(["authenticated-user"])).toBeUndefined();
    client.clear();
  });
  it("rejects navigation when verification fails", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: new Error("Unavailable") });
    const client = createAppQueryClient();
    expect(await client.fetchQuery(authenticatedUserQuery)).toBeNull();
    client.clear();
  });
});