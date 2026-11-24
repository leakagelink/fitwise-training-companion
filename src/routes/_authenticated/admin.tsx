import { createFileRoute } from "@tanstack/react-router";
import { AdminPanel } from "@/features/admin/admin-panel";
export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [
    { title: "Administration — Muscles Zone" },
    { name: "description", content: "Muscles Zone administration for user accounts, membership access, coaches and app records." },
    { property: "og:title", content: "Muscles Zone Administration" },
    { property: "og:description", content: "Protected management of Muscles Zone accounts and operations." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex,nofollow" },
  ] }),
  component: AdminPanel,
});