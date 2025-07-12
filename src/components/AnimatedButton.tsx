import "./AnimatedButton.css";

type AnimatedButtonProps = {
  onClick?: () => void;
  children?: React.ReactNode;
};

export const AnimatedButton = ({ onClick, children }: AnimatedButtonProps) => {
  return (
    <button className="animated-btn" onClick={onClick}>
      <span className="btn-content">{children}</span>
      <span className="btn-glow"></span>
    </button>
  );
};
