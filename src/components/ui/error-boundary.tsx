import React, { type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error captured by ErrorBoundary:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center border border-rose-500/20 bg-rose-500/5 rounded-2xl">
          <AlertTriangle className="size-8 text-rose-500 mb-2 animate-bounce" />
          <h3 className="font-mono text-sm font-semibold text-ink">Something went wrong</h3>
          <p className="text-xs text-ink-soft mt-1 max-w-md font-mono">
            {this.state.error?.message || "An unexpected error occurred in this section."}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-1.5 font-mono text-[0.68rem] uppercase font-semibold text-rose-600 hover:bg-rose-500/20 transition"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
