import "./RadioButton.css";

const RadioButton = ({
  value,
  onChange,
  labels
}: {
  value: string;
  onChange: (newValue: string) => void;
  labels: [string, string, string];
}) => {
  return (
    <div>
        <div className="label">
            {labels[0]}
        </div>
        <div className="label">
            {labels[1]}
        </div>
        <div className="label">
            {labels[2]}
        </div>
    </div>
  )
}

export default RadioButton