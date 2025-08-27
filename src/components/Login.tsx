import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import bcrypt from "bcryptjs";
import logoB from "../assets/logo-b.png";
import logoBW from "../assets/logo-bw.png";

const Login = ({ onLogin }: { onLogin: (user: any) => void }) => {
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.getAttribute("data-theme") === "dark";
  });
  const [showPin, setShowPin] = useState(false);

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

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault(); // Prevent form reload
    setError("");

    try {
      const q = query(
        collection(db, "users"),
        where("username", "==", username.toUpperCase())
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setError("Incorrect username or PIN");
        return;
      }

      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();

      const isMatch = await bcrypt.compare(pin, userData.pinHash);

      if (isMatch) {
        onLogin({ id: userDoc.id, ...userData });
      } else {
        setError("Incorrect username or PIN.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Noe gikk galt.");
    }
  };

  return (
    <form className="login-container" onSubmit={handleLogin}>
      <div className="logo">
        <a href="https://www.norronafly.com/" target="_blank">
          <img
            src={isDarkMode ? logoBW : logoB}
            alt="Norrønafly logo"
            className="nflogo"
          />
        </a>
      </div>
      {/* Username */}
      <input
        className="login-input"
        type="text"
        placeholder="USR"
        maxLength={3}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      {/* PIN */}
      <div className="pin-input-container">
        <input
          className="pin-input"
          type={showPin ? "text " : "password"}
          placeholder="••••"
          maxLength={4}
          value={pin}
          onChange={(e) => {
            const numericValue = e.target.value.replace(/\D/g, ""); // Remove non-digits
            setPin(numericValue);
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

      <button type="submit" className="btn login-btn">
        <i className="fa-solid fa-right-to-bracket"></i>
        Sign in
      </button>
      <div className="pin-feedback-container">
        {error && <p className="login-error">{error}</p>}
      </div>
    </form>
  );
};

export default Login;
