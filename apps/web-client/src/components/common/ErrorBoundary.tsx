import { Component, type ReactNode } from "react";

type Props = { children: ReactNode; fallback?: ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
          <h2 className="text-2xl font-semibold text-white">Something went wrong</h2>
          <p className="text-sm text-slate-300">Please refresh the page or try again later.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400"
          >
            Refresh
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
