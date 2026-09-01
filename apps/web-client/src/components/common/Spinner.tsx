export function Spinner() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-slate-700 border-t-sky-400 animate-spin"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
