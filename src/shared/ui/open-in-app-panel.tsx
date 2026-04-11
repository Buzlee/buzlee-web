"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
    <Card
      className={cn(
        "mx-auto w-full max-w-md gap-0 overflow-hidden px-0 py-0",
        "rounded-2xl border-border/70",
        "bg-card shadow-lg ring-1 ring-border/70",
      )}
    >
      <CardHeader
        className={cn(
          "gap-2.5 border-b border-border/60 px-6 py-6 text-center sm:px-8 sm:py-7",
          "bg-background",
        )}
      >
        <h1 className="text-balance text-xl font-semibold tracking-tight text-foreground">
          {heading}
        </h1>
        {subheading ? (
          <CardDescription
            className={cn(
              "text-pretty text-sm leading-relaxed text-muted-foreground",
              "max-w-[34ch] sm:mx-auto",
            )}
          >
            {subheading}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-5 px-6 pb-7 pt-5 sm:px-8">
        <Button
          asChild
          size="lg"
          className={cn(
            "h-12 w-full min-h-12 touch-manipulation rounded-full text-base font-semibold",
            "shadow-md shadow-primary/25 transition-[transform,box-shadow] duration-200",
            "hover:shadow-lg hover:shadow-primary/20 active:scale-[0.99]",
          )}
        >
          <a href={nativeHref}>Open in app</a>
        </Button>

        <div className="flex flex-col gap-3 border-t border-border/50 pt-5">
          <p className="text-center text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Get the app
          </p>
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
            <Button
              asChild
              variant="outline"
              size="lg"
              className={cn(
                "h-12 w-full min-h-12 touch-manipulation rounded-full text-base font-medium",
                "border-border/90 bg-background/90 backdrop-blur-sm transition-colors",
                "hover:border-primary/30 hover:bg-muted/60 active:scale-[0.99]",
                "sm:h-11 sm:min-h-11 sm:flex-1 sm:text-sm",
              )}
            >
              <a href={iosStoreUrl} target="_blank" rel="noopener noreferrer">
                App Store
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className={cn(
                "h-12 w-full min-h-12 touch-manipulation rounded-full text-base font-medium",
                "border-border/90 bg-background/90 backdrop-blur-sm transition-colors",
                "hover:border-primary/30 hover:bg-muted/60 active:scale-[0.99]",
                "sm:h-11 sm:min-h-11 sm:flex-1 sm:text-sm",
              )}
            >
              <a
                href={androidStoreUrl}
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
  );
}
