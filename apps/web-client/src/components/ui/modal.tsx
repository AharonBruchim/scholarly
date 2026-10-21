import { X } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";

interface IModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  closeLabel: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, description, closeLabel, children }: IModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-label={title}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(44rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-0 text-slate-100 shadow-2xl shadow-black/60 backdrop:bg-slate-950/80 backdrop:backdrop-blur-sm"
    >
      {open ? (
        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-white">{title}</h2>
              {description ? <p className="text-sm text-slate-400">{description}</p> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          {children}
        </div>
      ) : null}
    </dialog>
  );
}
