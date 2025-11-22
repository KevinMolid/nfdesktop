// src/components/AppVersionControl.tsx
import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import Button from "./Button";

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
    <div className="card gap-2">
      <h3 className="card-title">App version</h3>
      <div className="flex items-center gap-2 flex-wrap">
        <input
          className="text-2xl bg-(--dash-bg-color) py-2 px-4 w-full max-w-32"
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          placeholder="e.g. 8"
        />
        <Button
          disabled={user.role !== "admin"}
          onClick={save}
          iconLeft={<i className="fa-solid fa-save" />}
        >
          Update
        </Button>
      </div>
    </div>
  );
}
