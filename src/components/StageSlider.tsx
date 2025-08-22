import "./StageSlider.css";

type StageSliderProps = {
  value: string;
  onChange: (val: string) => void;
  labels: string[];
};

const pepperColors = ["#4CAF50", "#FFC107", "#FF9800", "#F44336"]; // green, yellow, orange, red

const StageSlider = ({ value, onChange, labels }: StageSliderProps) => {
  const currentIndex = labels.indexOf(value);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.target.value, 10);
    onChange(labels[index]);
  };

  return (
    <div className="stage-slider">

      {/* peppers */}
      <div className="slider-labels">
        {labels.map((_, i) => (
          <span
            key={i}
            className={i === currentIndex ? "active" : ""}
            onClick={() => onChange(labels[i])}
          >
            <i
              className="fa-solid fa-pepper-hot"
              style={{ color: pepperColors[i] }}
            ></i>
          </span>
        ))}
      </div>

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
      </div>

      {/* show selected label above */}
      <div className="selected-label">{labels[currentIndex]}</div>
    </div>
  );
};

export default StageSlider;
