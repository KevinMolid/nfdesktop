// src/components/AppVersionControl.tsx
import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export default function AppVersionControl() {
  const [value, setValue] = useState<string>("");

  useEffect(() => {
    const ref = doc(db, "meta", "app");
    return onSnapshot(ref, (snap) => {
      const v = snap.data()?.version;
      setValue(v != null ? String(v) : "");
    });
  }, []);

  const save = async () => {
    const n = Number(value);
    if (!Number.isFinite(n)) return alert("Please enter a number");
    await setDoc(doc(db, "meta", "app"), { version: n }, { merge: true });
  };

  return (
    <div className="card">
      <h4>App version (number)</h4>
      <input
        className="input m-r-1"
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && save()}
        placeholder="e.g. 8"
      />
      <button className="save-btn" onClick={save}>
        <i className="fa-solid fa-save" /> Save
      </button>
    </div>
  );
}
