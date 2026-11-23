import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Check, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { Logo } from "@/components/brand/logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { ACTIVITY, ALLERGIES, DIETS, EQUIPMENT, EXPERIENCE, GENDERS, GOALS } from "@/features/onboarding/options";
import { bodyErrors } from "@/features/onboarding/body-validation";
import { workspaceQuery } from "@/features/account/workspace";

export const Route = createFileRoute("/_authenticated/onboarding")({
  beforeLoad: async ({ context }) => {
    const identity = await context.queryClient.fetchQuery(workspaceQuery);
    if (identity.isAdmin) throw redirect({ to: "/admin", replace: true });
  },
  head: () => ({
    meta: [
      { title: "Set up your profile — Fitness AI" },
      { name: "description", content: "Tell Fitness AI about yourself to personalize your plans." },
      { property: "og:title", content: "Set up your profile — Fitness AI" },
      { property: "og:description", content: "Personalize your Fitness AI plans." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Onboarding,
});

interface Form {
  consent: boolean;
  full_name: string;
  age: string;
  gender: string;
  height_cm: string;
  weight_kg: string;
  target_weight_kg: string;
  goal: string;
  diet_type: string;
  allergies: string[];
  food_preferences: string;
  medical_conditions: string;
  activity_level: string;
  workout_location: string;
  experience_level: string;
  equipment: string[];
  workout_frequency: number;
  workout_duration_min: number;
}

const STEPS = ["Consent", "About you", "Body", "Goal", "Food", "Lifestyle", "Training"];

function Choice({ selected, onClick, label, desc }: { selected: boolean; onClick: () => void; label: string; desc?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-left transition-colors",
        selected ? "border-primary bg-accent" : "border-border bg-surface hover:border-input",
      )}
    >
      <span>
        <span className="block font-medium">{label}</span>
        {desc && <span className="block text-sm text-muted-foreground">{desc}</span>}
      </span>
      {selected && <Check className="size-5 text-primary" />}
    </button>
  );
}

function Chip({ selected, onClick, label }: { selected: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2 text-sm transition-colors",
        selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface hover:border-input",
      )}
    >
      {label}
    </button>
  );
}

