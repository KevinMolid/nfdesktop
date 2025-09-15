import { useState, useEffect, useRef } from "react";
import avatar from "../assets/defaultAvatar.png";

import bcrypt from "bcryptjs";
import {
  doc,
  updateDoc,
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  setDoc,
  Unsubscribe,
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

type GroupMembershipState = Record<
  string, // groupId
  { name: string; members: Set<string> } // Set of userIds
>;

const Userlist = ({ user, toggleActive }: UsersProps) => {
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

  // groupId -> { name, members:Set<userId> }
  const [groupMemberships, setGroupMemberships] =
    useState<GroupMembershipState>({});
  const membersUnsubsRef = useRef<Unsubscribe[]>([]);

  // Users listener
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

  // Groups + members listeners
  useEffect(() => {
    const unsubGroups = onSnapshot(
      collection(db, "usergroups"),
      (groupsSnap) => {
        // Clean up previous members listeners
        membersUnsubsRef.current.forEach((u) => u());
        membersUnsubsRef.current = [];

        // Reset/seed names (members will be filled by sub-listeners)
        const seed: GroupMembershipState = {};
        groupsSnap.forEach((gDoc) => {
          const gData = gDoc.data() as { name?: string };
          seed[gDoc.id] = {
            name: gData.name ?? "",
            members: new Set<string>(),
          };
        });
        setGroupMemberships(seed);

        // For each group, listen to its members subcollection
        groupsSnap.forEach((gDoc) => {
          const gId = gDoc.id;
          const membersRef = collection(db, "usergroups", gId, "members");

          const unsubMembers = onSnapshot(
            membersRef,
            (memSnap) => {
              const memSet = new Set<string>();
              memSnap.forEach((m) => memSet.add(m.id)); // member doc id = userId

              // Update just this group's members (keep others intact)
              setGroupMemberships((prev) => ({
                ...prev,
                [gId]: {
                  name: prev[gId]?.name ?? (gDoc.data() as any)?.name ?? "",
                  members: memSet,
                },
              }));
            },
            (err) => console.error("members listener error:", err)
          );

          membersUnsubsRef.current.push(unsubMembers);
        });
      }
    );

    return () => {
      unsubGroups();
      membersUnsubsRef.current.forEach((u) => u());
      membersUnsubsRef.current = [];
    };
  }, []);

  const toggleCreateActive = () => {
    setIsCreateActive(!isCreateActive);
  };

  const cancelEditingUser = () => {
    setSelectedUser(null);
    setIsEditingImg(false);
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

  // Helper: get group names a user belongs to
  const groupsForUser = (userId: string): string[] => {
    return Object.values(groupMemberships)
      .filter((g) => g.members.has(userId))
      .map((g) => g.name || "(unnamed)")
      .sort((a, b) => a.localeCompare(b));
  };

  return (
    <div className="card has-header grow-1">
      <div className="card-header">
        <h3 className="card-title">Userlist</h3>
        <div className="card-header-right">
          {!isCreateActive && (
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
            <h4>Groups</h4>
          </li>
          {users.map((u) => {
            const userGroups = groupsForUser(u.id);
            return (
              <li key={u.id} className="userlist">
                <p>
                  <strong className="user">{u.username}</strong>
                </p>
                <p className="user-name">
                  <span
                    onClick={() => {
                      setSelectedUser(u);
                      setEditName(u.name ?? "");
                      setEditNickname(u.nickname ?? "");
                      setNewImgUrl(u.imgurl ?? "");
                    }}
                  >
                    {u.name || <em>(No name)</em>}
                  </span>
                </p>
                <p>{u.role === "admin" ? "Admin" : "User"}</p>
                <p>
                  {userGroups.length ? (
                    userGroups.join(", ")
                  ) : (
                    <span className="lightgrey">(no groups)</span>
                  )}
                </p>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Modal or Popup */}
      {selectedUser && (
        <div className="edit-user-container">
          <h3>Edit user: {selectedUser.username}</h3>
          {(() => {
            const canEdit =
              user.role === "admin" || user.username === selectedUser.username;

            return (
              <>
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
                      disabled={!canEdit}
                    />
                  </>
                )}

                <label htmlFor="name">Name:</label>
                <input
                  id="name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  disabled={!canEdit}
                />

                <label htmlFor="nickname">Nickname:</label>
                <input
                  id="nickname"
                  value={editNickname}
                  onChange={(e) => setEditNickname(e.target.value)}
                  disabled={!canEdit}
                />

                <div className="edit-user-btn-container">
                  <button
                    className="save-btn"
                    onClick={handleSaveUser}
                    disabled={!canEdit}
                  >
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
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default Userlist;
