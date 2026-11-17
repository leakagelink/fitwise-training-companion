import { useEffect, useRef, useState } from "react";
import logoAsset from "@/assets/fitnessai-logo.png.asset.json";

export function SplashScreen({ startup = false }: { startup?: boolean }) {
  const [visible, setVisible] = useState(true);
  const image = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!startup) return;
    let active = true;
    let frame = 0;
    const ready = image.current?.decode() ?? Promise.resolve();
    void ready.catch(() => undefined).then(() => {
      if (!active) return;
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => { if (active) setVisible(false); });
      });
    });
    return () => { active = false; cancelAnimationFrame(frame); };
  }, [startup]);

  if (!visible) return null;
  return <div role="status" aria-label="Opening FitnessAI" className="fixed inset-0 z-50 grid place-items-center bg-background p-8">
    <img ref={image} src={logoAsset.url} alt="FitnessAI — Your AI Fitness Coach" width={288} height={288}
      fetchPriority="high" className="aspect-square w-72 max-w-full object-contain" />
  </div>;
}