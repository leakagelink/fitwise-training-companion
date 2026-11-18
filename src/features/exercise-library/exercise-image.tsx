import { useState } from "react";
import { cn } from "@/lib/utils";
import { imageUrl } from "./catalog";
import { exerciseGif } from "./gif-motion";

export function ExerciseImage({ file, alt, className }: { file: string; alt: string; className?: string | undefined }) {
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

/** List thumbnail: the reviewed animation when one exists, otherwise the still image. */
export function ExerciseThumb({
  exercise,
  className,
}: {
  exercise: { id: string; name: string; start: string };
  className?: string | undefined;
}) {
  const gif = exerciseGif(exercise.id);
  const [failed, setFailed] = useState(false);
  if (!gif || failed) return <ExerciseImage file={exercise.start} alt={exercise.name} className={className} />;
  return (
    <img
      src={gif.url}
      alt={`${exercise.name} animation`}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
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
      . Video demonstrations: Goulart / wger, CC BY-SA 4.0. Animations: ExerciseGymGifsDB.
      {" "}<a href="/exercise-media-credits.txt" className="underline" target="_blank" rel="noreferrer">Media credits</a>
    </p>
  );
}
