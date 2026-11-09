import { Component } from "react";

// Keeps a render error from leaving a blank white screen, which on a kiosk
// would otherwise stay up until someone restarts the device.
class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Render failed", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-gray-600">Something went wrong.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 rounded-xl bg-gray-100 text-sm font-medium"
        >
          Reload
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
