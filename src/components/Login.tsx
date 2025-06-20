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

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.getAttribute("data-theme") === "dark";
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
        setError("Feil brukernavn eller PIN.");
        return;
      }

      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();

      const isMatch = await bcrypt.compare(pin, userData.pinHash);

      if (isMatch) {
        onLogin({ id: userDoc.id, ...userData });
      } else {
        setError("Feil brukernavn eller PIN.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Noe gikk galt.");
    }
  };

  return (
    <form className="login-container" onSubmit={handleLogin}>
      <div className='logo'>
        <a href="https://www.norronafly.com/" target="_blank">
          <img src={isDarkMode ? logoBW : logoB}
            alt="Norrønafly logo" className='nflogo'/>
        </a>
      </div>
      <input
        type="text"
        placeholder="Brukernavn"
        maxLength={3}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="PIN-kode"
        maxLength={4}
        value={pin}
        onChange={(e) => {
              const numericValue = e.target.value.replace(/\D/g, ""); // Remove non-digits
              setPin(numericValue);
            }}
      />
      <button type="submit" className="btn login-btn">Logg inn</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
};

export default Login;
