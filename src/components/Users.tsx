import { useState, useEffect } from "react";
import avatar from "../assets/defaultAvatar.png";

import bcrypt from "bcryptjs";
import {
  doc,
  updateDoc,
  collection,
  addDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";

type UsersProps = {
  user: {
    username: string;
    name?: string;
    nickname?: string;
    imgurl?: string;
    role: string;
  };
  toggleActive: (name: string) => void;
};

const Users = ({ user, toggleActive }: UsersProps) => {
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [isCreateActive, setIsCreateActive] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editNickname, setEditNickname] = useState("");
  const [isEditingImg, setIsEditingImg] = useState<boolean>(false);
  const [newImgUrl, setNewImgUrl] = useState<string>("");

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const userList = snapshot.docs
        .map((doc) => {
          const data = doc.data() as {
            username: string;
            name?: string;
            imgurl?: string;
            nickname?: string;
            role: string;
          };
          return { id: doc.id, ...data };
        })
        .sort((a, b) => a.username.localeCompare(b.username));
      setUsers(userList);
    });

    return () => unsubscribe();
  }, []);

  const toggleCreateActive = () => {
    setIsCreateActive(!isCreateActive);
  };

  const registerUser = async (username: string, pin: string) => {
    if (username.length !== 3 || pin.length !== 4) {
      setError(
        "Username must consist of 3 letters and PIN must consist of 4 digits."
      );
      return;
    }

    try {
      const hashedPin = await bcrypt.hash(pin, 10);

      await addDoc(collection(db, "users"), {
        username: username.toUpperCase(),
        name: "",
        nickname: "",
        imgurl: "",
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

  const handleSaveUser = async () => {
    if (!selectedUser) return;
    const ref = doc(db, "users", selectedUser.id);
    await updateDoc(ref, {
      name: editName,
      nickname: editNickname,
      imgurl: newImgUrl,
    });
    setSelectedUser(null);
  };

  return (
    <div className="card has-header grow-1">
      <div className="card-header">
        <h3 className="card-title">Users</h3>
        <div className="card-header-right">
          {!isCreateActive && user.role === "admin" && (
            <button onClick={toggleCreateActive}>
              <i className="fa-solid fa-plus grey icon-md hover"></i>
              Add
            </button>
          )}
        </div>
      </div>

      <div className="card-body">
        {isCreateActive && (
          <div className="create-task-box">
            Create new user
            <div className="create-task-input-container">
              <input
                type="text"
                placeholder="Username"
                value={username}
                maxLength={3}
                onChange={(e) => setUsername(e.target.value.toUpperCase())}
              />
              <input
                type="password"
                placeholder="PIN-code"
                value={pin}
                maxLength={4}
                onChange={(e) => setPin(e.target.value)}
              />
              <div className="button-group">
                <button
                  className="save-btn"
                  onClick={() => registerUser(username, pin)}
                >
                  <i className="fa-solid fa-check"></i>
                  Confirm
                </button>
                <button onClick={toggleCreateActive} className="delete-btn">
                  <i className="fa-solid fa-cancel"></i>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {error && <p style={{ color: "red" }}>{error}</p>}
        {success && <p style={{ color: "green" }}>{success}</p>}

        <ul>
          <li className="userlist">
            <h4>Code</h4>
            <h4>Name</h4>
            <h4>Role</h4>
          </li>
          {users.map((u) => (
            <li key={u.id} className="userlist">
              <p>
                <strong className="user">{u.username}</strong>
              </p>
              <p className="user-name">
                <span
                  style={{
                    cursor: user.role === "admin" ? "pointer" : "default",
                  }}
                  onClick={() => {
                    if (user.role === "admin") {
                      setSelectedUser(u);
                      setEditName(u.name ?? "");
                      setEditNickname(u.nickname ?? "");
                    }
                  }}
                >
                  {u.name || <em>(No name)</em>}
                </span>
              </p>
              <p>{u.role === "admin" ? "Admin" : "User"}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Modal or Popup */}
      {selectedUser && (
        <div className="edit-user-container">
          <h3>Edit user: {selectedUser.username}</h3>
          <div className="edit-img-container">
            <img
              src={selectedUser.imgurl || avatar}
              alt=""
              className="avatar-large"
            />
            <button
              className="edit-img-btn"
              onClick={() => setIsEditingImg(!isEditingImg)}
            >
              <i className="fa-solid fa-pencil"></i>
            </button>
          </div>
          {isEditingImg && (
            <>
              <label htmlFor="imgurl">Image URL:</label>
              <input
                id="imgurl"
                value={newImgUrl}
                onChange={(e) => setNewImgUrl(e.target.value)}
              />
            </>
          )}
          <label htmlFor="name">Name:</label>
          <input
            id="name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
          <label htmlFor="nickname">Nickname:</label>
          <input
            id="nickname"
            value={editNickname}
            onChange={(e) => setEditNickname(e.target.value)}
          />
          <div className="edit-user-btn-container">
            <button className="save-btn" onClick={handleSaveUser}>
              <i className="fa-solid fa-check"></i>
              Save
            </button>
            <button
              className="delete-btn"
              onClick={() => setSelectedUser(null)}
            >
              <i className="fa-solid fa-cancel"></i>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
