import { cn } from "@/lib/utils";
import logoAsset from "@/assets/fitnessai-logo.png.asset.json";

export function Logo({ className }: { className?: string }) {
  return (
    <img src={logoAsset.url} alt="FitnessAI" width={64} height={64}
      className={cn("size-16 shrink-0 object-contain", className)} />
  );
}
