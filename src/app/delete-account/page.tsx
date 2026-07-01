import { Mail, Smartphone, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  getAndroidPlayStoreUrl,
  getIosAppStoreUrl,
} from "@/shared/config/store-links";
import { buildNativeOpenUrl } from "@/shared/lib/native-deeplink";

const SUPPORT_EMAIL = "support@buzlee.com";
const DELETION_REQUEST_SUBJECT = "Buzlee Account Deletion Request";

const mailto = (subject?: string) =>
  subject
    ? `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`
    : `mailto:${SUPPORT_EMAIL}`;

export const metadata: Metadata = {
  title: { absolute: "Delete your Buzlee account" },
  description:
    "How to permanently delete your Buzlee account and associated data from the Buzlee app, and what data is deleted or retained.",
  robots: { index: true, follow: true },
};

const steps = [
  "Open the Buzlee app",
  "Go to Account Settings",
  "Tap Delete Account",
  "Confirm",
];

const deletedData = [
  "Your profile (name, email, avatar)",
  "Resident/business profile",
  "Saved flyers",
  "Business subscriptions",
  "Event check-ins",
  "Push notification tokens",
  "Notification history",
];

const deletedBusinessData = [
  "Your business listing (name, email, phone, address)",
  "All posted flyers",
  "Memberships",
  "Claims",
];

export default function DeleteAccountPage() {
  return (
    <main className="min-h-full flex-1 bg-background">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-12 px-4 pb-24 pt-8 sm:px-6 sm:pt-12 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center"
            aria-label="Buzlee home"
          >
            <Image
              src="/logo-full.svg"
              alt="Buzlee"
              width={112}
              height={72}
              priority
              className="h-auto w-24 sm:w-28"
            />
          </Link>
          <Button asChild variant="outline" size="sm">
            <a href={mailto()}>
              <Mail className="size-4" aria-hidden="true" />
              Contact support
            </a>
          </Button>
        </header>

        <section className="flex flex-col gap-4">
          <Badge
            variant="outline"
            className="border-primary/30 bg-primary/10 text-primary"
          >
            Account
          </Badge>
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Delete your Buzlee account
          </h1>
          <p className="text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
            To delete your Buzlee account and associated data:
          </p>
        </section>

        <Card className="border-border/60 bg-card/60">
          <CardHeader>
            <CardTitle className="text-xl tracking-tight">
              Delete from the app
            </CardTitle>
            <CardDescription>
              Account deletion is done directly in the Buzlee app.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <ol className="flex flex-col gap-3">
              {steps.map((step, i) => (
                <li key={step} className="flex items-center gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-xs font-semibold tabular-nums text-primary">
                    {i + 1}
                  </span>
                  <span className="text-base leading-7 text-foreground">
                    {step}
                  </span>
                </li>
              ))}
            </ol>

            <div
              role="alert"
              className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4"
            >
              <TriangleAlert
                className="mt-0.5 size-4 shrink-0 text-destructive"
                aria-hidden="true"
              />
              <p className="text-sm leading-6 text-foreground">
                This permanently deletes your account and cannot be undone.
              </p>
            </div>

            <Separator />

            <div className="flex flex-col gap-3">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <a href={buildNativeOpenUrl("account-settings")}>
                  <Smartphone className="size-4" aria-hidden="true" />
                  Open the Buzlee app
                </a>
              </Button>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Button asChild variant="outline">
                  <a
                    href={getIosAppStoreUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    App Store
                  </a>
                </Button>
                <Button asChild variant="outline">
                  <a
                    href={getAndroidPlayStoreUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Google Play
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <section
          aria-labelledby="data-deleted-heading"
          className="flex flex-col gap-4"
        >
          <h2
            id="data-deleted-heading"
            className="text-2xl font-semibold tracking-tight text-foreground"
          >
            Data deleted
          </h2>
          <ul className="flex flex-col gap-1.5 pl-5 text-base leading-7 text-muted-foreground [&_li]:list-disc">
            {deletedData.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="text-base leading-7 text-muted-foreground">
            For business accounts, deletion also includes:
          </p>
          <ul className="flex flex-col gap-1.5 pl-5 text-base leading-7 text-muted-foreground [&_li]:list-disc">
            {deletedBusinessData.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="data-retained-heading"
          className="flex flex-col gap-4"
        >
          <h2
            id="data-retained-heading"
            className="text-2xl font-semibold tracking-tight text-foreground"
          >
            Data retained
          </h2>
          <p className="text-base leading-7 text-muted-foreground">
            Anonymized, aggregated usage events (e.g. flyer views/shares) are
            kept with all personal identifiers removed. Encrypted database
            backups are purged within 30 days.
          </p>
        </section>

        <section
          aria-labelledby="no-app-access-heading"
          className="rounded-2xl border border-border/60 bg-card/60 p-6 sm:p-8"
        >
          <h2
            id="no-app-access-heading"
            className="text-xl font-semibold tracking-tight text-foreground"
          >
            Can't access the app?
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Email{" "}
            <a
              href={mailto(DELETION_REQUEST_SUBJECT)}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {SUPPORT_EMAIL}
            </a>{" "}
            to request deletion.
          </p>
          <div className="mt-5">
            <Button asChild>
              <a href={mailto(DELETION_REQUEST_SUBJECT)}>
                <Mail className="size-4" aria-hidden="true" />
                Request deletion by email
              </a>
            </Button>
          </div>
        </section>

        <footer className="flex flex-col items-center gap-2 border-t border-border/60 pt-6 text-center text-xs text-muted-foreground">
          <p>
            Buzlee Support ·{" "}
            <a
              className="text-foreground underline-offset-4 hover:underline"
              href={mailto()}
            >
              {SUPPORT_EMAIL}
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
