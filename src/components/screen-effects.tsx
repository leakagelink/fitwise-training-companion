import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

/** Fade the existing viewport without remounting pages or moving fixed navigation. */
export function ScreenEffects() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const viewport = document.querySelector(".app-viewport");
    const animation = viewport?.animate([{ opacity: 0.65 }, { opacity: 1 }], {
      duration: 260, easing: "ease-out",
    });
    return () => animation?.cancel();
  }, [pathname]);
  return null;
}