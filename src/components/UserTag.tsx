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
      setFeedback("PIN må være 4 siffer.");
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
        <div className="pin-form">
          <h2>Endre PIN-kode</h2>
          <input
            className="pin-input"
            type="password"
            placeholder="Ny PIN"
            value={newPin}
            maxLength={4}
            onChange={(e) => {
              const numericValue = e.target.value.replace(/\D/g, ""); // Remove non-digits
              setNewPin(numericValue);
            }}
          />
          <div className="button-group">
            <button className="pin-btn pin-btn-green" onClick={handlePinUpdate}>
              Lagre
            </button>
            <button
              className="pin-btn pin-btn-red"
              onClick={() => setShowPinForm(false)}
            >
              Avbryt
            </button>
          </div>
          {feedback && <p className="feedback-message">{feedback}</p>}
        </div>
      )}
    </div>
  );
};

export default UserTag;
