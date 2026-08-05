"use client";

import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
};

export function ConfirmDialog({ open, title, description, confirmLabel, onCancel, onConfirm }: ConfirmDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isConfirming) onCancel();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isConfirming, onCancel, open]);

  if (!open) return null;

  async function handleConfirm() {
    setIsConfirming(true);
    try {
      await onConfirm();
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <div aria-describedby={descriptionId} aria-labelledby={titleId} aria-modal="true" className="ui-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !isConfirming) onCancel(); }} role="dialog">
      <section className="ui-dialog" onMouseDown={(event) => event.stopPropagation()}>
        <h2 id={titleId}>{title}</h2>
        <p id={descriptionId}>{description}</p>
        <div className="button-row">
          <Button autoFocus disabled={isConfirming} onClick={onCancel} type="button" variant="secondary">Huy</Button>
          <Button disabled={isConfirming} onClick={() => void handleConfirm()} type="button" variant="danger">
            {isConfirming ? "Dang xu ly..." : confirmLabel}
          </Button>
        </div>
      </section>
    </div>
  );
}
