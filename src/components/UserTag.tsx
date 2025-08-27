import avatar from "../assets/defaultAvatar.png";
import { useState, useRef, useEffect } from "react";
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

import DarkModeToggle from "./DarkModeToggle";

type UserTagProps = {
  username: string;
  onLogout: () => void;
};

const UserTag = ({ username, onLogout }: UserTagProps) => {
  const [isDropdownActive, setIsDropdownActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showPinForm, setShowPinForm] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [feedback, setFeedback] = useState("");

  const toggleDropdown = () => {
    setIsDropdownActive(!isDropdownActive);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownActive(false);
      }
    };

    if (isDropdownActive) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownActive]);

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
        where("username", "==", username.toUpperCase())
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
    <div className="usertag-container" ref={containerRef}>
      <div className="user-tag" onClick={toggleDropdown}>
        <img src={avatar} alt="" className="avatar" />
      </div>

      {isDropdownActive && (
        <div className="usertag-dropdown">
          <DarkModeToggle />
          <div
            className="dropdown-item default-select hover-border"
            onClick={() => {
              setShowPinForm(true);
              setIsDropdownActive(false);
            }}
          >
            <div className="dropdown-item-icon-container">
              <i className="fa-solid fa-asterisk grey m-l-1"></i>
            </div>
            <div className="dropdown-item-text-container">Change PIN</div>
          </div>
          <div
            className="dropdown-item default-select hover-border"
            onClick={onLogout}
          >
            <div className="dropdown-item-icon-container">
              <i className="fa-solid fa-sign-out grey m-l-1"></i>
            </div>
            <div className="dropdown-item-text-container">Sign out</div>
          </div>
        </div>
      )}

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

export default UserTag;
