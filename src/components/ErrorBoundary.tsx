import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Dashboard rendering failed:', error, errorInfo.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <section className="max-w-lg rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-lg font-semibold text-gray-900">The dashboard could not be displayed</h1>
            <p className="mt-2 text-sm text-gray-600">
              An unexpected rendering error occurred. Reload the page to try again.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Reload dashboard
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
