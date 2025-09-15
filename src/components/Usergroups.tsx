import { useEffect, useRef, useState } from "react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

type UsergroupsProps = {
  toggleActive: (name: string) => void;
};

type Group = { id: string; name: string };
type User = { id: string; username: string; name?: string };

const Usergroups = ({ toggleActive }: UsergroupsProps) => {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);

  // Create state
  const [isCreateActive, setIsCreateActive] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  // Edit state
  const [edit, setEdit] = useState<Group | null>(null);

  // Selected group (for highlighting)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Dropdown state
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Users + filtering (for membership picking)
  const [users, setUsers] = useState<User[]>([]);
  const [userFilter, setUserFilter] = useState("");

  // Members of selected group (userIds)
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set());

  // Realtime groups
  useEffect(() => {
    const qGroups = query(collection(db, "usergroups"), orderBy("name"));
    const unsub = onSnapshot(
      qGroups,
      (snap) => {
        const list: Group[] = snap.docs.map((d) => {
          const data = d.data() as { name?: string };
          return { id: d.id, name: data.name ?? "" };
        });
        setGroups(list);

        // If the selected group was deleted, clear selection
        if (selectedGroupId && !list.some((g) => g.id === selectedGroupId)) {
          setSelectedGroupId(null);
          setMemberIds(new Set());
        }
      },
      (err) => {
        console.error("usergroups listener error:", err);
      }
    );
    return () => unsub();
  }, [selectedGroupId]);

  // Realtime users (pick from)
  useEffect(() => {
    const usersRef = collection(db, "users");
    const unsub = onSnapshot(
      usersRef,
      (snap) => {
        const list: User[] = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            username: data.username ?? d.id,
            name: data.name ?? data.nickname ?? "",
          };
        });
        list.sort((a, b) => a.username.localeCompare(b.username));
        setUsers(list);
      },
      (err) => console.error("users listener error:", err)
    );
    return () => unsub();
  }, []);

  // Realtime members of the selected group
  useEffect(() => {
    if (!selectedGroupId) {
      setMemberIds(new Set());
      return;
    }
    const membersRef = collection(db, "usergroups", selectedGroupId, "members");
    const unsub = onSnapshot(
      membersRef,
      (snap) => {
        const ids = new Set<string>();
        snap.forEach((d) => ids.add(d.id));
        setMemberIds(ids);
      },
      (err) => console.error("members listener error:", err)
    );
    return () => unsub();
  }, [selectedGroupId]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleCreateActive = () => {
    setIsCreateActive((v) => !v);
    setNewGroupName("");
    setError("");
    setSuccess("");
  };

  const registerUsergroup = async () => {
    const name = newGroupName.trim();
    if (name.length < 3) {
      setError("Name must be at least 3 characters.");
      setSuccess("");
      return;
    }
    try {
      const ref = await addDoc(collection(db, "usergroups"), { name });
      setSuccess(`Group "${name}" was created!`);
      setError("");
      setNewGroupName("");
      setIsCreateActive(false);
      setSelectedGroupId(ref.id); // select newly created group
    } catch (e) {
      console.error("Error creating user group:", e);
      setError("Creation failed.");
      setSuccess("");
    }
  };

  const startEdit = (g: Group) => {
    setEdit(g);
    setError("");
    setSuccess("");
    setOpenDropdownId(null);
  };

  const cancelEdit = () => setEdit(null);

  const saveEdit = async () => {
    if (!edit) return;
    const name = edit.name.trim();
    if (name.length < 3) {
      setError("Name must be at least 3 characters.");
      setSuccess("");
      return;
    }
    try {
      await updateDoc(doc(db, "usergroups", edit.id), { name });
      setSuccess(`Saved "${name}".`);
      setError("");
      setEdit(null);
    } catch (e) {
      console.error("Error saving group:", e);
      setError("Save failed.");
      setSuccess("");
    }
  };

  const handleDeleteGroup = async (id: string) => {
    try {
      await deleteDoc(doc(db, "usergroups", id));
      setOpenDropdownId(null);
      if (selectedGroupId === id) {
        setSelectedGroupId(null);
        setMemberIds(new Set());
      }
      // onSnapshot will refresh the list
    } catch (e) {
      console.error("Failed to delete group:", e);
      setError("Delete failed.");
    }
  };

  const toggleDropdown = (id: string) => {
    setOpenDropdownId((prev) => (prev === id ? null : id));
  };

  const selectGroup = (id: string) => {
    setSelectedGroupId((prev) => (prev === id ? null : id)); // toggle selection
  };

  // Toggle membership for a user in the selected group
  const toggleMembership = async (user: User) => {
    if (!selectedGroupId) return;
    const memberRef = doc(
      db,
      "usergroups",
      selectedGroupId,
      "members",
      user.id
    );

    try {
      if (memberIds.has(user.id)) {
        await deleteDoc(memberRef);
        setSuccess(`Removed ${user.username} from group.`);
      } else {
        await setDoc(
          memberRef,
          {
            userId: user.id,
            username: user.username,
            addedAt: serverTimestamp(),
          },
          { merge: true }
        );
        setSuccess(`Added ${user.username} to group.`);
      }
      setError("");
    } catch (e) {
      console.error("Membership toggle failed:", e);
      setError("Failed to update membership.");
      setSuccess("");
    }
  };

  const filteredUsers = users.filter((u) => {
    const hay = (u.username + " " + (u.name || "")).toLowerCase();
    return hay.includes(userFilter.toLowerCase());
  });

  return (
    <div className="card has-header grow-1">
      <div className="card-header">
        <h3 className="card-title">User groups</h3>
        <div className="card-header-right">
          {!isCreateActive && (
            <button onClick={toggleCreateActive}>
              <i className="fa-solid fa-plus grey icon-md hover" />
              Add
            </button>
          )}
        </div>
      </div>

      <div className="card-body">
        {isCreateActive && (
          <div className="create-task-box">
            Create new user group
            <div className="create-task-input-container">
              <input
                type="text"
                placeholder="Name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && registerUsergroup()}
                className="input m-b-1"
              />
              <div className="button-group">
                <button className="save-btn" onClick={registerUsergroup}>
                  <i className="fa-solid fa-save icon-md" />
                  Save
                </button>
                <button className="delete-btn" onClick={toggleCreateActive}>
                  <i className="fa-solid fa-xmark icon-md" />
                  Discard
                </button>
              </div>
            </div>
          </div>
        )}

        {error && <p style={{ color: "red" }}>{error}</p>}
        {success && <p style={{ color: "green" }}>{success}</p>}

        {/* Groups list */}
        <ul>
          <li>
            <h4>Name</h4>
          </li>

          {groups.map((g) => {
            const isSelected = selectedGroupId === g.id;
            return (
              <li
                key={g.id}
                className={`user-group ${isSelected ? "selected-group" : ""}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  position: "relative",
                  cursor: "pointer",
                }}
                onClick={() => selectGroup(g.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    selectGroup(g.id);
                  }
                }}
                tabIndex={0}
                role="option"
                aria-selected={isSelected}
              >
                {/* Kebab menu */}
                <div
                  ref={openDropdownId === g.id ? dropdownRef : null}
                  style={{ position: "relative", marginRight: 8 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    className="icon-div task-action hover"
                    onClick={() => toggleDropdown(g.id)}
                    title="Options"
                    aria-haspopup="menu"
                    aria-expanded={openDropdownId === g.id}
                  >
                    <i className="fa-solid fa-bars" />
                  </div>

                  {openDropdownId === g.id && (
                    <div className="task-dropdown" role="menu">
                      <div
                        className="dropdown-item hover-border"
                        role="menuitem"
                        onClick={() => startEdit(g)}
                      >
                        <div className="dropdown-item-icon-container">
                          <i className="fa-solid fa-pencil grey" />
                        </div>
                        <div className="dropdown-item-text-container">Edit</div>
                      </div>

                      <div
                        className="dropdown-item hover-border"
                        role="menuitem"
                        onClick={() => handleDeleteGroup(g.id)}
                      >
                        <div className="dropdown-item-icon-container">
                          <i className="fa-solid fa-trash red" />
                        </div>
                        <div className="dropdown-item-text-container">
                          Delete
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Name */}
                <p className="user-name" style={{ flex: 1 }}>
                  {g.name || <em>(No name)</em>}
                </p>
              </li>
            );
          })}
        </ul>

        {/* Members editor */}
        <div className="m-t-2">
          <h4>Members</h4>
          {!selectedGroupId ? (
            <p className="lightgrey">Select a group to manage its members.</p>
          ) : (
            <>
              <div className="create-task-input-container m-b-1">
                <input
                  type="text"
                  placeholder="Filter users by name or username"
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  className="input"
                />
              </div>

              <ul className="user-list">
                {filteredUsers.map((u) => {
                  const isMember = memberIds.has(u.id);
                  return (
                    <li
                      key={u.id}
                      className={`userlist ${
                        isMember ? "active-selection" : ""
                      }`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        position: "relative",
                        cursor: "pointer",
                      }}
                      onClick={() => toggleMembership(u)}
                    >
                      <div
                        className="icon-div hover"
                        title={isMember ? "Remove from group" : "Add to group"}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMembership(u);
                        }}
                        style={{ marginRight: 8 }}
                      >
                        {isMember ? (
                          <i className="fa-solid fa-check green" />
                        ) : (
                          <i className="fa-solid fa-plus grey" />
                        )}
                      </div>

                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <strong className="user">{u.username}</strong>
                        {u.name && (
                          <small className="lightgrey">{u.name}</small>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </div>

      {/* Edit panel */}
      {edit && (
        <div className="create-task-box">
          <h4>Edit group</h4>
          <div className="create-task-input-container">
            <input
              type="text"
              placeholder="Group name"
              value={edit.name}
              onChange={(e) =>
                setEdit((s) => (s ? { ...s, name: e.target.value } : s))
              }
              onKeyDown={(e) => e.key === "Enter" && saveEdit()}
              className="input m-b-1"
            />
            <div className="button-group">
              <button className="save-btn" onClick={saveEdit}>
                <i className="fa-solid fa-save icon-md" />
                Save
              </button>
              <button className="delete-btn" onClick={cancelEdit}>
                <i className="fa-solid fa-xmark icon-md" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Usergroups;
