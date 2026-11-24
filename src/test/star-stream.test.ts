import { afterEach, describe, expect, it, vi } from "vitest";
import { STAR_STREAM_TIMEOUT_MS, streamStarChat } from "@/lib/ai/star.server";

afterEach(() => vi.unstubAllGlobals());

describe("coach streamed response", () => {
  it("allows 90 seconds for the complete answer rather than cutting off at 25 seconds", async () => {
    const timeout = vi.spyOn(AbortSignal, "timeout");
    vi.stubGlobal("fetch", vi.fn(async () => new Response('data: {"choices":[{"delta":{"content":"Keep training."}}]}\n\ndata: [DONE]\n\n')));
    const parts = [];
    for await (const part of streamStarChat([], new AbortController().signal, "test-key", "test-model")) parts.push(part);
    expect(parts.join("")).toBe("Keep training.");
    expect(STAR_STREAM_TIMEOUT_MS).toBe(90_000);
    expect(timeout).toHaveBeenCalledWith(90_000);
    timeout.mockRestore();
  });

  it("does not treat a truncated partial answer as complete", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response('data: {"choices":[{"delta":{"content":"Partial"}}]}\n\n')));
    const consume = async () => { for await (const part of streamStarChat([], new AbortController().signal, "test-key", "test-model")) void part; };
    await expect(consume()).rejects.toThrow("before completion");
  });
});