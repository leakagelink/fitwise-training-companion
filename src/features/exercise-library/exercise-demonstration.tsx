import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExerciseImage } from "./exercise-image";
import { exerciseMotion } from "./motion";
import type { Exercise } from "./catalog";

export function ExerciseDemonstration({ exercise }: { exercise: Exercise }) {
  const media = exerciseMotion(exercise.id);
  const video = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    setFailed(false);
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      void video.current?.play().catch(() => setPlaying(false));
    }
    const element = video.current;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) element?.pause();
    });
    if (element) observer.observe(element);
    return () => observer.disconnect();
  }, [exercise.id]);

  if (!media || failed) {
    return (
      <div className={exercise.peak ? "grid grid-cols-2 gap-3" : "mx-auto max-w-xs"}>
        <figure>
          <ExerciseImage file={exercise.start} alt={`${exercise.name} start position`} />
          <figcaption className="mt-1 text-center text-xs text-muted-foreground">Start position</figcaption>
        </figure>
        {exercise.peak && <figure>
          <ExerciseImage file={exercise.peak} alt={`${exercise.name} peak position`} />
          <figcaption className="mt-1 text-center text-xs text-muted-foreground">Peak position</figcaption>
        </figure>}
      </div>
    );
  }

  return (
    <figure className="space-y-2">
      <video key={exercise.id} ref={video} src={media.video} poster={media.poster}
        aria-label={`${exercise.name} demonstration`} loop muted playsInline preload="metadata"
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => setFailed(true)}
        className="aspect-video max-h-96 w-full rounded-lg bg-surface object-contain" />
      <div className="flex items-center justify-between gap-3">
        <figcaption className="text-xs text-muted-foreground">
          <a className="underline" href={media.sourceUrl} target="_blank" rel="noreferrer">Video: {media.author} / wger</a>
          {" · "}<a className="underline" href={media.licenseUrl} target="_blank" rel="noreferrer">CC BY-SA 4.0</a>
          {" · Resized, silent"}
        </figcaption>
        <Button variant="outline" size="icon" aria-label={playing ? "Pause demonstration" : "Play demonstration"}
          title={playing ? "Pause demonstration" : "Play demonstration"}
          onClick={() => {
            if (playing) video.current?.pause();
            else void video.current?.play().catch(() => setPlaying(false));
          }}>
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        </Button>
      </div>
    </figure>
  );
}