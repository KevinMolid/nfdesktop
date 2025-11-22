import { useState, useEffect, useRef } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import bcrypt from "bcryptjs";
import logoB from "../assets/logo-black-small.png";
import logoBW from "../assets/logo-white-small.png";

import Button from "./Button";

const LAST_USER_KEY = "lastLoggedInUser";

const Login = ({ onLogin }: { onLogin: (user: any) => void }) => {
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.getAttribute("data-theme") === "dark";
  });
  const [showPin, setShowPin] = useState(false);
  const [isSwitchingUser, setIsSwitchingUser] = useState(false);

  // Validation styling
  const [usernameError, setUsernameError] = useState(false);
  const [pinError, setPinError] = useState(false);

  const usernameInputRef = useRef<HTMLInputElement | null>(null);
  const pinInputRef = useRef<HTMLInputElement | null>(null);

  // NEW: guard against duplicate auto-logins
  const autoLoginRef = useRef(false);

  // Observe theme
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark =
        document.documentElement.getAttribute("data-theme") === "dark";
      setIsDarkMode(isDark);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  // Load last user
  useEffect(() => {
    const last = localStorage.getItem(LAST_USER_KEY);
    if (last) {
      setUsername(last);
      setIsSwitchingUser(false);
    } else {
      setIsSwitchingUser(true);
    }
  }, []);

  // Focus username when switching
  useEffect(() => {
    if (isSwitchingUser) {
      usernameInputRef.current?.focus();
    }
  }, [isSwitchingUser]);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");

    const uname = username.trim().toUpperCase();
    const isUsernameMissing = isSwitchingUser
      ? uname.length === 0
      : uname.length === 0;

    let newError = "";
    let usernameFieldError = false;
    let pinFieldError = false;

    if (isUsernameMissing && !pin) {
      newError = "Please enter your username and PIN.";
      usernameFieldError = true;
      pinFieldError = true;
    } else if (isUsernameMissing) {
      newError = "Please enter your username.";
      usernameFieldError = true;
    } else if (!pin) {
      newError = "Please enter your PIN.";
      pinFieldError = true;
    } else if (pin.length !== 4) {
      newError = "The PIN must consist of 4 digits.";
      pinFieldError = true;
    }

    if (newError) {
      setError(newError);
      setUsernameError(usernameFieldError);
      setPinError(pinFieldError);

      if (usernameFieldError) {
        setIsSwitchingUser(true);
        usernameInputRef.current?.focus();
      } else if (pinFieldError) {
        pinInputRef.current?.focus();
      }

      // allow future auto-login after user edits
      autoLoginRef.current = false;
      return;
    }

    try {
      const q = query(collection(db, "users"), where("username", "==", uname));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setError("Incorrect username or PIN.");
        autoLoginRef.current = false; // allow retry after corrections
        return;
      }

      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();

      const isMatch = await bcrypt.compare(pin, userData.pinHash);

      if (isMatch) {
        localStorage.setItem(LAST_USER_KEY, uname);
        onLogin({ id: userDoc.id, ...userData });
      } else {
        setError("Incorrect username or PIN.");
        autoLoginRef.current = false;
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Noe gikk galt.");
      autoLoginRef.current = false;
    }
  };

  const handleUsernameChange = (v: string) => {
    const next = v.replace(/\s/g, "").toUpperCase().slice(0, 3);
    setUsername(next);
    // clear username error & allow auto-login to trigger when valid
    if (next) setUsernameError(false);
    setError((prev) => (pinError || usernameError ? prev : "")); // optional
    autoLoginRef.current = false;
  };

  const handlePinChange = (v: string) => {
    const numericValue = v.replace(/\D/g, "").slice(0, 4);
    setPin(numericValue);
    if (numericValue.length === 4) {
      setPinError(false);
      if (!usernameError) setError("");
    }
    autoLoginRef.current = false;
  };

  const handleSwitchUser = () => {
    setIsSwitchingUser(true);
    setUsername("");
    setUsernameError(false); // do NOT mark red on switch
    autoLoginRef.current = false;
  };

  // NEW: auto-login effect when both fields are valid
  useEffect(() => {
    const ready = username.trim().length > 0 && pin.length === 4;

    if (ready && !autoLoginRef.current) {
      autoLoginRef.current = true; // lock to prevent double calls
      // slight microtask delay helps avoid race with state updates
      Promise.resolve().then(() => handleLogin());
    }
  }, [username, pin]); // deliberately not depending on isSwitchingUser

  return (
    <form className="login-container" onSubmit={handleLogin} noValidate>
      <div className="mb-8">
        <img src={isDarkMode ? logoBW : logoB} alt="Norrønafly logo" />
      </div>

      {!isSwitchingUser && (
        <Button
          variant="tertiary"
          type="button"
          title="Change user"
          aria-label="Switch user"
          onClick={handleSwitchUser}
          iconLeft={<i className="fa-solid fa-right-left"></i>}
        >
          Switch user
        </Button>
      )}

      {/* Username */}
      {!isSwitchingUser ? (
        <div
          className="last-user-row"
          style={{ display: "flex", gap: 8, alignItems: "center" }}
        >
          <span className="last-user-text" aria-label="Last logged in user">
            {username}
          </span>
        </div>
      ) : (
        <input
          ref={usernameInputRef}
          className={`login-input ${usernameError ? "container-invalid" : ""}`}
          type="text"
          placeholder="User"
          maxLength={3}
          value={username}
          autoComplete="new-username"
          onChange={(e) => handleUsernameChange(e.target.value)}
        />
      )}

      {/* PIN */}
      <div
        className={`pin-input-container ${pinError ? "container-invalid" : ""}`}
      >
        <input
          ref={pinInputRef}
          className="pin-input"
          type={showPin ? "text" : "password"}
          placeholder="PIN"
          maxLength={4}
          value={pin}
          onChange={(e) => handlePinChange(e.target.value)}
          inputMode="numeric"
          autoComplete="new-password"
          aria-label="PIN"
        />
        <div className="pin-input-placeholder">
          {showPin ? (
            <i
              className="fa-solid fa-eye"
              onClick={() => setShowPin(!showPin)}
              role="button"
              aria-label="Hide PIN"
              title="Hide PIN"
              tabIndex={0}
            />
          ) : (
            <i
              className="fa-solid fa-eye-slash"
              onClick={() => setShowPin(!showPin)}
              role="button"
              aria-label="Show PIN"
              title="Show PIN"
              tabIndex={0}
            />
          )}
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        iconLeft={<i className="fa-solid fa-right-to-bracket"></i>}
      >
        Sign in
      </Button>

      <div className="pin-feedback-container">
        {error && (
          <p className="bg-red-500 px-8 rounded-full py-2 absolute text-white font-semibold mt-12">
            {error}
          </p>
        )}
      </div>
    </form>
  );
};

export default Login;
