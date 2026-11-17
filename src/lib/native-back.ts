type BackHistory = { canGoBack: () => boolean; back: () => void };

/** Only traverse app-owned history; at its first entry, consume Back without exiting. */
export function handleNativeBack(history: BackHistory, nativeCanGoBack: boolean) {
  if (nativeCanGoBack && history.canGoBack()) history.back();
}

export async function registerNativeBack(history: BackHistory) {
  const { Capacitor } = await import("@capacitor/core");
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") return;
  const { App } = await import("@capacitor/app");
  return App.addListener("backButton", ({ canGoBack }) => {
    handleNativeBack(history, canGoBack);
  });
}