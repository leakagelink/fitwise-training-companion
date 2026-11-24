import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { human } from "@/features/exercise-library/catalog";
import { exerciseMapQuery, useExerciseMap } from "@/features/exercise-library/use-exercises";
import { ScreenLoadError, ScreenNotFound } from "@/components/screen-load-state";
import { Attribution } from "@/features/exercise-library/exercise-image";
import { ExerciseDemonstration } from "@/features/exercise-library/exercise-demonstration";
import { startSession } from "@/features/workout/session";

export const Route = createFileRoute("/_authenticated/_app/exercises/$exerciseId")({
  head: () => ({
    meta: [
      { title: "Exercise — Muscles Zone" },
      { name: "description", content: "Exercise instructions and form tips." },
      { property: "og:title", content: "Exercise — Muscles Zone" },
      { property: "og:description", content: "Exercise instructions and form tips." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Detail,
  loader: ({ context }) => context.queryClient.ensureQueryData(exerciseMapQuery),
  errorComponent: ScreenLoadError,
  notFoundComponent: ScreenNotFound,
});

function Detail() {
  const { exerciseId } = Route.useParams();
  const { data: map, isLoading } = useExerciseMap();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const x = map?.get(exerciseId);
  if (isLoading) return <Loader2 className="mx-auto mt-20 size-6 animate-spin text-primary" />;
  if (!x) return <p className="p-10 text-center text-muted-foreground">Exercise not found.</p>;

  const reps = x.category === "stretching" ? "30s" : x.difficulty === "beginner" ? "10-12" : "8-10";

  async function start() {
    if (!x) return;
    setBusy(true);
    try {
      const id = await startSession(x.name, null, [{ exercise_id: x.id, sets: 3, reps }]);
      navigate({ to: "/session/$sessionId", params: { sessionId: id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-5 py-6">
      <Link to="/exercises" className="text-sm text-muted-foreground hover:text-foreground">
        ← Library
      </Link>
      <ExerciseDemonstration key={x.id} exercise={x} />
      <div>
        <h1 className="text-3xl font-bold">{x.name}</h1>
        <p className="mt-2 text-muted-foreground">{x.description}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Primary", x.primary.map(human).join(", ")],
          ["Secondary", x.secondary.map(human).join(", ") || "—"],
          ["Equipment", human(x.equipment)],
          ["Difficulty", human(x.difficulty)],
        ].map(([k, v]) => (
          <div key={k} className="rounded-2xl bg-surface p-3">
            <p className="text-xs text-muted-foreground">{k}</p>
            <p className="mt-1 text-sm font-medium">{v}</p>
          </div>
        ))}
      </div>
      <div className="card-premium p-5">
        <p className="text-sm text-muted-foreground">Suggested</p>
        <p className="font-display text-xl font-semibold">3 sets × {reps}</p>
      </div>
      <section>
        <h2 className="text-lg font-semibold">How to do it</h2>
        <ol className="mt-3 space-y-2.5">
          {x.instructions.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                {i + 1}
              </span>
              <span className="text-sm leading-relaxed">{s}</span>
            </li>
          ))}
        </ol>
      </section>
      {x.tips.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold">Form tips</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            {x.tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      )}
      <Button
        onClick={start}
        disabled={busy}
        className="h-12 w-full rounded-full text-base font-semibold"
      >
        <Play className="size-4" /> Start exercise
      </Button>
      <Attribution />
    </div>
  );
}
