import { describe, expect, it, vi } from "vitest";
import { handleNativeBack, registerNativeBack } from "@/lib/native-back";

describe("Android Back navigation", () => {
  it("returns to the previous app screen when an app history entry exists", () => {
    const back = vi.fn();
    handleNativeBack({ canGoBack: () => true, back }, true);
    expect(back).toHaveBeenCalledTimes(1);
  });
  it("stays in the app at the first screen, even when native history has an outside entry", () => {
    const back = vi.fn();
    handleNativeBack({ canGoBack: () => false, back }, true);
    expect(back).not.toHaveBeenCalled();
  });
  it("does not navigate when the native webview has no previous screen", () => {
    const back = vi.fn();
    handleNativeBack({ canGoBack: () => true, back }, false);
    expect(back).not.toHaveBeenCalled();
  });
  it("does not intercept normal browser navigation", async () => {
    expect(await registerNativeBack({ canGoBack: () => true, back: vi.fn() })).toBeUndefined();
  });
});