interface Props {
  open: boolean;
  contactName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteContactDialog({ open, contactName, onClose, onConfirm }: Props) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6">
        <h3 className="text-xl font-semibold text-white">Confirm deletion</h3>
        <p className="mt-3 text-sm text-slate-300">
          Are you sure you want to delete {contactName}?
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-600 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md bg-red-500 px-3 py-2 text-sm font-medium text-white hover:bg-red-400"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
