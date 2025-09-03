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
} from "firebase/firestore";

type UsergroupsProps = {
  toggleActive: (name: string) => void;
};

type Group = { id: string; name: string };

const Usergroups = ({ toggleActive }: UsergroupsProps) => {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);

  // Create state
  const [isCreateActive, setIsCreateActive] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  // Edit state
  const [edit, setEdit] = useState<Group | null>(null);

  // Dropdown state (which group's dropdown is open)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Realtime groups
  useEffect(() => {
    const q = query(collection(db, "usergroups"), orderBy("name"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: Group[] = snap.docs.map((d) => {
          const data = d.data() as { name?: string };
          return { id: d.id, name: data.name ?? "" };
        });
        setGroups(list);
      },
      (err) => {
        console.error("usergroups listener error:", err);
      }
    );
    return () => unsub();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
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
      await addDoc(collection(db, "usergroups"), { name });
      setSuccess(`Group "${name}" was created!`);
      setError("");
      setNewGroupName("");
      setIsCreateActive(false);
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
      // onSnapshot will refresh the list
    } catch (e) {
      console.error("Failed to delete group:", e);
      setError("Delete failed.");
    }
  };

  const toggleDropdown = (id: string) => {
    setOpenDropdownId((prev) => (prev === id ? null : id));
  };

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
          <button
            className="close-widget-btn"
            onClick={() => toggleActive("Users")}
          >
            <i className="fa-solid fa-x icon-md hover" />
          </button>
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

        <ul>
          <li>
            <h4>Name</h4>
          </li>

          {groups.map((g) => (
            <li
              key={g.id}
              className="userlist"
              style={{ display: "flex", alignItems: "center", position: "relative" }}
            >
              {/* Kebab menu, same pattern as Links.tsx */}
              <div
                ref={openDropdownId === g.id ? dropdownRef : null}
                style={{ position: "relative", marginRight: 8 }}
              >
                <div
                  className="icon-div task-action hover"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDropdown(g.id);
                  }}
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
                      <div className="dropdown-item-text-container">Delete</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Name (click also opens edit) */}
              <p className="user-name" style={{ flex: 1 }}>
                <span onClick={() => startEdit(g)}>
                  {g.name || <em>(No name)</em>}
                </span>
              </p>
            </li>
          ))}
        </ul>
      </div>

      {/* Edit panel (simple, like in Links.tsx) */}
      {edit && (
        <div className="create-task-box">
          <h4>Edit group</h4>
          <div className="create-task-input-container">
            <input
              type="text"
              placeholder="Group name"
              value={edit.name}
              onChange={(e) => setEdit((s) => (s ? { ...s, name: e.target.value } : s))}
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
