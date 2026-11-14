import { describe, expect, it, vi } from "vitest";
import { createAppQueryClient, createCacheIdentityGuard } from "@/lib/query-cache";

describe("Screen cache", () => {
  it("reuses a fresh screen read across repeat visits", async () => {
    const client = createAppQueryClient();
    const read = vi.fn(async () => ({ water: 250 }));
    const query = { queryKey: ["checkins"], queryFn: read };
    await client.ensureQueryData(query);
    await client.fetchQuery(query);
    expect(read).toHaveBeenCalledTimes(1);
    client.clear();
  });

  it("reads new saved values after invalidation", async () => {
    const client = createAppQueryClient();
    let water = 250;
    const query = { queryKey: ["checkins"], queryFn: async () => water };
    await client.fetchQuery(query);
    water = 500;
    await client.invalidateQueries({ queryKey: ["checkins"] });
    expect(await client.fetchQuery(query)).toBe(500);
    client.clear();
  });

  it("clears private data on sign-out and on account switching", () => {
    const client = createAppQueryClient();
    const identity = createCacheIdentityGuard(client);
    identity("first-user");
    client.setQueryData(["profile"], { name: "First" });
    identity("first-user");
    expect(client.getQueryData(["profile"])).toEqual({ name: "First" });
    identity("second-user");
    expect(client.getQueryData(["profile"])).toBeUndefined();
    client.setQueryData(["meal-logs"], ["private meal"]);
    identity(null);
    expect(client.getQueryCache().getAll()).toHaveLength(0);
  });

  it("isolates caches between router instances", () => {
    const first = createAppQueryClient();
    const second = createAppQueryClient();
    first.setQueryData(["profile"], "private");
    expect(second.getQueryData(["profile"])).toBeUndefined();
    first.clear();
    second.clear();
  });
});
