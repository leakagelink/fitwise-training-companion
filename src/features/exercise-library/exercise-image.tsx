import { cn } from "@/lib/utils";
import { imageUrl } from "./catalog";

export function ExerciseImage({ file, alt, className }: { file: string; alt: string; className?: string }) {
  return (
    <img
      src={imageUrl(file)}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={cn("aspect-square w-full rounded-xl bg-[oklch(0.97_0_0)] object-contain", className)}
    />
  );
}

export function Attribution() {
  return (
    <p className="text-xs text-muted-foreground">
      Exercise data by{" "}
      <a href="https://repdb.co" rel="nofollow noreferrer" target="_blank" className="underline">
        RepDB (repdb.co)
      </a>
      . Illustrations are static images, not animated demonstrations.
    </p>
  );
}
