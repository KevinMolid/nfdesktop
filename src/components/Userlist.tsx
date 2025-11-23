import { useState, useEffect, useRef } from "react";
import avatar from "../assets/defaultAvatar.png";

import Button from "./Button";

import bcrypt from "bcryptjs";
import {
  doc,
  updateDoc,
  collection,
  addDoc,
  onSnapshot,
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
};

type GroupMembershipState = Record<
  string, // groupId
  { name: string; members: Set<string> } // Set of userIds
>;

const Userlist = ({ user }: UsersProps) => {
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

  const startCreateUser = () => {
    setIsCreateActive(true);
    setSelectedUser(null); // ensure edit closes
    setError("");
    setSuccess("");
    setUsername("");
    setPin("");
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
      setIsCreateActive(false);
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
    setIsEditingImg(false);
  };

  // Helper: get group names a user belongs to
  const groupsForUser = (userId: string): string[] => {
    return Object.values(groupMemberships)
      .filter((g) => g.members.has(userId))
      .map((g) => g.name || "(unnamed)")
      .sort((a, b) => a.localeCompare(b));
  };

  return (
    <div className="card has-header grow">
      <div className="card-header">
        <h3 className="card-title">
          {isCreateActive ? (
            "Create new user"
          ) : selectedUser ? (
            <p>
              Edit user <span className="user">{selectedUser.username}</span>
            </p>
          ) : (
            "List of users"
          )}
        </h3>
        <div className="card-header-right">
          {!isCreateActive && !selectedUser && (
            <Button
              size="sm"
              variant="transparent"
              onClick={startCreateUser}
              iconLeft={<i className="fa-solid fa-plus"></i>}
            >
              Add
            </Button>
          )}
        </div>
      </div>

      <div className="card-body">
        {/* Feedback messages (always visible) */}
        {error && <p style={{ color: "red" }}>{error}</p>}
        {success && <p style={{ color: "green" }}>{success}</p>}

        {isCreateActive ? (
          /* 1️⃣ CREATE NEW USER VIEW */
          <div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-col">
                <label htmlFor="newUserName" className="cursor-pointer">
                  User name
                </label>
                <input
                  id="newUserName"
                  className="text-xl font-bold text-(--text-color) border-b-2 border-(--line-color) outline-none focus:border-(--text-color)"
                  type="text"
                  value={username}
                  maxLength={3}
                  onChange={(e) => setUsername(e.target.value.toUpperCase())}
                  autoComplete="new-username"
                  name="nf-create-user-username"
                />
              </div>

              <div className="flex flex-col mb-2">
                <label htmlFor="newUserPIN" className="cursor-pointer">
                  PIN
                </label>
                <input
                  id="newUserPIN"
                  className="text-xl font-bold text-(--text-color) border-b-2 border-(--line-color) outline-none focus:border-(--text-color)"
                  type="password"
                  value={pin}
                  maxLength={4}
                  onChange={(e) => setPin(e.target.value)}
                  autoComplete="new-password"
                  name="nf-create-user-pin"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => registerUser(username, pin)}
                  iconLeft={<i className="fa-solid fa-check"></i>}
                >
                  Confirm
                </Button>
                <Button
                  variant="tertiary"
                  onClick={() => setIsCreateActive(false)}
                  iconLeft={<i className="fa-solid fa-cancel"></i>}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        ) : selectedUser ? (
          /* 2️⃣ EDIT USER VIEW */
          <div className="edit-user-container">
            {(() => {
              const canEdit =
                user.role === "admin" ||
                user.username === selectedUser.username;

              return (
                <>
                  {/* Avatar & edit button */}
                  <div className="flex gap-2 mb-2 items-end">
                    <img
                      src={selectedUser.imgurl || avatar}
                      alt=""
                      className="avatar-large"
                    />
                    {canEdit && !isEditingImg && (
                      <Button
                        size="sm"
                        variant="tertiary"
                        onClick={() => {
                          // start image editing mode
                          setIsEditingImg(true);
                          setNewImgUrl(selectedUser.imgurl ?? "");
                        }}
                      >
                        <i className="fa-solid fa-pencil"></i>
                      </Button>
                    )}
                  </div>

                  {/* IMAGE EDIT MODE */}
                  {isEditingImg && (
                    <>
                      <label htmlFor="imgurl">Image URL</label>
                      <input
                        id="imgurl"
                        value={newImgUrl}
                        onChange={(e) => setNewImgUrl(e.target.value)}
                        disabled={!canEdit}
                        spellCheck={false}
                      />
                      <div className="flex gap-2 mt-3">
                        <Button
                          className="save-btn"
                          onClick={handleSaveUser}
                          disabled={!canEdit}
                          iconLeft={<i className="fa-solid fa-check"></i>}
                        >
                          Save
                        </Button>
                        <Button
                          variant="tertiary"
                          className="delete-btn"
                          onClick={() => {
                            // reset to original image and exit image edit mode
                            setNewImgUrl(selectedUser.imgurl ?? "");
                            setIsEditingImg(false);
                          }}
                          iconLeft={<i className="fa-solid fa-cancel"></i>}
                        >
                          Cancel
                        </Button>
                      </div>
                    </>
                  )}

                  {/* NORMAL FIELDS (ONLY WHEN NOT EDITING IMAGE) */}
                  {!isEditingImg && (
                    <>
                      <label htmlFor="name">Name:</label>
                      <input
                        id="name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        disabled={!canEdit}
                        className="mb-1"
                        spellCheck={false}
                      />

                      <label htmlFor="nickname" className="cursor-pointer">
                        Display name
                      </label>
                      <input
                        id="nickname"
                        value={editNickname}
                        onChange={(e) => setEditNickname(e.target.value)}
                        disabled={!canEdit}
                        className="mb-4"
                        spellCheck={false}
                      />

                      <div className="flex gap-2">
                        <Button
                          className="save-btn"
                          onClick={handleSaveUser}
                          disabled={!canEdit}
                          iconLeft={<i className="fa-solid fa-check"></i>}
                        >
                          Save
                        </Button>
                        <Button
                          variant="tertiary"
                          className="delete-btn"
                          onClick={() => {
                            setSelectedUser(null);
                            setIsEditingImg(false);
                          }}
                          iconLeft={<i className="fa-solid fa-cancel"></i>}
                        >
                          Cancel
                        </Button>
                      </div>
                    </>
                  )}
                </>
              );
            })()}
          </div>
        ) : (
          /* 3️⃣ USER LIST VIEW */
          <ul className="">
            <li className="grid grid-cols-[42px_200px_60px_auto]">
              <h4>Code</h4>
              <h4>Name</h4>
              <h4>Role</h4>
              <h4>Groups</h4>
            </li>
            {users.map((u) => {
              const userGroups = groupsForUser(u.id);
              return (
                <li
                  key={u.id}
                  className="grid grid-cols-[42px_200px_60px_auto] hover:bg-(--bg4-color) py-1 cursor-pointer rounded-lg"
                  onClick={() => {
                    setIsCreateActive(false);
                    setSelectedUser(u);
                    setEditName(u.name ?? "");
                    setEditNickname(u.nickname ?? "");
                    setNewImgUrl(u.imgurl ?? "");
                    setIsEditingImg(false);
                    setError("");
                    setSuccess("");
                  }}
                >
                  <p>
                    <strong className="user">{u.username}</strong>
                  </p>
                  <p className="user-name">
                    <span>{u.name || <em>(No name)</em>}</span>
                  </p>
                  <p>{u.role === "admin" ? "Admin" : "User"}</p>
                  <p>
                    {userGroups.length ? (
                      userGroups.join(", ")
                    ) : (
                      <span className="text-(--text4-color)">(No group)</span>
                    )}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Userlist;
