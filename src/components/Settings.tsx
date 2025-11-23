import AppVersionControl from "./AppVersionControl";
import { LogOut } from "lucide-react";

import DarkModeToggle from "./DarkModeToggle";
import Button from "./Button";

import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import bcrypt from "bcryptjs";

import { useState } from "react";

type User = {
  id: string;
  username: string;
  role: string;
};

type SettingsProps = {
  user: User;
  onLogout: () => void;
};

const Settings = ({ user, onLogout }: SettingsProps) => {
  const [showPinForm, setShowPinForm] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [feedback, setFeedback] = useState("");

  const handlePinUpdate = async () => {
    if (newPin.length !== 4) {
      setFeedback("The code must consist of 4 digits!");
      return;
    }

    try {
      const db = getFirestore();
      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where("username", "==", user.username.toUpperCase())
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userDocRef = doc(db, "users", userDoc.id);
        const hashedPin = await bcrypt.hash(newPin, 10);

        await updateDoc(userDocRef, { pinHash: hashedPin });

        setFeedback("PIN-kode oppdatert.");
        setShowPinForm(false);
        setNewPin("");
      } else {
        setFeedback("Bruker ikke funnet.");
      }
    } catch (error) {
      console.error("Error updating PIN:", error);
      setFeedback("En feil oppstod under oppdatering.");
    }
  };

  const cancelPINupdate = () => {
    setShowPinForm(false);
    setNewPin("");
    setShowPin(false);
    setFeedback("");
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Settings</h1>
      </div>

      <div className="flex flex-col sm:flex-row max-w-40 gap-1 mb-4">
        <DarkModeToggle />

        <Button
          variant="secondary"
          onClick={() => {
            setShowPinForm(true);
          }}
          iconLeft={<i className="fa-solid fa-asterisk"></i>}
        >
          <div className="dropdown-item-text-container">Change PIN</div>
        </Button>

        <Button
          variant="secondary"
          className="pin-btn pin-btn-red"
          onClick={onLogout}
          iconLeft={<LogOut />}
        >
          Log out
        </Button>
      </div>

      {user.role === "admin" && <AppVersionControl user={user} />}

      {showPinForm && (
        <div className="bg-(--dash-bg-color) p-4 h-full w-full justify-center fixed top-1/2 left-1/2 -translate-1/2 flex flex-col items-center">
          <h3 className="card-title mb-4">Change PIN code</h3>
          <div className="pin-form">
            <label htmlFor="new-pin" className="pin-label font-semibold">
              New PIN:
            </label>
            <div className="pin-input-container bg-red-400">
              <input
                id="new-pin"
                className="pin-input"
                type={showPin ? "text " : "password"}
                placeholder="••••"
                value={newPin}
                maxLength={4}
                onChange={(e) => {
                  const numericValue = e.target.value.replace(/\D/g, ""); // Remove non-digits
                  setNewPin(numericValue);
                }}
              />
              <div className="pin-input-placeholder">
                {showPin ? (
                  <i
                    className="fa-solid fa-eye"
                    onClick={() => setShowPin(!showPin)}
                  ></i>
                ) : (
                  <i
                    className="fa-solid fa-eye-slash"
                    onClick={() => setShowPin(!showPin)}
                  ></i>
                )}
              </div>
            </div>
            <div className="button-group">
              <Button
                onClick={handlePinUpdate}
                iconLeft={<i className="fa-solid fa-floppy-disk"></i>}
              >
                Save
              </Button>
              <Button
                variant="tertiary"
                onClick={cancelPINupdate}
                iconLeft={<i className="fa-solid fa-ban"></i>}
              >
                Cancel
              </Button>
            </div>
          </div>

          <div className="pin-feedback-container">
            {feedback && <p className="pin-feedback-message">{feedback}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
