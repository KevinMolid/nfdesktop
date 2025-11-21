import AppVersionControl from "./AppVersionControl";

import DarkModeToggle from "./DarkModeToggle";

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
};

const Settings = ({ user }: SettingsProps) => {
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

      <DarkModeToggle />

      <div
            className="dropdown-item default-select hover-border"
            onClick={() => {
              setShowPinForm(true);
            }}
          >
            <div className="dropdown-item-icon-container">
              <i className="fa-solid fa-asterisk grey m-l-1"></i>
            </div>
            <div className="dropdown-item-text-container">Change PIN</div>
          </div>

      {user.role === "admin" && <AppVersionControl user={user}/>}

      {showPinForm && (
        <div className="pin-box">
          <h3 className="pin-heading">Change PIN code</h3>
          <div className="pin-form">
            <label htmlFor="new-pin" className="pin-label">
              New PIN:
            </label>
            <div className="pin-input-container">
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
              <button className="pin-btn save-btn" onClick={handlePinUpdate}>
                <i className="fa-solid fa-floppy-disk"></i> Save
              </button>
              <button className="pin-btn pin-btn-red" onClick={cancelPINupdate}>
                <i className="fa-solid fa-ban"></i> Cancel
              </button>
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
