import { ChevronRight, Mail } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const SUPPORT_EMAIL = "support@buzlee.com";
const EFFECTIVE_DATE = "May 14, 2026";
const PRIVACY_REQUEST_SUBJECT = "Buzlee Privacy Request";

const mailto = (subject?: string) =>
  subject
    ? `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`
    : `mailto:${SUPPORT_EMAIL}`;

export const metadata: Metadata = {
  title: { absolute: "Buzlee Privacy Policy" },
  description:
    "Learn how Buzlee collects, uses, shares, and protects information when residents and businesses use the Buzlee app and related services.",
  robots: { index: true, follow: true },
};

type Section = {
  id: string;
  title: string;
  body: ReactNode;
};

const sections: Section[] = [
  {
    id: "information-we-collect",
    title: "Information we collect",
    body: (
      <div className="flex flex-col gap-6">
        <p>
          The information Buzlee collects depends on whether you use Buzlee as
          a resident, a business, or both.
        </p>

        <div className="flex flex-col gap-2">
          <h3>Account information</h3>
          <p>
            When you create or use a Buzlee account, we collect your account
            email, account role (resident or business), the sign-in method you
            used (email and password, Sign in with Apple, or Sign in with
            Google), authentication identifiers from those providers where
            applicable, and account settings such as your notification
            preferences.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3>Resident profile information</h3>
          <p>
            If you use Buzlee as a resident, we may collect your first and last
            name, home town, an optional contact email you share with
            businesses you subscribe to (commonly used when you sign in with
            Apple's private email relay), the flyers you save, the businesses
            you subscribe to, your notification preferences, and your
            interactions with flyers and business updates (such as saves,
            shares, and check-ins).
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3>Business profile information</h3>
          <p>
            If you use Buzlee as a business, we may collect your business name,
            the contact first and last name you provide during onboarding, your
            business email, phone number, website, description, category,
            business address (which we geocode to coordinates), town, social
            profile links for Facebook, Instagram, Yelp, and Google Business,
            logo and cover photo, application and account status (such as
            pending, approved, or rejected), and any review notes associated
            with your application.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3>Flyer, event, and content information</h3>
          <p>
            When businesses create flyers or post updates, we collect the
            flyer's title and description, image or PDF media, an optional
            cover photo, event start and optional end dates and times,
            recurrence rules (such as daily, weekly with selected days, or
            monthly), category and up to five tags, any age restriction, the
            event's location address and optional location name, an optional
            external link, the flyer's status (such as draft, live, expired,
            or archived), and posts shared with subscribers.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3>Location information</h3>
          <p>
            With your permission, Buzlee uses your device location to show
            nearby flyers, events, and businesses in the Feed and on the map.
            Business addresses provided by businesses are geocoded so flyers
            and businesses can appear in location-based search and on the map.
            You can enable or disable device location access at any time
            through your device settings.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3>Usage and analytics information</h3>
          <p>
            We collect information about how Buzlee is used, including flyer
            views, saves, shares, check-ins, subscription activity,
            notification delivery and open status, app performance, device
            type, operating system, log data, and error reports.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3>Analytics and crash reporting providers</h3>
          <p>
            We use <strong>PostHog</strong> for product analytics and session
            replay. When you are signed in, we identify you to PostHog using
            your account email, name, and account role so that usage events
            can be associated with your account. PostHog session replay
            records your interactions with the app, the layout of screens you
            visit, console logs, and network activity. Both text input fields
            and images are masked in session replays, so the text you type
            (such as passwords, search queries, or messages) and the images
            displayed on screen (such as flyer media, logos, or cover photos)
            are not captured. PostHog data is processed in the United States.
          </p>
          <p>
            We use <strong>Sentry</strong> for crash reporting and performance
            monitoring. Sentry receives error details, stack traces, device
            information, and performance traces for a portion of app activity
            so we can diagnose and fix issues. Sentry is configured to omit
            default user-identifying information (such as IP address) from
            error events, and we do not attach your account identifiers to
            Sentry reports.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3>Device identifiers and push tokens</h3>
          <p>
            To deliver the app and notifications, we collect device-level
            identifiers such as a device or installation identifier and, when
            you enable push notifications, a push notification token issued by
            Apple Push Notification service or Firebase Cloud Messaging. We
            use these identifiers to send notifications to your device, to
            associate sessions with your account, and to investigate
            performance and security issues.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3>Communications</h3>
          <p>
            If you contact Buzlee Support or receive transactional emails, we
            collect your email address, the content of your message, delivery
            status, and related support details.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3>Information we do not collect</h3>
          <p>
            Buzlee does not collect payment card numbers, financial account
            details, health or fitness data, your contacts, your photo or
            media library beyond the images and PDFs you choose to upload, or
            advertising identifiers (IDFA). Buzlee does not include
            third-party advertising.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "how-we-use-information",
    title: "How we use information",
    body: (
      <>
        <p>We use information to:</p>
        <ul>
          <li>Provide and operate the Buzlee app and related services</li>
          <li>Create and manage resident and business accounts</li>
          <li>
            Show flyers, events, businesses, maps, and local updates relevant
            to you
          </li>
          <li>
            Save flyers, manage subscriptions, and deliver reminders for events
            you've saved
          </li>
          <li>
            Send account, sign-in, business approval, flyer, reminder, update,
            and support communications
          </li>
          <li>Review business applications and moderate content</li>
          <li>
            Measure flyer performance, including views, saves, shares, and
            check-ins
          </li>
          <li>Improve app reliability, safety, and user experience</li>
          <li>
            Detect, prevent, and respond to fraud, abuse, security issues, and
            policy violations
          </li>
          <li>Comply with legal obligations</li>
        </ul>
      </>
    ),
  },
  {
    id: "how-we-share-information",
    title: "How we share information",
    body: (
      <div className="flex flex-col gap-6">
        <p>We do not sell your personal information.</p>

        <div className="flex flex-col gap-2">
          <h3>With other Buzlee users</h3>
          <p>
            Approved business profiles, live flyers, event details, media,
            locations, and business posts are visible to residents in the
            Buzlee app. Your saved flyers, subscriptions, and notification
            settings are not shown to other users.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3>With businesses you subscribe to</h3>
          <p>
            When you subscribe to a business, that business may see basic
            subscription activity and, if you chose to share one, the contact
            email associated with your resident profile, so the business can
            communicate with you through Buzlee.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3>With service providers</h3>
          <p>
            We rely on trusted service providers to help operate Buzlee,
            including hosting, authentication, database, file storage, email
            delivery, push notifications, mapping and geocoding, and analytics
            providers. These providers may process information only as needed
            to provide services to Buzlee and are required by contract to
            provide the same or equivalent protection of your information as
            this Privacy Policy describes, and to use it only for the purposes
            we authorize.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3>For legal and safety reasons</h3>
          <p>
            We may disclose information if required by law, legal process, or
            a government request, or if we believe disclosure is necessary to
            protect users, Buzlee, or the public.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3>Business transfers</h3>
          <p>
            If Buzlee is involved in a merger, acquisition, financing,
            reorganization, or sale of assets, information may be transferred
            as part of that transaction.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "tracking",
    title: "Tracking across other apps and websites",
    body: (
      <>
        <p>
          Buzlee does not track you across apps and websites owned by other
          companies. We do not use third-party advertising networks, do not
          share your information with data brokers, and do not collect the
          iOS Advertising Identifier (IDFA).
        </p>
        <p>
          Because Buzlee does not engage in tracking as defined by Apple's App
          Tracking Transparency framework, the app does not prompt you for
          tracking permission.
        </p>
      </>
    ),
  },
  {
    id: "notifications-and-emails",
    title: "Notifications and emails",
    body: (
      <>
        <p>
          Buzlee may send transactional messages, including account and
          sign-in emails, business application updates, reminders for flyers
          you've saved, changes to saved flyers, posts from businesses you
          subscribe to, and support replies.
        </p>
        <p>
          You can manage push and email notifications in the app under{" "}
          <strong>Profile → Notifications</strong>. Push notifications and
          emails can be turned on or off independently for three categories:
          Flyer Updates, Event Reminders, and Business Updates. Push
          notifications also depend on the permission you grant in your
          device's settings.
        </p>
        <p>
          Some account, security, or transactional emails may still be sent
          even if you have turned off optional notifications.
        </p>
      </>
    ),
  },
  {
    id: "location-controls",
    title: "Location controls",
    body: (
      <>
        <p>
          You can enable or disable device location access at any time through
          your device settings. If location access is disabled, nearby
          discovery and map features may be limited.
        </p>
        <p>
          Business and flyer locations submitted by businesses may remain
          visible as part of public listings unless the business edits,
          archives, or deletes them, or the flyer expires.
        </p>
      </>
    ),
  },
  {
    id: "data-retention",
    title: "Data retention",
    body: (
      <>
        <p>
          We keep information for as long as needed to provide Buzlee, maintain
          accounts, comply with legal obligations, resolve disputes, enforce
          our agreements, prevent abuse, and support legitimate business
          operations.
        </p>
        <p>
          If you delete your account, we will delete or de-identify your
          personal information where reasonably possible, unless we need to
          retain certain information for legal, security, fraud prevention,
          recordkeeping, or other legitimate operational reasons.
        </p>
        <p>
          Some public or business content may remain if it is associated with
          active listings, legal records, analytics, backups, or another user
          or business account.
        </p>
      </>
    ),
  },
  {
    id: "your-choices-and-rights",
    title: "Your choices and rights",
    body: (
      <>
        <p>
          Depending on where you live, you may have rights to access, correct,
          delete, export, or object to certain uses of your personal
          information.
        </p>
        <p>Inside Buzlee, you can also:</p>
        <ul>
          <li>
            Update your resident profile in{" "}
            <strong>Profile → My Info</strong>, including your home town and
            optional contact email
          </li>
          <li>
            Update your business profile under <strong>Business Profile</strong>
          </li>
          <li>
            Change notification settings in{" "}
            <strong>Profile → Notifications</strong>
          </li>
          <li>
            Manage subscriptions in <strong>Updates → Following</strong>
          </li>
          <li>Save, unsave, or share flyers from the Feed</li>
          <li>Disable device location permission in your device settings</li>
          <li>
            Delete your account in{" "}
            <strong>Account Settings → Delete Account</strong>
          </li>
        </ul>
        <p>
          To make a privacy request, email{" "}
          <a href={mailto(PRIVACY_REQUEST_SUBJECT)}>{SUPPORT_EMAIL}</a> with
          the subject line <strong>"Buzlee Privacy Request."</strong>
        </p>
      </>
    ),
  },
  {
    id: "account-deletion",
    title: "Account deletion",
    body: (
      <>
        <p>
          You can delete your Buzlee account from inside the app under{" "}
          <strong>Profile → Account Settings → Delete Account</strong>. Account
          deletion is permanent and cannot be undone.
        </p>
        <p>
          When you delete a resident account, your profile, saved flyers,
          subscriptions, and related data are removed. When you delete a
          business account, your business profile, flyers, posts, and related
          data are removed.
        </p>
        <p>
          If you can't access your account, email{" "}
          <a href={mailto()}>{SUPPORT_EMAIL}</a> from the email address
          associated with your Buzlee account.
        </p>
      </>
    ),
  },
  {
    id: "security",
    title: "Security",
    body: (
      <p>
        We use reasonable administrative, technical, and organizational
        measures to protect information. No method of transmission or storage
        is completely secure, however, and we can't guarantee absolute
        security.
      </p>
    ),
  },
  {
    id: "childrens-privacy",
    title: "Children's privacy",
    body: (
      <p>
        Buzlee is not intended for children under 13. We do not knowingly
        collect personal information from children under 13. Some flyers may
        also carry age restrictions set by the business that created them. If
        you believe a child has provided personal information to Buzlee,
        contact us at <a href={mailto()}>{SUPPORT_EMAIL}</a>.
      </p>
    ),
  },
  {
    id: "third-party-links-and-services",
    title: "Third-party links and services",
    body: (
      <p>
        Buzlee may include links to third-party websites, business pages,
        social profiles, maps, or external event links provided by businesses.
        We are not responsible for the privacy practices of third-party
        services. Review their privacy policies before sharing information
        with them.
      </p>
    ),
  },
  {
    id: "changes-to-this-policy",
    title: "Changes to this policy",
    body: (
      <p>
        We may update this Privacy Policy from time to time. If we make
        material changes, we may notify you in the app, by email, or by
        updating the effective date above. Your continued use of Buzlee after
        an update means you accept the updated policy.
      </p>
    ),
  },
  {
    id: "contact-us",
    title: "Contact us",
    body: (
      <p>
        For questions, requests, or concerns about this Privacy Policy,
        contact <strong>Buzlee Support</strong> at{" "}
        <a href={mailto()}>{SUPPORT_EMAIL}</a>.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-full flex-1 bg-background">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-12 px-4 pb-24 pt-8 sm:px-6 sm:pt-12 lg:px-8">
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
            Effective {EFFECTIVE_DATE}
          </Badge>
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
            Buzlee helps residents discover local flyers, events, promotions,
            and business updates, and helps businesses share information with
            nearby communities. This Privacy Policy explains how Buzlee
            collects, uses, shares, and protects information when you use our
            app, website, and related services.
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            Questions or privacy requests? Email{" "}
            <a
              href={mailto(PRIVACY_REQUEST_SUBJECT)}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
        </section>

        <nav
          aria-label="Table of contents"
          className="rounded-2xl border border-border/60 bg-card/60 p-5 sm:p-6"
        >
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-primary">
            Contents
          </p>
          <ol className="grid gap-1.5 sm:grid-cols-2">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="group inline-flex items-baseline gap-2 text-sm leading-6 text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
                >
                  <span className="tabular-nums text-xs text-muted-foreground/70">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="underline-offset-4 group-hover:underline">
                    {s.title}
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="prose-policy flex flex-col gap-14">
          {sections.map((s) => (
            <section
              key={s.id}
              id={s.id}
              aria-labelledby={`${s.id}-heading`}
              className="scroll-mt-8 flex flex-col gap-4"
            >
              <h2
                id={`${s.id}-heading`}
                className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]"
              >
                {s.title}
              </h2>
              <div className="flex flex-col gap-4 text-base leading-7 text-muted-foreground [&_a]:font-medium [&_a]:text-foreground [&_a]:underline-offset-4 hover:[&_a]:underline [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_li]:leading-7 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5">
                {s.body}
              </div>
            </section>
          ))}
        </div>

        <section
          aria-labelledby="footer-cta-heading"
          className="rounded-2xl border border-border/60 bg-card/60 p-6 sm:p-8"
        >
          <h2
            id="footer-cta-heading"
            className="text-xl font-semibold tracking-tight text-foreground"
          >
            Privacy request or question?
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Email Buzlee Support with the subject line "Buzlee Privacy
            Request" and we'll get back to you.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <a href={mailto(PRIVACY_REQUEST_SUBJECT)}>
                <Mail className="size-4" aria-hidden="true" />
                Email a privacy request
              </a>
            </Button>
            <Button asChild variant="outline">
              <Link href="/support">
                Visit the Help Center
                <ChevronRight className="size-4" aria-hidden="true" />
              </Link>
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
          <p>Last updated {EFFECTIVE_DATE}.</p>
        </footer>
      </div>
    </main>
  );
}
