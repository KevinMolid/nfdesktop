import NatoAlphabet from "./NatoAlphabet";
import Calculator from "./Calculator";
import SafeWrapper from "./SafeWrapper";

type ToolsProps = {
  toggleActive: (name: string) => void;
};

const Tools = ({ toggleActive }: ToolsProps) => {
  return (
    <div className="container">
      <div className="page-header">
        <h1>Tools</h1>
      </div>

      <div className="widget-container">
        <SafeWrapper fallback={<div>Could not load Nato Alphabet</div>}>
          <NatoAlphabet toggleActive={toggleActive} />
        </SafeWrapper>

        <SafeWrapper fallback={<div>Could not load Calculator</div>}>
          <Calculator />
        </SafeWrapper>
      </div>
    </div>
  );
};

export default Tools;
