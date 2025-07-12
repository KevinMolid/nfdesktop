import { Component, ReactNode } from "react";

type SafeWrapperProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

type SafeWrapperState = {
  hasError: boolean;
};

class SafeWrapper extends Component<SafeWrapperProps, SafeWrapperState> {
  constructor(props: SafeWrapperProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): SafeWrapperState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    console.error("Caught error in SafeWrapper:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }

    return this.props.children;
  }
}

export default SafeWrapper;
