import { Hexagon } from "lucide-react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/shared/lib/supabase";
import { createSupabaseServerClient } from "@/shared/lib/supabase-server";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default async function AdminSignInPage() {
  if (!isSupabaseConfigured()) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/admin");
  }

  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary">
            <Hexagon className="size-4 text-white" strokeWidth={2.5} />
          </span>
          <span className="text-[17px] font-extrabold tracking-tight text-foreground">
            Buzlee
          </span>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold tracking-wide text-secondary-foreground uppercase">
            Admin
          </span>
        </div>
        <h1 className="text-lg font-bold tracking-tight text-foreground">
          Sign in
        </h1>
        <p className="mt-1 mb-6 text-sm text-muted-foreground">
          Admin access only. Use your Buzlee admin account.
        </p>
        <SignInForm />
      </div>
    </main>
  );
}
