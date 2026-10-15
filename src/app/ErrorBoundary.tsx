import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { error: Error | null };

/** Last line of defence: an unexpected render error shows a recovery screen, not a blank page. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // No remote error reporting is configured; log locally for development.
    console.error('The Alternate Timeline hit an unexpected error.', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="container-page flex min-h-dvh flex-col justify-center py-16">
        <h1 className="inscription text-3xl text-parchment">Something went wrong</h1>
        <p className="prose-atlas mt-4">
          This page stopped working because of an error in the app. Reloading usually fixes it. Your settings are kept.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
            Reload page
          </button>
          <a href="/" className="btn btn-secondary">
            Go to home page
          </a>
        </div>
      </div>
    );
  }
}
