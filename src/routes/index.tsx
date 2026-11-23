import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Activity, Apple, Camera, Dumbbell, LineChart, MessageCircle, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fitness AI — Your Personalized Fitness & Lifestyle Coach" },
      { name: "description", content: "Personalized diet plans, personalized workouts, 24/7 coaching and real progress tracking — try free for 3 days." },
      { property: "og:title", content: "Fitness AI — Your Personalized Fitness & Lifestyle Coach" },
      { property: "og:description", content: "Personalized diet plans, personalized workouts, 24/7 coaching and real progress tracking." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Apple, title: "Customised diet plan", body: "Meals built around your goal, preferences and allergies." },
  { icon: Dumbbell, title: "Smart workouts", body: "Home or gym programs that match your equipment and level." },
  { icon: MessageCircle, title: "24/7 personal Coach", body: "Ask anything about training, food, sleep, recovery and lifestyle." },
  { icon: LineChart, title: "Track your progress", body: "Weight, measurements and weekly scores from your own logs." },
  { icon: Camera, title: "Track your food", body: "Add a photo or name of your food and get its macro and micro nutrient details by quantity." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background bg-hero">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <Link to="/auth" className="rounded-full border border-input px-4 py-2 text-sm font-medium hover:bg-secondary">
          Sign in
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-20">
        <section className="grid items-center gap-12 pt-10 md:grid-cols-[1.1fr_1fr] md:pt-20">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
              <Activity className="size-3.5" /> 3-day free trial · no card needed
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-[1.05] md:text-6xl">
              Your personalized <span className="text-primary">fitness</span> &amp; lifestyle coach.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              Tell us about you once. Get a diet plan, workouts and daily guidance that adapt as you progress.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth" className="rounded-full bg-primary px-6 py-3.5 font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-[1.02]">
                Start free trial
              </Link>
              <Link to="/legal/$doc" params={{ doc: "disclaimer" }} className="rounded-full px-6 py-3.5 font-medium text-muted-foreground hover:text-foreground">
                Health disclaimer
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="card-premium p-6"
          >
            <p className="text-sm text-muted-foreground">Today</p>
            <p className="mt-1 font-display text-2xl font-semibold">Upper body strength</p>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                ["Calories", "kcal target", "text-energy"],
                ["Protein", "g target", "text-protein"],
                ["Water", "ml target", "text-water"],
              ].map(([label, unit, color]) => (
                <div key={label} className="rounded-2xl bg-surface p-4">
                  <p className={`text-xs font-semibold ${color}`}>{label}</p>
                  <p className="mt-2 text-xs text-muted-foreground">Personal {unit}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl bg-accent p-4 text-sm text-accent-foreground">
              Your coach writes a fresh, personal tip every morning based on your check-ins.
            </div>
          </motion.div>
        </section>

        <section className="mt-24 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="card-premium p-6">
              <f.icon className="size-6 text-primary" />
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </section>

        <section className="mt-16 flex items-start gap-3 rounded-2xl border border-border p-5 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
          <p>
            Your health data stays private to your account and you can delete it at any time. Fitness AI offers general
            guidance only and is not a substitute for medical advice.
          </p>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-5 px-5 text-sm text-muted-foreground">
          <span>© 2026 Fitness AI</span>
          <a href="https://repdb.co" rel="nofollow noreferrer" target="_blank" className="hover:text-foreground">Exercise data by RepDB (repdb.co)</a>
          <Link to="/legal/$doc" params={{ doc: "privacy" }} className="hover:text-foreground">Privacy</Link>
          <Link to="/legal/$doc" params={{ doc: "terms" }} className="hover:text-foreground">Terms</Link>
          <Link to="/legal/$doc" params={{ doc: "disclaimer" }} className="hover:text-foreground">Disclaimer</Link>
          <Link to="/legal/$doc" params={{ doc: "support" }} className="hover:text-foreground">Support</Link>
        </div>
      </footer>
    </div>
  );
}
