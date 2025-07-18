import { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import {
  collection,
  getDocs,
  setDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";

type Link = { id: string; name: string; href: string };
type LinkCategory = { category: string; links: Link[] };

const STATIC_CATEGORIES: LinkCategory[] = [
  {
    category: "Norrønafly",
    links: [
      {
        id: "static-1",
        name: "Reports - Fossum IT",
        href: "https://norrprop.fossumit.no/norrprop.nsf/index?openview",
      },
      {
        id: "static-2",
        name: "Eco Online",
        href: "https://app.ecoonline.com/login/",
      },
      {
        id: "static-3",
        name: "Customs - Emma EDOC",
        href: "https://emmaedoc.no/",
      },
      {
        id: "static-4",
        name: "Tripletex",
        href: "https://tripletex.no/execute/login?site=no",
      },
    ],
  },
  {
    category: "Vendors",
    links: [
      {
        id: "static-5",
        name: "Boeing",
        href: "https://shop.boeing.com/aviation-supply/",
      },
      {
        id: "static-7",
        name: "Collins",
        href: "https://www.customers.utcaerospacesystems.com/ngp-my-account",
      },
      {
        id: "static-8",
        name: "Hartzell",
        href: "https://online.hartzellprop.com/Instance2EnvMMLogin/html/login.html",
      },
      { id: "static-9", name: "Skygeek", href: "https://skygeek.com/" },
      { id: "static-10", name: "Textron", href: "https://ww2.txtav.com/" },
    ],
  },
  {
    category: "Tool Calibration",
    links: [
      {
        id: "static-11",
        name: "Kiwa",
        href: "https://labservices.kiwa.com/eCal_NO/Login.aspx?nochk=-1&lng=EN",
      },
    ],
  },
  {
    category: "Freight",
    links: [
      {
        id: "static-12",
        name: "Bring",
        href: "https://www.mybring.com/frontpage/index.html",
      },
      {
        id: "static-13",
        name: "DHL",
        href: "https://mydhl.express.dhl/no/en/home.html#/createNewShipmentTab",
      },
      { id: "static-14", name: "FedEx", href: "https://www.fedex.com" },
      { id: "static-15", name: "Rajapack", href: "https://www.rajapack.no/" },
      {
        id: "static-16",
        name: "TNT",
        href: "https://mytnt.tnt.com/?locale=no_NO#/sign-in",
      },
      { id: "static-17", name: "UPS", href: "https://www.ups.com/no/no/home" },
    ],
  },
];

const EXPANDED_KEY = "expandedCategories";
const CUSTOM_LINKS_KEY = "customLinks";
const LINKS_MOVED_KEY = "linksMoved";

const getInitialExpanded = (): Record<string, boolean> => {
  try {
    return JSON.parse(localStorage.getItem(EXPANDED_KEY) || "{}");
  } catch {
    return {};
  }
};

type LinksProps = {
  user: { id: string };
  toggleActive: (name: string) => void;
};

const Links = ({ user, toggleActive }: LinksProps) => {
  const [expandedCategories, setExpandedCategories] =
    useState(getInitialExpanded);
  const [customLinks, setCustomLinks] = useState<Link[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newLinkName, setNewLinkName] = useState("");
  const [newLinkHref, setNewLinkHref] = useState("");

  // Track which dropdown is open (link ID) or null for none
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    localStorage.setItem(EXPANDED_KEY, JSON.stringify(expandedCategories));
  }, [expandedCategories]);

  useEffect(() => {
    const loadLinks = async () => {
      const linksMoved = localStorage.getItem(LINKS_MOVED_KEY);

      let localLinks: Omit<Link, "id">[] = [];
      if (!linksMoved) {
        const local = localStorage.getItem(CUSTOM_LINKS_KEY);
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed)) {
              localLinks = parsed;
            }
          } catch (e) {
            console.error("Error parsing localStorage links", e);
          }
        }
      }

      if (localLinks.length > 0 && !linksMoved) {
        await Promise.all(
          localLinks.map((link) => {
            const randomId = crypto.randomUUID();
            return setDoc(doc(db, "users", user.id, "links", randomId), link);
          })
        );
        localStorage.setItem(LINKS_MOVED_KEY, "true");
      }

      let dbLinks: Link[] = [];
      try {
        const snapshot = await getDocs(
          collection(db, "users", user.id, "links")
        );
        dbLinks = snapshot.docs.map((doc) => {
          return { id: doc.id, ...(doc.data() as Omit<Link, "id">) };
        });
      } catch (e) {
        console.warn("Failed to fetch DB links", e);
      }

      setCustomLinks(dbLinks);
    };

    loadLinks();
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleAddLink = async () => {
    if (!newLinkName.trim() || !newLinkHref.trim()) return;
    const newLinkData = { name: newLinkName.trim(), href: newLinkHref.trim() };

    const randomId = crypto.randomUUID();
    const newLink: Link = { id: randomId, ...newLinkData };

    await setDoc(doc(db, "users", user.id, "links", randomId), newLinkData);

    setCustomLinks((prev) => [...prev, newLink]);
    setExpandedCategories((prev) => ({ ...prev, "My Links": true }));
    setNewLinkName("");
    setNewLinkHref("");
    setShowForm(false);
  };

  const handleDeleteLink = async (id: string) => {
    try {
      await deleteDoc(doc(db, "users", user.id, "links", id));
      setCustomLinks((prev) => prev.filter((link) => link.id !== id));
      setOpenDropdownId(null);
    } catch (error) {
      console.error("Failed to delete link:", error);
    }
  };

  const toggleDropdown = (id: string) => {
    setOpenDropdownId((prev) => (prev === id ? null : id));
  };

  const allCategories: LinkCategory[] = [
    ...STATIC_CATEGORIES,
    ...(customLinks.length > 0
      ? [{ category: "My Links", links: customLinks }]
      : []),
  ];

  return (
    <div className="card has-header grow-1">
      <div className="card-header">
        <h3 className="card-title">Links</h3>
        <div className="card-header-right">
          {!showForm && (
            <button onClick={() => setShowForm((prev) => !prev)}>
              <i className="fa-solid fa-plus blue icon-md hover" /> Add link
            </button>
          )}
          <button
            className="close-widget-btn"
            onClick={() => toggleActive("Links")}
          >
            <i className="fa-solid fa-x icon-md hover" />
          </button>
        </div>
      </div>

      {showForm && (
        <div className="create-task-box">
          Add new link
          <div className="create-task-input-container">
            <input
              type="text"
              placeholder="Link name"
              value={newLinkName}
              onChange={(e) => setNewLinkName(e.target.value)}
              className="input m-b-1"
            />
            <input
              type="text"
              placeholder="URL (https://...)"
              value={newLinkHref}
              onChange={(e) => setNewLinkHref(e.target.value)}
              className="input m-b-1"
            />
            <div className="button-group">
              <button className="btn" onClick={handleAddLink}>
                <i className="fa-solid fa-check" />
                <p>Confirm</p>
              </button>
              <button onClick={() => setShowForm(false)}>
                <i className="fa-solid fa-cancel red" />
                <p>Cancel</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {allCategories.map(({ category, links }) => {
        const isExpanded = expandedCategories[category] ?? false;

        return (
          <div key={category}>
            <div
              className="ul-heading"
              onClick={() => toggleCategory(category)}
            >
              <p className="list-p">{category}</p>
              <i
                className={`fa-solid fa-caret-${
                  isExpanded ? "up" : "down"
                } lightgrey`}
              />
            </div>

            {isExpanded && (
              <ul>
                {links.map((link) => (
                  <li
                    key={link.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      position: "relative",
                    }}
                  >
                    {category === "Mine lenker" && (
                      <div
                        ref={openDropdownId === link.id ? dropdownRef : null}
                        style={{ position: "relative" }}
                      >
                        <div
                          className="icon-div hover"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent category toggle
                            toggleDropdown(link.id);
                          }}
                          title="Alternativer"
                          style={{ marginRight: 8 }}
                        >
                          <i className="fa-solid fa-bars"></i>
                        </div>

                        {openDropdownId === link.id && (
                          <div className="task-dropdown">
                            <div
                              className="dropdown-item default-select hover-border"
                              onClick={() => handleDeleteLink(link.id)}
                            >
                              <div className="dropdown-item-icon-container">
                                <i className="fa-solid fa-trash red"></i>
                              </div>
                              <span style={{ marginLeft: "8px" }}>
                                Slett lenke
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ flex: 1 }}
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Links;
