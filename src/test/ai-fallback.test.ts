import { describe, expect, it, vi } from "vitest";
import { withFallback } from "@/lib/ai/fallback";

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
