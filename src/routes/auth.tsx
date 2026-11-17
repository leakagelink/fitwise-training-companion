import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/brand/logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PhoneLogin } from "@/features/account/phone-login";
import { useQueryClient } from "@tanstack/react-query";
import { workspaceQuery, workspaceDestination } from "@/features/account/workspace";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Fitness AI" },
      { name: "description", content: "Sign in or create your Fitness AI account to start your 3-day free trial." },
      { property: "og:title", content: "Sign in — Fitness AI" },
      { property: "og:description", content: "Create your Fitness AI account and start your free trial." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [method, setMethod] = useState<"email" | "phone">("email");

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const identity = await qc.fetchQuery(workspaceQuery);
      if (active) await navigate({ to: workspaceDestination(identity.isAdmin), replace: true });
    }).catch(err => toast.error(err instanceof Error ? err.message : "Could not open workspace"));
    return () => { active = false; };
  }, [navigate, qc]);

  async function openWorkspace() {
    const identity = await qc.fetchQuery(workspaceQuery);
    await navigate({ to: workspaceDestination(identity.isAdmin), replace: true });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/auth", data: { full_name: name } },
        });
        if (error) throw error;
        if (!data.session) setSent(true);
        else await openWorkspace();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await openWorkspace();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background bg-hero px-5 py-10">
      <div className="w-full max-w-sm">
        <Link to="/"><Logo className="text-lg" /></Link>
        {sent ? (
          <div className="card-premium mt-8 p-6 text-center">
            <MailCheck className="mx-auto size-10 text-primary" />
            <h1 className="mt-4 text-xl font-semibold">Check your email</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We sent a confirmation link to <span className="text-foreground">{email}</span>. Open it to activate your account.
            </p>
          </div>
        ) : (
          <div className="card-premium mt-8 p-6">
            <h1 className="text-2xl font-semibold">{mode === "signup" ? "Create your account" : "Welcome back"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "signup" ? "Start your 3-day free trial." : "Sign in to continue your journey."}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-1 rounded-md bg-secondary p-1" aria-label="Login method">
              <Button type="button" variant={method === "email" ? "default" : "ghost"} onClick={() => setMethod("email")}>Email</Button>
              <Button type="button" variant={method === "phone" ? "default" : "ghost"} onClick={() => setMethod("phone")}>Mobile number</Button>
            </div>
            {method === "phone" ? <PhoneLogin key={mode} mode={mode} onVerified={openWorkspace} /> : <form onSubmit={submit} className="mt-6 space-y-4">
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={busy} className="h-11 w-full rounded-full font-semibold">
                {busy && <Loader2 className="size-4 animate-spin" />}
                {mode === "signup" ? "Create account" : "Sign in"}
              </Button>
            </form>}

            <p className="mt-5 text-center text-sm text-muted-foreground">
              {mode === "signup" ? "Already have an account?" : "New to Fitness AI?"}{" "}
              <button className="font-semibold text-primary" onClick={() => setMode(mode === "signup" ? "signin" : "signup")}>
                {mode === "signup" ? "Sign in" : "Create one"}
              </button>
            </p>
          </div>
        )}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing you agree to our{" "}
          <Link to="/legal/$doc" params={{ doc: "terms" }} className="underline">Terms</Link> and{" "}
          <Link to="/legal/$doc" params={{ doc: "privacy" }} className="underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
