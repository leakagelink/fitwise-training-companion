import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { registerNativeBack } from "@/lib/native-back";

export function NativeNavigation() {
  const router = useRouter();
  useEffect(() => {
    let disposed = false;
    let remove: (() => Promise<void>) | undefined;
    void registerNativeBack(router.history).then((listener) => {
      if (!listener) return;
      if (disposed) void listener.remove();
      else remove = () => listener.remove();
    }).catch((error) => console.error("Android Back listener unavailable", error));
    return () => { disposed = true; void remove?.(); };
  }, [router]);
  return null;
}