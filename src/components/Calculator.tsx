import { useState } from "react";

function Calculator() {
  const [display, setDisplay] = useState("");

  function updateDisplay(token: any) {
    if (display == "") {
      setDisplay(token);
    } else {
      setDisplay(display + token);
    }
  }

  function calculate() {
    console.log("Hello I calculate for you");
    const results = eval(display);
    setDisplay(results);
  }

  return (
    <div className="card has-header grow">
        <div className="card-header">
        <h3 className="card-title">Calculator</h3>
      </div>

      <div className="sm:hidden">
        Please make your app window bigger to see this app.
      </div>
      <div className="hidden sm:flex flex-col gap-2 App w-full max-w-60 bg-(--bg4-color) p-4 rounded-xl shadow">
        <div className="bg-(--bg2-color) py-2 px-4 min-h-10 rounded-md my-2 text-lg text-(--text2-color) font-semibold">{display}</div>
        <div className="flex justify-between gap-1 text-lg text-(--text2-color) font-semibold">
          <button
            onClick={() => updateDisplay("7")}
            className="p-2 bg-(--bg2-color) w-20 rounded-xl shadow-md cursor-pointer"
          >
            7
          </button>
          <button
            onClick={() => updateDisplay("8")}
            className="p-2 bg-(--bg2-color) w-20 rounded-xl shadow-md cursor-pointer"
          >
            8
          </button>
          <button
            onClick={() => updateDisplay("9")}
            className="p-2 bg-(--bg2-color) w-20 rounded-xl shadow-md cursor-pointer"
          >
            9
          </button>
          <button
            onClick={() => updateDisplay("/")}
            className="p-2 bg-(--sticker-blue-color) font-bold w-20 rounded-xl shadow-md cursor-pointer"
          >
            <i className="fa-solid fa-divide"></i>
          </button>
        </div>
        <div className="flex justify-between gap-1 text-lg text-(--text2-color) font-semibold">
          <button
            onClick={() => updateDisplay("4")}
            className="p-2 bg-(--bg2-color) w-20 rounded-xl shadow-md cursor-pointer"
          >
            4
          </button>
          <button
            onClick={() => updateDisplay("5")}
            className="p-2 bg-(--bg2-color) w-20 rounded-xl shadow-md cursor-pointer"
          >
            5
          </button>
          <button
            onClick={() => updateDisplay("6")}
            className="p-2 bg-(--bg2-color) w-20 rounded-xl shadow-md cursor-pointer"
          >
            6
          </button>
          <button
            onClick={() => updateDisplay("*")}
            className="p-2 bg-(--sticker-blue-color) font-bold w-20 rounded-xl shadow-md cursor-pointer"
          >
            <i className="fa-solid fa-x"></i>
          </button>
        </div>
        <div className="flex justify-between gap-1 text-lg text-(--text2-color) font-semibold">
          <button
            onClick={() => updateDisplay("1")}
            className="p-2 bg-(--bg2-color) w-20 rounded-xl shadow-md cursor-pointer"
          >
            1
          </button>
          <button
            onClick={() => updateDisplay("2")}
            className="p-2 bg-(--bg2-color) w-20 rounded-xl shadow-md cursor-pointer"
          >
            2
          </button>
          <button
            onClick={() => updateDisplay("3")}
            className="p-2 bg-(--bg2-color) w-20 rounded-xl shadow-md cursor-pointer"
          >
            3
          </button>
          <button
            onClick={() => updateDisplay("-")}
            className="p-2 bg-(--sticker-blue-color) font-bold w-20 rounded-xl shadow-md cursor-pointer"
          >
            <i className="fa-solid fa-minus"></i>
          </button>
        </div>
        <div className="flex justify-between gap-1 mb-2 text-lg text-(--text2-color) font-semibold">
          <button
            onClick={() => updateDisplay("0")}
            className="p-2 bg-(--bg2-color) w-20 rounded-xl shadow-md cursor-pointer"
          >
            0
          </button>
          <button
            onClick={() => setDisplay("")}
            className="p-2 bg-(--sticker-red-color) w-20 rounded-xl shadow-md cursor-pointer"
          >
            C
          </button>
          <button
            onClick={calculate}
            className="p-2 bg-(--sticker-green-color) w-20 rounded-xl shadow-md cursor-pointer"
          >
            <i className="fa-solid fa-equals"></i>
          </button>
          <button
            onClick={() => updateDisplay("+")}
            className="p-2 bg-(--sticker-blue-color) font-bold w-20 rounded-xl shadow-md cursor-pointer"
          >
            <i className="fa-solid fa-plus"></i>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Calculator;
