"use client";

import { useEffect, useRef } from "react";

type ReviewShortcutHandlers = {
  onPrev: () => void;
  onNext: () => void;
  onApprove: () => void;
  onReject: () => void;
};

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  );
}

/**
 * Review-queue keyboard shortcuts: ArrowUp/ArrowDown move the selection,
 * A approves, R opens the reject dialog. Inert while `enabled` is false,
 * while any dialog is open, or while focus is in a text field.
 */
export function useReviewShortcuts(
  enabled: boolean,
  handlers: ReviewShortcutHandlers,
) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) {
        return;
      }

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          handlersRef.current.onNext();
          break;
        case "ArrowUp":
          event.preventDefault();
          handlersRef.current.onPrev();
          break;
        case "a":
        case "A":
          handlersRef.current.onApprove();
          break;
        case "r":
        case "R":
          handlersRef.current.onReject();
          break;
        default:
          break;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
