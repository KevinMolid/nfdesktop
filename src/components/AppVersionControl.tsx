// src/components/AppVersionControl.tsx
import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./firebase";

type User = {
  id: string;
  username: string;
  role: string;
};

type SettingsProps = {
  user: User;
};

export default function AppVersionControl({ user }: SettingsProps) {
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
      <h3>App version (number)</h3>
      <input
        className="input m-r-1 version-input"
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && save()}
        placeholder="e.g. 8"
      />
      <button className="save-btn version-btn" disabled={user.role !== "admin"} onClick={save}>
        <i className="fa-solid fa-save" /> Save
      </button>
    </div>
  );
}
