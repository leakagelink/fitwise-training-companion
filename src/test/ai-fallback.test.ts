import { describe, expect, it, vi } from "vitest";
import { KEY_COOLDOWN_MS, resetKeyCooldowns, tryStarKeys, withFallback } from "@/lib/ai/fallback";

describe("AI STAR first, built-in AI as backup", () => {
  it("uses AI STAR when it answers", async () => {
    const builtIn = vi.fn(async () => "built-in");
    const result = await withFallback(async () => "star", builtIn);
    expect(result).toEqual({ value: "star", usedPrimary: true });
    expect(builtIn).not.toHaveBeenCalled();
  });

  it("switches to the built-in AI when AI STAR fails (e.g. tokens exhausted)", async () => {
    const onError = vi.fn();
    const result = await withFallback(async () => { throw Object.assign(new Error("exhausted"), { status: 402 }); }, async () => "built-in", onError);
    expect(result).toEqual({ value: "built-in", usedPrimary: false });
    expect(onError).toHaveBeenCalledOnce();
  });

  it("uses the built-in AI when no AI STAR key is set", async () => {
    const result = await withFallback(null, async () => "built-in");
    expect(result.usedPrimary).toBe(false);
  });
});

describe("AI STAR key failover", () => {
  const exhausted = () => Object.assign(new Error("token allowance exhausted"), { status: 402 });

  it("moves to the next key when the first key's tokens run out", async () => {
    resetKeyCooldowns();
    const run = vi.fn(async (key: string) => { if (key === "old") throw exhausted(); return `answer from ${key}`; });
    const result = await tryStarKeys(["old", "new"], ["cheap"], run);
    expect(result.value).toBe("answer from new");
    expect(result.key).toBe("new");
  });

  it("skips an exhausted key on the next request instead of trying it again", async () => {
    resetKeyCooldowns();
    const run = vi.fn(async (key: string) => { if (key === "old") throw exhausted(); return key; });
    await tryStarKeys(["old", "new"], ["cheap"], run);
    run.mockClear();
    await tryStarKeys(["old", "new"], ["cheap"], run);
    expect(run).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledWith("new", "cheap");
  });

  it("retries the exhausted key after the cooldown (e.g. tokens were added)", async () => {
    resetKeyCooldowns();
    let clock = 0;
    const now = () => clock;
    await tryStarKeys(["old", "new"], ["cheap"], async (key) => { if (key === "old") throw exhausted(); return key; }, { now });
    clock = KEY_COOLDOWN_MS + 1;
    const result = await tryStarKeys(["old", "new"], ["cheap"], async (key) => key, { now });
    expect(result.key).toBe("old");
  });

  it("tries the backup model on the same key when a model errors", async () => {
    resetKeyCooldowns();
    const run = vi.fn(async (_key: string, model: string) => { if (model === "a") throw Object.assign(new Error("bad"), { status: 500 }); return model; });
    const result = await tryStarKeys(["k"], ["a", "b"], run);
    expect(result).toMatchObject({ key: "k", model: "b" });
  });

  it("fails (so the built-in AI answers) when every key is exhausted", async () => {
    resetKeyCooldowns();
    await expect(tryStarKeys(["a", "b"], ["m"], async () => { throw exhausted(); })).rejects.toThrow("exhausted");
  });

  it("stops retrying once part of an answer was already shown", async () => {
    resetKeyCooldowns();
    const run = vi.fn(async () => { throw new Error("stream broke"); });
    await expect(tryStarKeys(["a", "b"], ["m"], run, { stopRetrying: () => true })).rejects.toThrow("stream broke");
    expect(run).toHaveBeenCalledTimes(1);
  });
});
