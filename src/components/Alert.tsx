type AlertProps = {
  alert: {
    text: string;
    type: "success" | "error" | "info" | "warning" | "";
  };
  onClose: () => void;
};

const Alert = ({ alert, onClose }: AlertProps) => {
  const kind = alert.type || "success"; // default style
  return (
    <div className={`alert alert--${kind}`}>
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