function Onboarding() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: profile, isLoading } = useProfile();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState<Form>({
    consent: false, full_name: "", age: "", gender: "", height_cm: "", weight_kg: "", target_weight_kg: "",
    goal: "", diet_type: "", allergies: [], food_preferences: "", medical_conditions: "", activity_level: "",
    workout_location: "", experience_level: "", equipment: [], workout_frequency: 3, workout_duration_min: 45,
  });

  useEffect(() => {
    if (!profile) return;
    setF((cur) => ({
      ...cur,
      consent: !!profile.health_consent_at,
      full_name: profile.full_name ?? "",
      age: profile.age?.toString() ?? "",
      gender: profile.gender ?? "",
      height_cm: profile.height_cm?.toString() ?? "",
      weight_kg: profile.weight_kg?.toString() ?? "",
      target_weight_kg: profile.target_weight_kg?.toString() ?? "",
      goal: profile.goal ?? "",
      diet_type: profile.diet_type ?? "",
      allergies: profile.allergies ?? [],
      food_preferences: profile.food_preferences ?? "",
      medical_conditions: profile.medical_conditions ?? "",
      activity_level: profile.activity_level ?? "",
      workout_location: profile.workout_location ?? "",
      experience_level: profile.experience_level ?? "",
      equipment: profile.equipment ?? [],
      workout_frequency: profile.workout_frequency ?? 3,
      workout_duration_min: profile.workout_duration_min ?? 45,
    }));
    if (profile.onboarded_at) setStep(1);
  }, [profile]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((c) => ({ ...c, [k]: v }));
  const toggle = (k: "allergies" | "equipment", v: string) =>
    setF((c) => ({ ...c, [k]: c[k].includes(v) ? c[k].filter((x) => x !== v) : [...c[k], v] }));

  const num = (s: string) => Number(s);
  const bodyValidation = bodyErrors(f);
  const valid = [
    f.consent,
    f.full_name.trim().length > 0 && num(f.age) >= 13 && num(f.age) <= 100 && !!f.gender,
    Object.values(bodyValidation).every(error => error === null),
    !!f.goal,
    !!f.diet_type,
    !!f.activity_level,
    !!f.workout_location && !!f.experience_level,
  ];

  async function finish() {
    setSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { setSaving(false); return; }
    const first = !profile?.onboarded_at;
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: f.full_name.trim(),
        age: num(f.age),
        gender: f.gender,
        height_cm: num(f.height_cm),
        weight_kg: num(f.weight_kg),
        target_weight_kg: num(f.target_weight_kg),
        goal: f.goal,
        diet_type: f.diet_type,
        allergies: f.allergies,
        food_preferences: f.food_preferences.trim() || null,
        medical_conditions: f.medical_conditions.trim() || null,
        activity_level: f.activity_level,
        workout_location: f.workout_location,
        experience_level: f.experience_level,
        equipment: f.equipment,
        workout_frequency: f.workout_frequency,
        workout_duration_min: f.workout_duration_min,
        health_consent_at: profile?.health_consent_at ?? new Date().toISOString(),
        onboarded_at: profile?.onboarded_at ?? new Date().toISOString(),
      })
      .eq("id", auth.user.id);
    if (!error && (first || Number(profile?.weight_kg) !== num(f.weight_kg))) {
      await supabase.from("weight_logs").insert({ user_id: auth.user.id, weight_kg: num(f.weight_kg) });
    }
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    await qc.invalidateQueries();
    toast.success(first ? "Your profile is ready" : "Profile updated");
    navigate({ to: "/home" });
  }

  if (isLoading) return <div className="grid min-h-screen place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div>;

  const last = step === STEPS.length - 1;

  return (
    <div className="min-h-screen bg-background bg-hero">
      <div className="mx-auto flex min-h-screen max-w-lg flex-col px-5 pb-8 pt-5">
        <div className="flex items-center justify-between">
          {step > 0 ? (
            <button onClick={() => setStep(step - 1)} className="grid size-10 place-items-center rounded-full bg-secondary" aria-label="Back">
              <ArrowLeft className="size-5" />
            </button>
          ) : <Logo />}
          <span className="text-sm text-muted-foreground">Step {step + 1} of {STEPS.length}</span>
        </div>
        <div className="mt-5 flex gap-1.5" aria-hidden="true">
          {STEPS.map((s, i) => (
            <div key={s} className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
              <motion.div className="h-full bg-primary" initial={false} animate={{ width: i <= step ? "100%" : "0%" }} />
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
            className="mt-8 flex-1 space-y-6"
          >
            {step === 0 && (
              <>
                <ShieldCheck className="size-10 text-primary" />
                <h1 className="text-3xl font-bold">Your health data, your control</h1>
                <div className="space-y-3 text-muted-foreground">
                  <p>To personalize your plans, we'll ask about your body, goals, diet and — optionally — allergies and medical conditions.</p>
                  <p>This information is private to your account and is processed by our smart coaching system on secure servers only to generate your plans and coaching. You can edit or delete it anytime.</p>
                  <p>Fitness AI provides general guidance and is not a medical service.</p>
                </div>
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-surface p-4">
                  <Checkbox checked={f.consent} onCheckedChange={(v) => set("consent", v === true)} className="mt-0.5" />
                  <span className="text-sm">I consent to Fitness AI processing my health and fitness information as described in the <a href="/legal/privacy" target="_blank" className="text-primary underline">Privacy Policy</a>.</span>
                </label>
              </>
            )}

            {step === 1 && (
              <>
                <h1 className="text-3xl font-bold">Let's get to know you</h1>
                <div className="space-y-1.5"><Label htmlFor="n">Name</Label><Input id="n" value={f.full_name} onChange={(e) => set("full_name", e.target.value)} maxLength={80} /></div>
                <div className="space-y-1.5"><Label htmlFor="a">Age</Label><Input id="a" type="number" inputMode="numeric" min={13} max={100} value={f.age} onChange={(e) => set("age", e.target.value)} /></div>
                <div className="space-y-2"><Label>Gender</Label>{GENDERS.map((g) => <Choice key={g.value} label={g.label} selected={f.gender === g.value} onClick={() => set("gender", g.value)} />)}</div>
              </>
            )}

            {step === 2 && (
              <>
                <h1 className="text-3xl font-bold">Your body today</h1>
                <div className="space-y-1.5"><Label htmlFor="h">Height (cm)</Label><Input id="h" type="number" inputMode="decimal" min={100} max={250} aria-invalid={!!bodyValidation.height_cm} aria-describedby="height-error" value={f.height_cm} onChange={(e) => set("height_cm", e.target.value)} />{bodyValidation.height_cm && <p id="height-error" className="text-sm text-destructive">{bodyValidation.height_cm}</p>}</div>
                <div className="space-y-1.5"><Label htmlFor="w">Current weight (kg)</Label><Input id="w" type="number" inputMode="decimal" min={30} max={300} step="0.1" aria-invalid={!!bodyValidation.weight_kg} aria-describedby="weight-error" value={f.weight_kg} onChange={(e) => set("weight_kg", e.target.value)} />{bodyValidation.weight_kg && <p id="weight-error" className="text-sm text-destructive">{bodyValidation.weight_kg}</p>}</div>
                <div className="space-y-1.5"><Label htmlFor="t">Target weight (kg)</Label><Input id="t" type="number" inputMode="decimal" min={30} max={300} step="0.1" aria-invalid={!!bodyValidation.target_weight_kg} aria-describedby="target-error" value={f.target_weight_kg} onChange={(e) => set("target_weight_kg", e.target.value)} />{bodyValidation.target_weight_kg && <p id="target-error" className="text-sm text-destructive">{bodyValidation.target_weight_kg}</p>}</div>
              </>
            )}

            {step === 3 && (
              <>
                <h1 className="text-3xl font-bold">What's your main goal?</h1>
                <div className="space-y-2">{GOALS.map((g) => <Choice key={g.value} label={g.label} desc={g.desc} selected={f.goal === g.value} onClick={() => set("goal", g.value)} />)}</div>
              </>
            )}

            {step === 4 && (
              <>
                <h1 className="text-3xl font-bold">How do you eat?</h1>
                <div className="grid grid-cols-2 gap-2">{DIETS.map((d) => <Choice key={d.value} label={d.label} selected={f.diet_type === d.value} onClick={() => set("diet_type", d.value)} />)}</div>
                <div className="space-y-2"><Label>Food allergies <span className="text-muted-foreground">(optional)</span></Label><div className="flex flex-wrap gap-2">{ALLERGIES.map((a) => <Chip key={a} label={a} selected={f.allergies.includes(a)} onClick={() => toggle("allergies", a)} />)}</div></div>
                <div className="space-y-1.5"><Label htmlFor="fp">Food preferences <span className="text-muted-foreground">(optional)</span></Label><Textarea id="fp" placeholder="e.g. South Indian food, no mushrooms, budget-friendly" value={f.food_preferences} onChange={(e) => set("food_preferences", e.target.value)} maxLength={500} /></div>
              </>
            )}

            {step === 5 && (
              <>
                <h1 className="text-3xl font-bold">Your daily activity</h1>
                <div className="space-y-2">{ACTIVITY.map((a) => <Choice key={a.value} label={a.label} desc={a.desc} selected={f.activity_level === a.value} onClick={() => set("activity_level", a.value)} />)}</div>
                <div className="space-y-1.5"><Label htmlFor="mc">Medical conditions or injuries <span className="text-muted-foreground">(optional)</span></Label><Textarea id="mc" placeholder="e.g. lower back pain, thyroid" value={f.medical_conditions} onChange={(e) => set("medical_conditions", e.target.value)} maxLength={500} /><p className="text-xs text-muted-foreground">Helps us keep suggestions conservative. Always follow your doctor's advice.</p></div>
              </>
            )}

            {step === 6 && (
              <>
                <h1 className="text-3xl font-bold">How do you like to train?</h1>
                <div className="grid grid-cols-2 gap-2"><Choice label="Gym" selected={f.workout_location === "gym"} onClick={() => set("workout_location", "gym")} /><Choice label="Home" selected={f.workout_location === "home"} onClick={() => set("workout_location", "home")} /></div>
                <div className="space-y-2"><Label>Experience</Label><div className="grid grid-cols-3 gap-2">{EXPERIENCE.map((x) => <Choice key={x.value} label={x.label} selected={f.experience_level === x.value} onClick={() => set("experience_level", x.value)} />)}</div></div>
                <div className="space-y-2"><Label>Available equipment</Label><div className="flex flex-wrap gap-2">{EQUIPMENT.map((x) => <Chip key={x} label={x} selected={f.equipment.includes(x)} onClick={() => toggle("equipment", x)} />)}</div></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label htmlFor="fq">Days per week</Label><Input id="fq" type="number" min={1} max={7} value={f.workout_frequency} onChange={(e) => set("workout_frequency", Math.min(7, Math.max(1, Number(e.target.value))))} /></div>
                  <div className="space-y-1.5"><Label htmlFor="du">Minutes per session</Label><Input id="du" type="number" min={10} max={180} step={5} value={f.workout_duration_min} onChange={(e) => set("workout_duration_min", Math.min(180, Math.max(10, Number(e.target.value))))} /></div>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        <Button
          className="mt-8 h-12 w-full rounded-full text-base font-semibold"
          disabled={!valid[step] || saving}
          onClick={() => (last ? finish() : setStep(step + 1))}
        >
          {saving && <Loader2 className="size-4 animate-spin" />}
          {last ? (profile?.onboarded_at ? "Save changes" : "Build my plan") : "Continue"}
        </Button>
      </div>
    </div>
  );
}
