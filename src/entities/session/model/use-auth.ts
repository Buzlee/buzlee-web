"use client";

/**
 * Minimal web replacement for buzlee-app's entities/session auth store
 * (Zustand + RN navigation — not ported). Ported hooks only consume
 * `userId`, so that is all this exposes. The /admin/(dashboard) layout has
 * already validated the user server-side (getUser + admin role) before any
 * component calling this renders; RLS enforces authorization regardless.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/shared/lib/supabase";

export function useAuth(): { userId: string | null } {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setUserId(data.session?.user.id ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUserId(session?.user.id ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { userId };
}
