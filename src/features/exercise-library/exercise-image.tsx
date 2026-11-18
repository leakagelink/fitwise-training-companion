import { cn } from "@/lib/utils";
import { imageUrl } from "./catalog";

export function ExerciseImage({ file, alt, className }: { file: string; alt: string; className?: string }) {
  return (
    <img
      src={imageUrl(file)}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={cn("aspect-square w-full rounded-xl bg-surface object-contain", className)}
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
      . Video demonstrations: Goulart / wger, CC BY-SA 4.0.
      {" "}<a href="/exercise-media-credits.txt" className="underline" target="_blank" rel="noreferrer">Media credits</a>
    </p>
  );
}
