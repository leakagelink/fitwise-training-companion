import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Heart, Loader2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { human } from "@/features/exercise-library/catalog";
import { exercisesQuery, useExercises } from "@/features/exercise-library/use-exercises";
import { ScreenLoadError, ScreenNotFound } from "@/components/screen-load-state";
import { Attribution, ExerciseImage } from "@/features/exercise-library/exercise-image";

export const Route = createFileRoute("/_authenticated/_app/exercises/")({
  head: () => ({ meta: [{ title: "Exercise Library — Fitness AI" }, { name: "description", content: "Search 700+ illustrated exercises." }, { property: "og:title", content: "Exercise Library — Fitness AI" }, { property: "og:description", content: "Search 700+ illustrated exercises." }] }),
  component: Library,
  loader: ({ context }) => context.queryClient.ensureQueryData(exercisesQuery),
  errorComponent: ScreenLoadError,
  notFoundComponent: ScreenNotFound,
});

const ALL = "all";

function Library() {
  const { data: exercises, isLoading } = useExercises();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [muscle, setMuscle] = useState(ALL);
  const [equip, setEquip] = useState(ALL);
  const [diff, setDiff] = useState(ALL);
  const [favOnly, setFavOnly] = useState(false);
  const [limit, setLimit] = useState(48);
  const favs = useQuery({
    queryKey: ["favorites"],
    queryFn: async () => new Set(((await supabase.from("user_favorites").select("exercise_id")).data ?? []).map((r) => r.exercise_id)),
  });

  const { muscles, equipment } = useMemo(() => {
    const m = new Set<string>(), e = new Set<string>();
    for (const x of exercises ?? []) { x.primary.forEach((p) => m.add(p)); e.add(x.equipment ?? "bodyweight"); }
    return { muscles: [...m].sort(), equipment: [...e].sort() };
  }, [exercises]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (exercises ?? []).filter((x) =>
      (!s || x.name.toLowerCase().includes(s)) &&
      (muscle === ALL || x.primary.includes(muscle) || x.secondary.includes(muscle)) &&
      (equip === ALL || (x.equipment ?? "bodyweight") === equip) &&
      (diff === ALL || x.difficulty === diff) &&
      (!favOnly || favs.data?.has(x.id)),
    );
  }, [exercises, q, muscle, equip, diff, favOnly, favs.data]);

  async function toggleFav(id: string) {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    if (favs.data?.has(id)) await supabase.from("user_favorites").delete().eq("exercise_id", id);
    else await supabase.from("user_favorites").insert({ user_id: auth.user.id, exercise_id: id });
    qc.invalidateQueries({ queryKey: ["favorites"] });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-5 py-6">
      <div>
        <Link to="/workout" className="text-sm text-muted-foreground hover:text-foreground">← Workout</Link>
        <h1 className="mt-2 text-3xl font-bold">Exercise library</h1>
      </div>
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search exercises" value={q} onChange={(e) => setQ(e.target.value)} className="h-11 rounded-full pl-10" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Filter value={muscle} onChange={setMuscle} placeholder="Muscle" options={muscles} />
        <Filter value={equip} onChange={setEquip} placeholder="Equipment" options={equipment} />
        <Filter value={diff} onChange={setDiff} placeholder="Difficulty" options={["beginner", "intermediate", "advanced"]} />
        <button onClick={() => setFavOnly(!favOnly)} className={cn("flex items-center gap-1.5 rounded-full border px-4 text-sm", favOnly ? "border-primary bg-accent text-accent-foreground" : "border-border")}>
          <Heart className="size-4" /> Favorites
        </button>
      </div>
      {isLoading ? <Loader2 className="mx-auto size-6 animate-spin text-primary" /> : (
        <>
          <p className="text-sm text-muted-foreground">{list.length} exercises</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {list.slice(0, limit).map((x) => (
              <div key={x.id} className="card-premium relative overflow-hidden p-2">
                <Link to="/exercises/$exerciseId" params={{ exerciseId: x.id }}>
                  <ExerciseImage file={x.start} alt={x.name} />
                  <p className="mt-2 px-1 text-sm font-semibold leading-tight">{x.name}</p>
                  <p className="px-1 pb-1 text-xs text-muted-foreground">{human(x.primary[0])} · {human(x.equipment)}</p>
                </Link>
                <button onClick={() => toggleFav(x.id)} aria-label="Favorite" className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-background/80">
                  <Heart className={cn("size-4", favs.data?.has(x.id) && "fill-primary text-primary")} />
                </button>
              </div>
            ))}
          </div>
          {list.length > limit && (
            <button onClick={() => setLimit(limit + 48)} className="mx-auto block rounded-full bg-secondary px-6 py-2.5 text-sm font-medium">Load more</button>
          )}
        </>
      )}
      <Attribution />
    </div>
  );
}

function Filter({ value, onChange, placeholder, options }: { value: string; onChange: (v: string) => void; placeholder: string; options: string[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-10 w-auto min-w-36 rounded-full"><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>All {placeholder.toLowerCase()}</SelectItem>
        {options.map((o) => <SelectItem key={o} value={o}>{human(o)}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
