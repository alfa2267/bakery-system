import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert } from '../ui/Alert';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class GanttErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Gantt chart error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-4">
          <Alert variant="error" title="Chart Error">
            <p>There was an error loading the chart. Please try refreshing the page.</p>
            {this.state.error && (
              <p className="text-sm text-gray-600 mt-2">
                {this.state.error.message}
              </p>
            )}
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GanttErrorBoundary;