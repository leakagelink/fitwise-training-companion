import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { deleteMyAccount } from "@/features/account/account.functions";
import { useQuery } from "@tanstack/react-query";
import { getAdminIdentity } from "@/features/admin/admin.functions";
import { AccountServices } from "@/features/account/service-panel";
import { getOperationsIdentity } from "@/features/admin/operations.functions";

export const Route = createFileRoute("/_authenticated/_app/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Fitness AI" },
      { name: "description", content: "Manage your Fitness AI profile." },
      { property: "og:title", content: "Profile — Fitness AI" },
      { property: "og:description", content: "Manage your profile." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { data: p } = useProfile();
  const navigate = useNavigate();
  const del = useServerFn(deleteMyAccount);
  const identify = useServerFn(getAdminIdentity);
  const admin = useQuery({ queryKey: ["admin-identity"], queryFn: () => identify() });
  const staffIdentity = useServerFn(getOperationsIdentity);
  const staff = useQuery({ queryKey: ["staff-identity"], queryFn: () => staffIdentity() });
  const [busy, setBusy] = useState(false);
  const toggleTheme = () => {
    const light = document.documentElement.classList.toggle("light");
    localStorage.setItem("fa-theme", light ? "light" : "dark");
  };
  async function onDelete() {
    if (!confirm("Permanently delete your account and all data? This cannot be undone.")) return;
    setBusy(true);
    try {
      await del();
      await supabase.auth.signOut();
      navigate({ to: "/" });
      toast.success("Account deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Deletion failed");
      setBusy(false);
    }
  }
  return (
    <div className="mx-auto max-w-xl space-y-4 px-5 py-8">
      <h1 className="text-3xl font-bold">{p?.full_name}</h1>
      <div className="card-premium divide-y divide-border">
        {admin.data?.isAdmin && <Link to="/admin" className="block p-4">Administration</Link>}
        {!!staff.data?.capabilities.length && <Link to="/staff" className="block p-4">Staff workspace</Link>}
        <Link to="/reminders" className="block p-4">
          Reminders &amp; missed-meal check-ins
        </Link>
        <Link to="/onboarding" className="block p-4">
          Edit fitness profile
        </Link>
        <button onClick={toggleTheme} className="block w-full p-4 text-left">
          Toggle light / dark theme
        </button>
        <Link to="/legal/$doc" params={{ doc: "privacy" }} className="block p-4">
          Privacy Policy
        </Link>
        <Link to="/legal/$doc" params={{ doc: "disclaimer" }} className="block p-4">
          Health disclaimer
        </Link>
        <button
          onClick={() => supabase.auth.signOut().then(() => navigate({ to: "/" }))}
          className="block w-full p-4 text-left"
        >
          Sign out
        </button>
      </div>
      <AccountServices />
      <Button
        variant="destructive"
        disabled={busy}
        onClick={onDelete}
        className="w-full rounded-full"
      >
        Delete account
      </Button>
    </div>
  );
}
