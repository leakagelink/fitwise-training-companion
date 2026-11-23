import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { ScreenLoadError, ScreenNotFound } from "@/components/screen-load-state";

const DOCS: Record<string, { title: string; body: string[] }> = {
  privacy: {
    title: "Privacy Policy",
    body: [
      "We collect only what you give us: your account email, the fitness profile you fill in during onboarding, and the logs you record (check-ins, weight, and later meals, workouts and photos).",
      "Sensitive health information such as medical conditions and allergies is optional and only processed after you give explicit consent during onboarding.",
      "To personalize plans and coaching, relevant parts of your profile and logs are processed by our smart coaching system on our secure server. This data is never shown to other users and is not used for advertising.",
      "Progress and food photos are stored in private storage that only your account can access.",
      "You can delete your account and all associated data at any time from Profile → Delete account. Deletion is permanent.",
      "We do not request location, contacts or microphone access. Camera or photo access is only requested when you choose a photo feature.",
    ],
  },
  terms: {
    title: "Terms of Service",
    body: [
      "Fitness AI provides general fitness, nutrition and lifestyle guidance for adults. You are responsible for deciding whether a recommendation is right for you.",
      "New accounts receive a 3-day free trial of diet plans, workout plans and coaching. After the trial, continued access requires a paid subscription.",
      "Subscriptions renew according to the plan you choose and can be cancelled before renewal. Pricing and billing details are shown before any purchase.",
      "Do not misuse the service, attempt to access other users' data, or use the coach for unlawful purposes.",
    ],
  },
  disclaimer: {
    title: "Health & Fitness Disclaimer",
    body: [
      "Fitness AI is not a medical service. It does not diagnose, treat or cure any disease and does not prescribe medication.",
      "All calorie, macro and nutrition figures are estimates. Goal timelines are predictions, not guarantees.",
      "Consult a qualified healthcare professional before starting a new diet or exercise program, especially if you are pregnant, have a medical condition, injury, or take medication.",
      "Stop exercising and seek medical help if you feel pain, dizziness, chest discomfort or shortness of breath.",
    ],
  },
  support: {
    title: "Support",
    body: [
      "Need help with your account, plans or billing? Reach out through the support contact listed in the app store listing.",
      "To delete your account and all of your data, open Profile and choose Delete account.",
    ],
  },
};

export const Route = createFileRoute("/legal/$doc")({
  staleTime: Infinity,
  loader: ({ params }) => {
    const doc = DOCS[params.doc];
    if (!doc) throw notFound();
    return doc;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? "Legal"} — Fitness AI` },
      { name: "description", content: `${loaderData?.title ?? "Legal"} for Fitness AI.` },
      { property: "og:title", content: `${loaderData?.title ?? "Legal"} — Fitness AI` },
      { property: "og:description", content: `${loaderData?.title ?? "Legal"} for Fitness AI.` },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LegalPage,
  errorComponent: ScreenLoadError,
  notFoundComponent: ScreenNotFound,
});

function LegalPage() {
  const doc = Route.useLoaderData();
  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back
      </Link>
      <h1 className="mt-6 text-3xl font-bold">{doc.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated November 2026</p>
      <div className="mt-8 space-y-5 leading-relaxed text-muted-foreground">
        {doc.body.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
    </div>
  );
}
