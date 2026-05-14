import {
  BriefcaseBusiness,
  ChevronRight,
  LifeBuoy,
  Mail,
  Send,
  UserRound,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const SUPPORT_EMAIL = "support@buzlee.com";

const mailto = (subject?: string) =>
  subject
    ? `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`
    : `mailto:${SUPPORT_EMAIL}`;

export const metadata: Metadata = {
  title: { absolute: "Buzlee Support" },
  description:
    "Help for Buzlee residents and businesses. Answers about your account, flyers, notifications, and contacting support.",
  openGraph: {
    title: "Buzlee Support",
    description:
      "Help for Buzlee residents and businesses. Answers about your account, flyers, notifications, and contacting support.",
  },
};

type FAQ = { question: string; answer: ReactNode };

const residentFaqs: FAQ[] = [
  {
    question: "How do I create a Buzlee account?",
    answer:
      "Open the app and choose Sign Up. You can continue with email and password, with Apple, or with Google. If you sign up with email, we'll send a verification message before your account is active.",
  },
  {
    question: "How do I delete my account?",
    answer:
      "In the app, open Profile → Account Settings → Delete Account. This permanently deletes your profile, saved flyers, and related data and cannot be undone. If you cannot access the app, email support from the address on your Buzlee account.",
  },
  {
    question: "I signed in with Apple or Google — how do I change my password?",
    answer:
      "When you use Apple or Google to sign in, those providers manage your password. Inside Buzlee, Account Settings will show your connected provider instead of email and password fields. Change the password with Apple or Google directly.",
  },
  {
    question: "How do I find flyers near me?",
    answer:
      "Open the Feed and tap Filter by. You can filter by Town, Tags, Date (Today, This Week, This Month, or a specific date), and Time of Day (morning, afternoon, evening, night). Use Clear All to reset.",
  },
  {
    question: "Where are my saved flyers?",
    answer:
      "Open the Saved Flyers tab. Saved flyers are grouped into Today, Upcoming, and Past so events you're planning to attend stay easy to find.",
  },
  {
    question: "How do I get reminded before a saved event?",
    answer:
      "Open Profile → Notifications and turn on Event Reminders (push, email, or both). Under Remind Me, choose how far before the event you want to be reminded. Only flyers you've saved trigger reminders.",
  },
  {
    question: "Can I silence updates from one specific business?",
    answer:
      "Notification settings apply to a whole category — Flyer Updates, Event Reminders, or Business Updates — not to individual businesses. To stop hearing from one business, open Updates → Following and unsubscribe from that business.",
  },
  {
    question: "Why was I asked to share a contact email when I subscribed?",
    answer:
      "When you sign in with Apple, Apple can hide your real email address. To let businesses reach you, Buzlee asks for an optional contact email. It is only shared with businesses you subscribe to and you can update it any time in Profile → My Info.",
  },
  {
    question: "Push notifications aren't working — what should I check?",
    answer:
      "First confirm push is enabled in Profile → Notifications. If you have ever declined push permission on this device, your phone will block it until you re-enable Buzlee under your device's Settings → Notifications.",
  },
];

const businessFaqs: FAQ[] = [
  {
    question: "How do I apply for a business account?",
    answer:
      "Sign up and choose the business option. You'll complete a short onboarding covering your business identity, location, contact details, and description. Your application is then reviewed by the Buzlee team before your account goes live.",
  },
  {
    question: "Why is my business account still pending?",
    answer:
      "New business accounts are reviewed manually before they can post. If your account has been pending longer than expected, email support with your business name and the email on the account so we can look into it.",
  },
  {
    question: "My application was rejected — what can I do?",
    answer:
      "If your application was not approved, email support with your business name and the email on the account. We can explain the decision and let you know whether your application can be updated and re-submitted.",
  },
  {
    question: "How do I edit my business profile?",
    answer:
      "Open Business Profile from the business menu. You can update your business name, email, phone, website, description, address, category, logo, cover photo, and social profiles for Facebook, Instagram, Yelp, and Google Business.",
  },
  {
    question: "How do I create a flyer?",
    answer:
      "Open My Flyers → Create New Flyer. Add media (image or PDF), an optional cover photo, a title, the event date and time (with optional end date and end time), recurrence if it repeats, a category, up to 5 tags, an optional age restriction, the location, and an optional external link. Save as a draft or publish to make it live.",
  },
  {
    question: "How does recurrence work for flyers?",
    answer:
      "When creating a flyer, set Recurring to Daily, Weekly, or Monthly. Weekly events let you pick the days of the week the event runs. Choose Does not repeat for one-time events.",
  },
  {
    question: "What do the flyer statuses mean?",
    answer:
      "Draft flyers are saved but not published. Live flyers are visible to residents. Archive holds finished or paused flyers that you've hidden. Expired flyers are past their event date and have moved out of active discovery. New flyers may also be reviewed before going live.",
  },
  {
    question: "Why isn't my flyer visible to residents?",
    answer:
      "Open My Flyers and check which tab the flyer is in. Drafts must be published, Archive hides flyers, and expired events are no longer shown in discovery. If the flyer is Live and still missing, contact support with the flyer title and your business name.",
  },
  {
    question: "How do I post an update to my subscribers?",
    answer:
      "Use Business Updates from your business menu to post a short message. Updates appear in the Updates feed of residents who subscribe to your business.",
  },
  {
    question: "How do I see who's subscribed to my business?",
    answer:
      "Open the Subscribers screen. You'll see the residents subscribed to your business, including the contact email for residents who chose to share one.",
  },
  {
    question: "How do I delete my business account?",
    answer:
      "Open Account Settings → Delete Account. Deletion is permanent and removes your business profile, flyers, posts, and related data. If you can't access the app, email support from the address on your account.",
  },
];

function SectionHeading({
  eyebrow,
  title,
  description,
  id,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  id?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-[0.14em] text-primary">
        {eyebrow}
      </span>
      <h2
        id={id}
        className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
      >
        {title}
      </h2>
      {description ? (
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function RoleCard({
  href,
  badge,
  title,
  description,
  icon: Icon,
}: {
  href: string;
  badge: string;
  title: string;
  description: string;
  icon: typeof UserRound;
}) {
  return (
    <a
      href={href}
      className="group relative flex flex-col gap-5 rounded-2xl border border-border/60 bg-card/80 p-6 transition-colors hover:border-primary/40 hover:bg-card focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:p-7"
    >
      <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/15">
        <Icon className="size-6" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {badge}
        </span>
        <h3 className="text-xl font-semibold tracking-tight text-foreground">
          {title}
        </h3>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <div className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
        Browse help
        <ChevronRight
          className="size-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </div>
    </a>
  );
}

function FaqGroup({ id, faqs }: { id: string; faqs: FAQ[] }) {
  return (
    <Card className="border-border/60 bg-card/80 py-2">
      <CardContent className="px-4 sm:px-6">
        <Accordion type="single" collapsible className="w-full" id={id}>
          {faqs.map((faq) => (
            <AccordionItem
              key={faq.question}
              value={faq.question}
              className="border-border/60"
            >
              <AccordionTrigger className="text-left text-base font-medium">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-6 text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}

function ChecklistItem({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm leading-6 text-muted-foreground">
      <span
        aria-hidden="true"
        className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
      />
      <span>{children}</span>
    </li>
  );
}

export default function SupportPage() {
  return (
    <main className="relative min-h-full flex-1 bg-background">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-128 bg-[radial-gradient(60%_60%_at_50%_0%,hsl(var(--primary)/0.12),transparent_70%)]"
      />

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-4 pb-24 pt-8 sm:px-6 sm:pt-12 lg:px-8">
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

        <section className="flex flex-col items-center gap-6 text-center">
          <Badge
            variant="outline"
            className="border-primary/30 bg-primary/10 text-primary"
          >
            <LifeBuoy className="size-3" aria-hidden="true" />
            Buzlee Help Center
          </Badge>
          <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            How can we help?
          </h1>
          <p className="max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
            Choose your role to see answers about your account, flyers, and
            notifications. Can't find what you need? Email Buzlee Support and
            we'll get back to you.
          </p>
        </section>

        <section
          aria-labelledby="role-heading"
          className="flex flex-col gap-6"
        >
          <SectionHeading
            id="role-heading"
            eyebrow="Start here"
            title="Which best describes you?"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <RoleCard
              href="#residents"
              badge="Resident"
              title="I use Buzlee to find local events"
              description="Help with sign-in, finding and saving flyers, subscriptions, and notifications."
              icon={UserRound}
            />
            <RoleCard
              href="#businesses"
              badge="Business"
              title="I run a business on Buzlee"
              description="Help with your application, business profile, flyers, posts, and subscribers."
              icon={BriefcaseBusiness}
            />
          </div>
        </section>

        <section
          id="residents"
          aria-labelledby="residents-heading"
          className="flex flex-col gap-6 scroll-mt-8"
        >
          <SectionHeading
            id="residents-heading"
            eyebrow="For residents"
            title="Your account and the events you follow"
            description="Common questions about signing in, finding flyers, saving events, subscriptions, and notifications."
          />
          <FaqGroup id="resident-faqs" faqs={residentFaqs} />
        </section>

        <section
          id="businesses"
          aria-labelledby="businesses-heading"
          className="flex flex-col gap-6 scroll-mt-8"
        >
          <SectionHeading
            id="businesses-heading"
            eyebrow="For businesses"
            title="Your application, profile, and flyers"
            description="Common questions about applying, editing your profile, creating flyers, posting updates, and managing your account."
          />
          <FaqGroup id="business-faqs" faqs={businessFaqs} />
        </section>

        <section aria-labelledby="contact-heading">
          <Card className="relative overflow-hidden border-border/60 bg-card/80">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_120%_at_100%_0%,hsl(var(--primary)/0.14),transparent_60%),radial-gradient(60%_100%_at_0%_100%,hsl(var(--accent)/0.5),transparent_55%)]"
            />
            <CardHeader className="relative gap-2 px-6 pt-8 sm:px-10 sm:pt-10">
              <CardTitle
                id="contact-heading"
                className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
              >
                Still need help?
              </CardTitle>
              <CardDescription className="max-w-xl text-sm leading-6 sm:text-base">
                Email Buzlee Support and include the details below so we can
                resolve your issue on the first reply.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative grid gap-8 px-6 pb-8 sm:px-10 sm:pb-10 md:grid-cols-[1.2fr_1fr] md:items-end">
              <ul className="grid gap-1.5">
                <ChecklistItem>The email on your Buzlee account</ChecklistItem>
                <ChecklistItem>
                  Whether you use a resident or business account
                </ChecklistItem>
                <ChecklistItem>
                  The flyer title or business name involved, if any
                </ChecklistItem>
                <ChecklistItem>
                  Your device (iPhone or Android) and app version if known
                </ChecklistItem>
                <ChecklistItem>
                  A short description of what happened and what you expected
                </ChecklistItem>
              </ul>
              <div className="flex flex-col gap-3 md:items-end">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <a href={mailto()}>
                    <Mail className="size-4" aria-hidden="true" />
                    Email support
                  </a>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <a href={mailto("Buzlee App Feedback")}>
                    <Send className="size-4" aria-hidden="true" />
                    Send feedback
                  </a>
                </Button>
                <p className="text-xs leading-5 text-muted-foreground md:text-right">
                  We typically respond within 1–2 business days.
                </p>
              </div>
            </CardContent>
          </Card>
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
