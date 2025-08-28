type RadioProps = {
  value: string;
  onChange: (newValue: string) => void;
  labels: string[];
};

const RadioButton = ({ value, onChange, labels }: RadioProps) => {
  return (
    <div className="radiobutton">
      {labels.map((label, idx) => (
        <div
          key={idx}
          className={`label 
            ${idx === 0 ? "label-left" : ""} 
            ${idx === labels.length - 1 ? "label-right" : ""} 
            ${value === label ? "active" : ""}`}
          onClick={() => onChange(label)}
        >
          {label}
        </div>
      ))}
    </div>
  );
};

export default RadioButton;
