const ToggleSwitch = ({
  value,
  onChange,
  labels,
}: {
  value: string;
  onChange: (newValue: string) => void;
  labels: [string, string];
}) => {
  return (
    <div className="toggle-switch">
      <button
        className={`toggle-option ${value === labels[0] ? "active" : ""}`}
        onClick={() => onChange(labels[0])}
      >
        {labels[0]}
      </button>
      <button
        className={`toggle-option ${value === labels[1] ? "active" : ""}`}
        onClick={() => onChange(labels[1])}
      >
        {labels[1]}
      </button>
    </div>
  );
};

export default ToggleSwitch;
