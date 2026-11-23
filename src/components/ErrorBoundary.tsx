import React, { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Good Luck Palace caught an error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#2A0812",
          color: "#F7F3EB",
          fontFamily: "sans-serif",
          padding: "2rem",
          textAlign: "center"
        }}>
          <h1 style={{ fontSize: "2rem", color: "#DFB76C", marginBottom: "1rem", fontFamily: "serif" }}>
            Good Luck Palace
          </h1>
          <p style={{ maxWidth: "500px", marginBottom: "1.5rem", opacity: 0.9 }}>
            We encountered a temporary rendering issue. Please reload the page to continue.
          </p>
          <div style={{
            background: "rgba(0,0,0,0.3)",
            padding: "1rem",
            borderRadius: "6px",
            marginBottom: "1.5rem",
            maxWidth: "600px",
            fontSize: "0.85rem",
            color: "#fca5a5",
            wordBreak: "break-word",
            textAlign: "left"
          }}>
            {this.state.error?.message || "Unknown error"}
          </div>
          <button
            onClick={() => window.location.href = "/"}
            style={{
              padding: "0.75rem 1.5rem",
              background: "#DFB76C",
              color: "#2A0812",
              border: "none",
              borderRadius: "4px",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "0.95rem"
            }}
          >
            Return to Homepage
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
