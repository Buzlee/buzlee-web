// PORTED FROM buzlee-app/src/features/discovery/lib/group-flyers-by-time-period.ts — keep in sync; see docs/admin-sync.md
import { getFlyerCurrentOrNextOccurrenceWindow } from "@/entities/flyer/lib/flyer-helper";
import type { FlyerWithDetails } from "@/entities/flyer/model/types";

/**
 * Groups flyers into time-based sections: This Week, Next Week, Upcoming
 */
export function groupFlyersByTimePeriod(flyers: FlyerWithDetails[]) {
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const dayOfWeek = startOfToday.getDay();
  const endOfThisWeek = new Date(startOfToday);
  endOfThisWeek.setDate(startOfToday.getDate() + (7 - dayOfWeek));

  const endOfNextWeek = new Date(endOfThisWeek);
  endOfNextWeek.setDate(endOfThisWeek.getDate() + 7);

  const thisWeek: FlyerWithDetails[] = [];
  const nextWeek: FlyerWithDetails[] = [];
  const upcoming: FlyerWithDetails[] = [];

  flyers.forEach((flyer) => {
    const { start: eventStart, end: eventEnd } =
      getFlyerCurrentOrNextOccurrenceWindow(flyer, startOfToday);

    if (eventStart < endOfThisWeek && eventEnd >= startOfToday) {
      thisWeek.push(flyer);
    } else if (eventStart < endOfNextWeek && eventEnd >= startOfToday) {
      nextWeek.push(flyer);
    } else if (eventEnd >= startOfToday) {
      upcoming.push(flyer);
    }
  });

  const sections: { title: string; data: FlyerWithDetails[] }[] = [];

  if (thisWeek.length > 0) {
    sections.push({ title: "This Week", data: thisWeek });
  }
  if (nextWeek.length > 0) {
    sections.push({ title: "Next Week", data: nextWeek });
  }
  if (upcoming.length > 0) {
    sections.push({ title: "Upcoming", data: upcoming });
  }

  return sections;
}
