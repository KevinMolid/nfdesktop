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

import Button from "./Button";

type Group = { id: string; name: string };
type User = { id: string; username: string; name?: string };

const Usergroups = () => {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.getAttribute("data-theme") === "dark";
  });

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

  const selectedGroupName = selectedGroupId
    ? groups.find((g) => g.id === selectedGroupId)?.name || "(No name)"
    : "";

  const memberSelectedClasses = isDarkMode
    ? "bg-green-900 hover:bg-green-800"
    : "bg-green-200 hover:bg-green-300";

  return (
    <div className="card has-header grow">
      <div className="card-header">
        <h3 className="card-title">User groups</h3>
        <div className="card-header-right">
          {!isCreateActive && (
            <Button
              size="sm"
              variant="transparent"
              onClick={toggleCreateActive}
              iconLeft={<i className="fa-solid fa-plus" />}
            >
              Add
            </Button>
          )}
        </div>
      </div>

      <div className="card-body">
        {error && <p style={{ color: "red" }}>{error}</p>}
        {success && <p style={{ color: "green" }}>{success}</p>}

        {isCreateActive ? (
          /* 1️⃣ CREATE NEW GROUP VIEW */
          <div className="create-task-box">
            <h4 className="font-semibold mb-2">Create new user group</h4>
            <div className="flex flex-col mb-2">
              <label htmlFor="newGroupName" className="cursor-pointer">
                Group name
              </label>
              <input
                id="newGroupName"
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && registerUsergroup()}
                className="text-xl font-semibold text-(--text-color) border-b-2 border-(--line-color) outline-none focus:border-(--text-color)"
              />
            </div>
            <div className="flex gap-2">
              <Button
                className="save-btn"
                onClick={registerUsergroup}
                iconLeft={<i className="fa-solid fa-save" />}
              >
                Save
              </Button>
              <Button
                variant="secondary"
                className="delete-btn"
                onClick={toggleCreateActive}
                iconLeft={<i className="fa-solid fa-cancel" />}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          /* 2️⃣ GROUPS LIST + MEMBERS VIEW */
          <>
            {/* Groups list */}
            <ul className="flex flex-col gap-1">
              {groups.map((g) => {
                const isSelected = selectedGroupId === g.id;
                return (
                  <li
                    key={g.id}
                    className={`flex gap-2 hover:bg-(--bg4-color) transition-colors rounded-lg ${
                      isSelected ? "bg-(--bg4-color)" : ""
                    }`}
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
                    <Button
                      size="sm"
                      variant="tertiary"
                      ref={openDropdownId === g.id ? dropdownRef : null}
                      onClick={() => toggleDropdown(g.id)}
                    >
                      <i className="fa-solid fa-bars" />

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
                            <div className="dropdown-item-text-container">
                              Edit
                            </div>
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
                    </Button>

                    {/* Name */}
                    <p className="font-semibold" style={{ flex: 1 }}>
                      {g.name || <em>(No name)</em>}
                    </p>
                  </li>
                );
              })}
            </ul>

            {/* Members editor */}
            <div className="mt-4">
              {!selectedGroupId ? (
                <></>
              ) : (
                <>
                  <h4 className="card-title">{selectedGroupName} Members</h4>
                  <p className="text-(--text3-color)">
                    Click on a user to add or remove the user from the group
                  </p>
                  <div className="my-2 flex gap-2 items-center">
                    <label htmlFor="nameFilter">
                      <i className="fa-solid fa-magnifying-glass cursor-pointer text-(--text3-color)"></i>
                    </label>

                    <input
                      id="nameFilter"
                      type="text"
                      value={userFilter}
                      onChange={(e) => setUserFilter(e.target.value)}
                      className="bg-(--bg4-color) px-4 py-2 w-full rounded-full outline-none"
                    />
                  </div>

                  <ul className="user-list flex flex-col gap-1">
                    {filteredUsers.map((u) => {
                      const isMember = memberIds.has(u.id);
                      return (
                        <li
                          key={u.id}
                          className={`flex justify-between py-1 items-center relative cursor-pointer gap-2 rounded-lg transition-colors ${
                            isMember
                              ? memberSelectedClasses
                              : "hover:bg-(--bg4-color)"
                          }`}
                          onClick={() => toggleMembership(u)}
                        >
                          <div className="grid grid-cols-[42px_auto]">
                            <strong className="user">{u.username}</strong>
                            {u.name && <p>{u.name}</p>}
                          </div>

                          <div
                            className="icon-div hover"
                            title={
                              isMember ? "Remove from group" : "Add to group"
                            }
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
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </div>
          </>
        )}
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
