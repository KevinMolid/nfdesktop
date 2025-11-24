import { useEffect, useState, useRef } from "react";

type ToastType = "success" | "error" | "info" | "warning" | "";

type AlertProps = {
  alert: {
    text: string;
    type: ToastType;
  };
  closing?: boolean;
  onClose: () => void;
  /** Time in ms before auto-hide. If undefined, no auto-hide. */
  autoHideDuration?: number;
};

const Alert: React.FC<AlertProps> = ({
  alert,
  closing = false,
  onClose,
  autoHideDuration,
}) => {
  const kind = alert.type || "success";

  const [visible, setVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const autoHideMs = autoHideDuration ?? 4000;

  // Mount: start hidden, then become visible to trigger slide-up
  useEffect(() => {
    const id = window.setTimeout(() => setVisible(true), 10);
    return () => window.clearTimeout(id);
  }, []);

  // Auto-hide (respect hover + closing state)
  useEffect(() => {
    if (!autoHideMs) return;

    if (isHovered || closing) {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    timeoutRef.current = window.setTimeout(() => {
      onClose();
    }, autoHideMs);

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
    // IMPORTANT: don't depend on `onClose` so timers don't reset
    // when parent re-renders or new alerts are added.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoHideMs, isHovered, closing]);

  const stateClass = !visible || closing ? "alert--hidden" : "alert--visible";

  return (
    <div
      className={`alert alert--${kind} ${stateClass}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
    >
      <p className="alert__text">{alert.text}</p>
      <button
        onClick={onClose}
        className="alert__close"
        aria-label="Close alert"
        title="Close"
      >
        <i className="fa-solid fa-x"></i>
      </button>
    </div>
  );
};

export default Alert;
