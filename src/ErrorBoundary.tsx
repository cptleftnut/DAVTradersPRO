// @ts-nocheck
import React, { Component } from "react";

export class ErrorBoundary extends Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    if (error && typeof error.message === 'string' && (error.message.includes('Script error') || error.message.includes('ResizeObserver'))) {
      return { hasError: false, error: null };
    }
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    if (error && typeof error.message === 'string' && (error.message.includes('Script error') || error.message.includes('ResizeObserver'))) {
      return;
    }
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-rose-400 p-8 font-mono">
          <h1 className="text-xl font-bold mb-4">Something went wrong.</h1>
          <p className="text-sm bg-gray-900 border border-gray-800 p-4 rounded-lg">
            {this.state.error?.message || "Unknown error"}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
