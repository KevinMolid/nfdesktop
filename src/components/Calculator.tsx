import { useState } from "react";

function Calculator() {
  const [display, setDisplay] = useState("");
  const [lastDisplay, setLastDisplay] = useState("");

  function formatDisplay(expr: string) {
    return expr
      .replace(/(\+|\-|\*|\/)/g, " $1 ") // add spaces around operators
      .replace(/\s+/g, " ")             // collapse multiple spaces
      .trim();
  }

  function updateDisplay(token: string) {
    const operators = ["+", "-", "*", "/"];

    // If the new token is an operator
    if (operators.includes(token)) {
      // If display is empty, allow starting with an operator (e.g. "-")
      if (display === "") {
        setDisplay(token);
        return;
      }

      const lastChar = display[display.length - 1];

      // If the last char is also an operator, replace it
      if (operators.includes(lastChar)) {
        setDisplay(display.slice(0, -1) + token);
        return;
      }
    }

    // Default case: just append
    setDisplay(display + token);
  }

  function clearEntry() {
    setDisplay((prev) => prev.slice(0, -1));
  }

  function clearAll() {
    setDisplay("");
    setLastDisplay("");
  }

  function calculate() {
    if (!display) return;

    const lastChar = display[display.length - 1];
    const invalidEndings = ["+", "-", "*", "/", ".", "%"];

    // Always update lastDisplay, even if invalid expression
    setLastDisplay(display + " =");

    // If the expression ends in an operator, do NOT evaluate it
    if (invalidEndings.includes(lastChar)) {
      // Leave `display` untouched
      return;
    }

    // 2) Convert percent syntax
    const expressionWithPercent = display.replace(
      /(\d+(\.\d+)?)%(\d+(\.\d+)?)/g,
      (_match, left, _leftDec, right) => `(${left}/100*${right})`
    );

    try {
      const result = eval(expressionWithPercent) as number;

      const rounded = parseFloat(result.toFixed(10));

      setDisplay(rounded.toString());
    } catch {
      // fallback: do not change invalid expressions
      setDisplay(display);
    }
  }

  return (
    <div className="card has-header grow">
        <div className="card-header">
        <h3 className="card-title">Calculator</h3>
      </div>

      <div className="flex flex-col gap-1 App w-full max-w-84">
        <div className="bg-(--bg3-color) py-1 flex gap-1 flex-col justify-center items-end px-4 min-h-14 rounded-md mb-1 text-lg text-(--text2-color) text-right">
          <div className="h-4 flex items-center text-xs opacity-70">{formatDisplay(lastDisplay)}</div>
          <div className="h-6 flex items-center font-semibold">{formatDisplay(display)}</div>
        </div>
        <div className="grid grid-cols-4 gap-1 text-lg text-(--text2-color) font-semibold">
          <button
            onClick={clearAll}
            className="p-2 bg-(--bg5-color) hover:bg-(--text5-color) grow rounded-md cursor-pointer"
          >
            C
          </button>
          <button
            onClick={clearEntry}
            className="p-2 bg-(--bg5-color) hover:bg-(--text5-color) grow rounded-md cursor-pointer"
          >
            CE
          </button>
          <button
            onClick={() => updateDisplay("%")}
            className="p-2 bg-(--bg4-color) hover:bg-(--bg5-color) font-bold grow rounded-md cursor-pointer"
          >
            <i className="fa-solid fa-percent"></i>
          </button>
          <button
            onClick={() => updateDisplay("/")}
            className="p-2 bg-(--bg4-color) hover:bg-(--bg5-color) font-bold grow rounded-md cursor-pointer"
          >
            <i className="fa-solid fa-divide"></i>
          </button>
        </div>
        <div className="grid grid-cols-4 gap-1 text-lg text-(--text2-color) font-semibold">
          <button
            onClick={() => updateDisplay("7")}
            className="p-2 bg-(--bg3-color) hover:bg-(--bg4-color) rounded-md cursor-pointer"
          >
            7
          </button>
          <button
            onClick={() => updateDisplay("8")}
            className="p-2 bg-(--bg3-color) hover:bg-(--bg4-color) rounded-md cursor-pointer"
          >
            8
          </button>
          <button
            onClick={() => updateDisplay("9")}
            className="p-2 bg-(--bg3-color) hover:bg-(--bg4-color) rounded-md cursor-pointer"
          >
            9
          </button>
          <button
            onClick={() => updateDisplay("*")}
            className="p-2 bg-(--bg4-color) hover:bg-(--bg5-color) font-bold rounded-md cursor-pointer"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div className="grid grid-cols-4 gap-1 text-lg text-(--text2-color) font-semibold">
          <button
            onClick={() => updateDisplay("4")}
            className="p-2 bg-(--bg3-color) hover:bg-(--bg4-color) rounded-md cursor-pointer"
          >
            4
          </button>
          <button
            onClick={() => updateDisplay("5")}
            className="p-2 bg-(--bg3-color) hover:bg-(--bg4-color) rounded-md cursor-pointer"
          >
            5
          </button>
          <button
            onClick={() => updateDisplay("6")}
            className="p-2 bg-(--bg3-color) hover:bg-(--bg4-color) rounded-md cursor-pointer"
          >
            6
          </button>
          <button
            onClick={() => updateDisplay("-")}
            className="p-2 bg-(--bg4-color) hover:bg-(--bg5-color) font-bold rounded-md cursor-pointer"
          >
            <i className="fa-solid fa-minus"></i>
          </button>
        </div>
        <div className="grid grid-cols-4 gap-1 text-lg text-(--text2-color) font-semibold">
          <button
            onClick={() => updateDisplay("1")}
            className="p-2 bg-(--bg3-color) hover:bg-(--bg4-color) rounded-md cursor-pointer"
          >
            1
          </button>
          <button
            onClick={() => updateDisplay("2")}
            className="p-2 bg-(--bg3-color) hover:bg-(--bg4-color) rounded-md cursor-pointer"
          >
            2
          </button>
          <button
            onClick={() => updateDisplay("3")}
            className="p-2 bg-(--bg3-color) hover:bg-(--bg4-color) rounded-md cursor-pointer"
          >
            3
          </button>
          <button
            onClick={() => updateDisplay("+")}
            className="p-2 bg-(--bg4-color) hover:bg-(--bg5-color) font-bold rounded-md cursor-pointer"
          >
            <i className="fa-solid fa-plus"></i>
          </button>
        </div>
        <div className="grid grid-cols-4 gap-1 text-lg text-(--text2-color) font-semibold">
          <button
            onClick={() => updateDisplay("0")}
            className="p-2 bg-(--bg3-color) hover:bg-(--bg4-color) rounded-md cursor-pointer col-span-2"
          >
            0
          </button>
          <button
            onClick={() => updateDisplay(".")}
            className="p-2 bg-(--bg3-color) hover:bg-(--bg4-color) rounded-md cursor-pointer"
          >
            .
          </button>
          <button
            onClick={calculate}
            className="p-2 bg-(--brand-color) hover:bg-(--brand2-color) rounded-md cursor-pointer"
          >
            <i className="fa-solid fa-equals"></i>
          </button>

        </div>
      </div>
    </div>
  );
}

export default Calculator;
