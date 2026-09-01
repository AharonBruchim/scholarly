interface Props {
  open: boolean;
  name: string;
  email: string;
  onClose: () => void;
  onChangeName: (val: string) => void;
  onChangeEmail: (val: string) => void;
  onConfirm: () => void;
}

export default function EditContactDialog({
  open,
  name,
  email,
  onClose,
  onChangeName,
  onChangeEmail,
  onConfirm,
}: Props) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6">
        <h3 className="text-xl font-semibold text-white">Edit contact</h3>

        <div className="mt-4 space-y-4">
          <label className="block text-sm text-slate-200">
            Name
            <input
              value={name}
              onChange={(event) => onChangeName(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100"
            />
          </label>

          <label className="block text-sm text-slate-200">
            Email
            <input
              value={email}
              onChange={(event) => onChangeEmail(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-950 px-3 py-2 text-slate-100"
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-slate-600 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="rounded-md bg-sky-500 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400">
            Update
          </button>
        </div>
      </div>
    </div>
  );
}
