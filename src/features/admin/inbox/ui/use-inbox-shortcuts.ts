"use client";

import { useEffect, useRef } from "react";

type InboxShortcutHandlers = {
  onReview: () => void;
  onSkip: () => void;
};

function isTypingTarget(target: HTMLElement): boolean {
  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  );
}

/** Focused controls own Return (a link or button activates itself). */
function ownsReturnKey(target: HTMLElement): boolean {
  return (
    target.closest(
      "a, button, input, textarea, select, summary, [role='button'], [role='link'], [role='menuitem'], [role='tab'], [role='checkbox'], [role='switch']",
    ) !== null
  );
}

/**
 * Inbox keyboard shortcuts: Return opens "Next up" (it is the default
 * button), S skips it. Inert while `enabled` is false, while a dialog is
 * open, or while focus is in a text field; Return also defers to whatever
 * control has focus.
 */
export function useInboxShortcuts(
  enabled: boolean,
  handlers: InboxShortcutHandlers,
) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.isComposing || event.repeat) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (!(event.target instanceof HTMLElement)) return;
      if (isTypingTarget(event.target)) return;
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) {
        return;
      }

      if (event.key === "Enter" && !event.shiftKey) {
        if (ownsReturnKey(event.target)) return;
        event.preventDefault();
        handlersRef.current.onReview();
      } else if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        handlersRef.current.onSkip();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
