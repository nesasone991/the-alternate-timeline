import { useEffect, useId, useRef } from 'react';

/**
 * Confirmation before erasing the saved campaign. Native <dialog>: focus is
 * trapped, Escape cancels, and the destructive action is never the default.
 */
export function RestartDialog({ open, onCancel, onConfirm }: { open: boolean; onCancel: () => void; onConfirm: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const keepRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const textId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
      keepRef.current?.focus();
    } else if (!open && dialog.open) {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="settings-dialog"
      aria-labelledby={titleId}
      aria-describedby={textId}
      onClose={onCancel}
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div className="p-5 sm:p-7">
        <h2 id={titleId} className="text-2xl">
          Start a new timeline?
        </h2>
        <p id={textId} className="mt-3">
          This erases your saved campaign in this browser, including this ending, and takes you back to the first
          decision. This cannot be undone.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button ref={keepRef} type="button" className="btn btn-secondary" onClick={onCancel}>
            Keep this timeline
          </button>
          <button type="button" className="btn btn-primary" onClick={onConfirm}>
            Erase it and start again
          </button>
        </div>
      </div>
    </dialog>
  );
}
