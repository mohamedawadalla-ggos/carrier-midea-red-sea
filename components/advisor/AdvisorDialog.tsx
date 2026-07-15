"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { Locale } from "@/content/site";
import { advisorCopy } from "@/content/ac-advisor-copy";

export function AdvisorDialog({ locale, open, titleId, children, onClose }: { locale: Locale; open: boolean; titleId: string; children: ReactNode; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const t = advisorCopy[locale];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose, open]);

  return <dialog ref={dialogRef} className="coolpet-dialog" aria-labelledby={titleId} onCancel={onClose} onClose={() => { if (open) onClose(); }}>
    <button className="coolpet-close" type="button" onClick={onClose} aria-label={t.close}>×</button>
    {children}
  </dialog>;
}
