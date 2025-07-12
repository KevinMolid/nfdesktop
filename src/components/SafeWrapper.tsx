// components/SafeWrapper.tsx
import { useState, useEffect } from "react";

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

const SafeWrapper = ({ children, fallback = null }: Props) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false); // Reset error when remounting
  }, [children]);

  try {
    if (hasError) return fallback;
    return <>{children}</>;
  } catch (e) {
    console.error("Component crashed:", e);
    setHasError(true);
    return fallback;
  }
};

export default SafeWrapper;
