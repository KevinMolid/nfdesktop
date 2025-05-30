import "./StageSlider.css";

type StageSliderProps = {
  value: string;
  onChange: (val: string) => void;
  labels: string[];
};

const StageSlider = ({ value, onChange, labels }: StageSliderProps) => {
  const currentIndex = labels.indexOf(value);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.target.value, 10);
    onChange(labels[index]);
  };

  return (
    <div className="stage-slider">
      <div className="slider-wrapper">
        <input
          type="range"
          min="0"
          max={labels.length - 1}
          value={currentIndex}
          step="1"
          onChange={handleSliderChange}
          className="slider"
        />
        <div className="slider-labels">
          {labels.map((label, i) => (
            <span
              key={label}
              className={i === currentIndex ? "active" : ""}
              onClick={() => onChange(label)}
              style={{ cursor: "pointer" }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StageSlider;
