import { useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import bcrypt from "bcryptjs";
import logoB from "../assets/logo-b.png";

const Login = ({ onLogin }: { onLogin: (user: any) => void }) => {
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

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
        onLogin(userData);
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
          <img src={logoB} alt="Norrønafly logo" className='nflogo'/>
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
        onChange={(e) => setPin(e.target.value)}
      />
      <button type="submit" className="btn login-btn">Logg inn</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
};

export default Login;
