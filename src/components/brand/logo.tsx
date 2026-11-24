import { cn } from "@/lib/utils";
import logoAsset from "@/assets/muscles-zone-logo.jpeg.asset.json";

export function Logo({ className }: { className?: string }) {
  return (
    <img src={logoAsset.url} alt="Muscles Zone" width={64} height={64}
      className={cn("size-16 shrink-0 object-contain", className)} />
  );
}
