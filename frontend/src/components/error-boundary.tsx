import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
          <div className="w-full max-w-md text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-danger-100 dark:bg-danger-900/30">
              <AlertTriangle className="h-8 w-8 text-danger-600 dark:text-danger-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Something went wrong</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              An unexpected error occurred while loading this page.
            </p>
            {this.state.error && (
              <p className="mt-2 rounded-lg bg-gray-100 p-3 font-mono text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                {this.state.error.message}
              </p>
            )}
            <Button onClick={this.handleReset} className="mt-6">
              <RefreshCw className="mr-2 h-4 w-4" />
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
