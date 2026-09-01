"use client";

import {
  Hexagon,
  Inbox,
  LogOut,
  Map as MapIcon,
  Newspaper,
  Store,
  Upload,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAdminResidents, useAdminStatusCounts } from "@/entities/admin";
import { usePendingClaimsCount } from "@/entities/business-claim";
import { supabase } from "@/shared/lib/supabase";

type NavCounts = {
  inbox?: number;
  businesses?: number;
  flyers?: number;
  residents?: number;
};

/**
 * Live nav counts. Inbox = pending businesses + pending claims (amber pill);
 * the rest are muted totals. Rendering degrades gracefully while loading —
 * items simply show no count until the queries resolve.
 */
function useAdminNavCounts(): NavCounts {
  const { data: statusCounts } = useAdminStatusCounts();
  const { data: pendingClaims } = usePendingClaimsCount();
  const { data: residents } = useAdminResidents();

  const pendingBusinesses = statusCounts?.businesses.pending;

  return {
    inbox:
      pendingBusinesses === undefined && pendingClaims === undefined
        ? undefined
        : (pendingBusinesses ?? 0) + (pendingClaims ?? 0),
    businesses: statusCounts
      ? Object.values(statusCounts.businesses).reduce((sum, n) => sum + n, 0)
      : undefined,
    flyers: statusCounts ? (statusCounts.flyers.live ?? 0) : undefined,
    residents: residents?.length,
  };
}

const NAV_ITEMS = [
  { title: "Inbox", href: "/admin", icon: Inbox, countKey: "inbox" },
  {
    title: "Businesses",
    href: "/admin/businesses",
    icon: Store,
    countKey: "businesses",
  },
  {
    title: "Flyers",
    href: "/admin/flyers",
    icon: Newspaper,
    countKey: "flyers",
  },
  {
    title: "Residents",
    href: "/admin/residents",
    icon: Users,
    countKey: "residents",
  },
] as const;

function initialsFrom(name: string | null, email: string | null): string {
  const source = name?.trim() || email?.trim() || "";
  if (!source) return "?";
  const words = source.split(/[\s@._-]+/).filter(Boolean);
  const first = words[0]?.[0] ?? "";
  const second = words.length > 1 ? (words[1]?.[0] ?? "") : "";
  return (first + second).toUpperCase() || "?";
}

export function AdminSidebar({
  userEmail,
  userName,
}: {
  userEmail: string | null;
  userName?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const counts = useAdminNavCounts();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/admin/sign-in");
    router.refresh();
  }

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="px-4 pt-5 pb-2">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary">
            <Hexagon className="size-4 text-white" strokeWidth={2.5} />
          </span>
          <span className="text-[17px] font-extrabold tracking-tight text-sidebar-foreground">
            Buzlee
          </span>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold tracking-wide text-secondary-foreground uppercase">
            Admin
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const isActive =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);
                const count = counts[item.countKey];

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      className="data-[active=true]:bg-secondary data-[active=true]:font-semibold"
                      isActive={isActive}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                    {count !== undefined && count > 0 ? (
                      item.countKey === "inbox" ? (
                        <SidebarMenuBadge className="h-5 min-w-5 rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
                          {count}
                        </SidebarMenuBadge>
                      ) : (
                        <SidebarMenuBadge className="font-medium text-muted-foreground">
                          {count}
                        </SidebarMenuBadge>
                      )
                    ) : null}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  aria-disabled
                  className="pointer-events-none opacity-50"
                >
                  <a href="#batch-upload">
                    <Upload />
                    <span>Batch upload</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  aria-disabled
                  className="pointer-events-none opacity-50"
                >
                  <a href="#map">
                    <MapIcon />
                    <span>Map</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2.5">
          <Avatar className="size-8">
            <AvatarFallback className="bg-secondary text-xs font-bold text-secondary-foreground">
              {initialsFrom(userName ?? null, userEmail)}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col">
            {userName ? (
              <span className="truncate text-sm font-semibold text-sidebar-foreground">
                {userName}
              </span>
            ) : null}
            <span className="truncate text-xs text-muted-foreground">
              {userEmail ?? "Signed in"}
            </span>
          </div>
          <Button
            aria-label="Sign out"
            onClick={handleSignOut}
            size="icon-sm"
            title="Sign out"
            type="button"
            variant="ghost"
          >
            <LogOut />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
