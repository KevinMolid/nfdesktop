import { useState, useEffect } from "react";
import bcrypt from "bcryptjs";
import { collection, addDoc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";

type UsersProps = {
  user: {
    username: string;
    role: string;
  }
};

const Users = ({user}: UsersProps) => {
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [users, setUsers] = useState<any[]>([])
  const [isCreateActive, setIsCreateActive] = useState(false)

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const userList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(userList);
    });

    return () => unsubscribe();
  }, []);

  const toggleCreateActive = () => {
    setIsCreateActive(!isCreateActive)
  }

  const registerUser = async (username: string, pin: string) => {
    if (username.length !== 3 || pin.length !== 4) {
      setError("Brukernavn må inneholde 3 bokstaver og PIN må bestå av 4 siffer.");
      return;
    }

    try {
      const hashedPin = await bcrypt.hash(pin, 10);

      await addDoc(collection(db, "users"), {
        username: username.toUpperCase(),
        pinHash: hashedPin,
        role: "user",
      });

      setSuccess(`Brukeren ${username.toUpperCase()} ble opprettet!`);
      setUsername("");
      setPin("");
      setError("");
    } catch (error) {
      console.error("Error registering user:", error);
      setError("Registration failed.");
    }
  };

  return (
        <div className="card has-header grow-1">
      <div className="card-header">
        <h3 className="card-title">Brukere</h3>
        {!isCreateActive && user.role === "admin" && <div className="icon-container">
          <i className="fa-solid fa-plus blue icon-md hover" onClick={toggleCreateActive}></i>
        </div>}
      </div>

      <div className="card-body">

        {isCreateActive && <div className="create-task-box">
            Opprett ny bruker
            <div className="create-task-input-container">
              <input
                type="text"
                placeholder="Brukernavn"
                value={username}
                maxLength={3}
                onChange={(e) => setUsername(e.target.value.toUpperCase())}
              />
              <input
                type="password"
                placeholder="PIN-kode"
                value={pin}
                maxLength={4}
                onChange={(e) => setPin(e.target.value)}
              />
              <div className="button-group">
                <button onClick={() => registerUser(username, pin)}>Opprett</button>
                <i className="fa-solid fa-cancel red red-hover icon-md hover" onClick={toggleCreateActive}></i>
              </div>
          </div>
        </div>}

        {error && <p style={{ color: "red" }}>{error}</p>}
        {success && <p style={{ color: "green" }}>{success}</p>}

        <ul>
          {users.map((user) => (
            <li key={user.id} className="userlist">
              <p><strong className="user">{user.username}</strong></p>
              <p>{user.role === "admin" ? "Admin" : "Bruker"}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default Users