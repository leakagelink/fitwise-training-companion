import { createFileRoute } from "@tanstack/react-router";
import { AdminPanel } from "@/features/admin/admin-panel";
export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [
    { title: "Administration — Fitwise" },
    { name: "description", content: "Fitwise administration for user accounts, membership access, coaches and app records." },
    { property: "og:title", content: "Fitwise Administration" },
    { property: "og:description", content: "Protected management of Fitwise accounts and operations." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex,nofollow" },
  ] }),
  component: AdminPanel,
});