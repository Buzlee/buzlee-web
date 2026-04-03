"use client";

type OpenInAppPanelProps = {
  nativeHref: string;
  heading: string;
  subheading?: string;
  iosStoreUrl: string;
  androidStoreUrl: string;
};

export function OpenInAppPanel({
  nativeHref,
  heading,
  subheading,
  iosStoreUrl,
  androidStoreUrl,
}: OpenInAppPanelProps) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-8 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {heading}
        </h1>
        {subheading ? (
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {subheading}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-3">
        <a
          href={nativeHref}
          className="flex h-12 w-full items-center justify-center rounded-full bg-[#FAAF00] px-5 text-sm font-semibold text-zinc-900 transition-opacity hover:opacity-90"
        >
          Open in app
        </a>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center sm:gap-3">
          <a
            href={iosStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 flex-1 items-center justify-center rounded-full border border-zinc-300 text-sm font-medium text-zinc-900 dark:border-zinc-600 dark:text-zinc-100"
          >
            App Store
          </a>
          <a
            href={androidStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 flex-1 items-center justify-center rounded-full border border-zinc-300 text-sm font-medium text-zinc-900 dark:border-zinc-600 dark:text-zinc-100"
          >
            Google Play
          </a>
        </div>
      </div>
    </div>
  );
}
