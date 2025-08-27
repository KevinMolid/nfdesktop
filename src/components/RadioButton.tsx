import "./RadioButton.css";

const RadioButton = ({
  value,
  onChange,
  labels,
}: {
  value: string;
  onChange: (newValue: string) => void;
  labels: [string, string, string];
}) => {
  return (
    <div className="radiobutton">
      <div className="label label-left">{labels[0]}</div>
      <div className="label">{labels[1]}</div>
      <div className="label label-right">{labels[2]}</div>
    </div>
  );
};

export default RadioButton;
