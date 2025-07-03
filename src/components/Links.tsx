import { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  getDocs,
  setDoc,
  doc,
} from "firebase/firestore";

type Link = { id: string; name: string; href: string };
type LinkCategory = { category: string; links: Link[] };

const STATIC_CATEGORIES: LinkCategory[] = [
  {
    category: "Internt",
    links: [
      { id: "static-1", name: "Avvik - Fossum IT", href: "https://norrprop.fossumit.no/norrprop.nsf/index?openview" },
      { id: "static-2", name: "Eco Online", href: "https://app.ecoonline.com/login/" },
      { id: "static-3", name: "Toll - Emma EDOC", href: "https://emmaedoc.no/" },
      { id: "static-4", name: "Tripletex", href: "https://tripletex.no/execute/login?site=no" },
    ],
  },
  {
    category: "Leverandører",
    links: [
      { id: "static-5", name: "Avial (Boeing)", href: "https://shop.boeing.com/aviation-supply/" },
      { id: "static-6", name: "Boeing", href: "https://www.boeingdistribution.com/index.jsp" },
      { id: "static-7", name: "Collins", href: "https://www.customers.utcaerospacesystems.com/ngp-my-account" },
      { id: "static-8", name: "Hartzell", href: "https://online.hartzellprop.com/Instance2EnvMMLogin/html/login.html" },
      { id: "static-9", name: "Skygeek", href: "https://skygeek.com/" },
      { id: "static-10", name: "Textron", href: "https://ww2.txtav.com/" },
    ],
  },
  {
    category: "Verktøy",
    links: [{ id: "static-11", name: "Kiwa", href: "https://labservices.kiwa.com/eCal_NO/Login.aspx?nochk=-1&lng=EN" }],
  },
  {
    category: "Transport",
    links: [
      { id: "static-12", name: "Bring", href: "https://www.mybring.com/frontpage/index.html" },
      { id: "static-13", name: "DHL", href: "https://mydhl.express.dhl/no/en/home.html#/createNewShipmentTab" },
      { id: "static-14", name: "FedEx", href: "https://www.fedex.com" },
      { id: "static-15", name: "Rajapack", href: "https://www.rajapack.no/" },
      { id: "static-16", name: "TNT", href: "https://mytnt.tnt.com/?locale=no_NO#/sign-in" },
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

const Links = ({ user }: { user: { id: string } }) => {
  const [expandedCategories, setExpandedCategories] = useState(getInitialExpanded);
  const [customLinks, setCustomLinks] = useState<Link[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newLinkName, setNewLinkName] = useState("");
  const [newLinkHref, setNewLinkHref] = useState("");

  useEffect(() => {
    localStorage.setItem(EXPANDED_KEY, JSON.stringify(expandedCategories));
  }, [expandedCategories]);

  useEffect(() => {
    const loadLinks = async () => {
      const linksMoved = localStorage.getItem(LINKS_MOVED_KEY);

      // Step 1: Load local links from localStorage only if not moved yet
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

      // Step 2: If we have local links and not moved yet, copy them to DB with unique IDs
      if (localLinks.length > 0 && !linksMoved) {
        await Promise.all(
          localLinks.map(link => {
            const randomId = crypto.randomUUID();
            // Save with an 'id' same as Firestore doc id so we can keep it consistent
            return setDoc(doc(db, "users", user.id, "links", randomId), link);
          })
        );
        localStorage.setItem(LINKS_MOVED_KEY, "true");
      }

      // Step 3: Fetch all links from Firestore AFTER moving
      let dbLinks: Link[] = [];
      try {
        const snapshot = await getDocs(collection(db, "users", user.id, "links"));
        dbLinks = snapshot.docs.map(doc => {
          return { id: doc.id, ...(doc.data() as Omit<Link, "id">) };
        });
      } catch (e) {
        console.warn("Failed to fetch DB links", e);
      }

      setCustomLinks(dbLinks);
    };

    loadLinks();
  }, [user]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleAddLink = async () => {
    if (!newLinkName.trim() || !newLinkHref.trim()) return;
    const newLinkData = { name: newLinkName.trim(), href: newLinkHref.trim() };

    // Generate a unique id for Firestore doc and also for React keys
    const randomId = crypto.randomUUID();
    const newLink: Link = { id: randomId, ...newLinkData };

    // Save to Firestore
    await setDoc(doc(db, "users", user.id, "links", randomId), newLinkData);

    // Update state with the new link
    setCustomLinks(prev => [...prev, newLink]);
    setExpandedCategories(prev => ({ ...prev, "Mine lenker": true }));
    setNewLinkName("");
    setNewLinkHref("");
    setShowForm(false);
  };

  const allCategories: LinkCategory[] = [
    ...STATIC_CATEGORIES,
    ...(customLinks.length > 0 ? [{ category: "Mine lenker", links: customLinks }] : []),
  ];

  return (
    <div className="card has-header grow-1">
      <div className="card-header">
        <h3 className="card-title">Lenker</h3>
        {!showForm && (
          <i
            className="fa-solid fa-plus blue icon-md hover"
            onClick={() => setShowForm(prev => !prev)}
          />
        )}
      </div>

      {showForm && (
        <div className="create-task-box">
          Opprett ny lenke
          <div className="create-task-input-container">
            <input
              type="text"
              placeholder="Navn"
              value={newLinkName}
              onChange={(e) => setNewLinkName(e.target.value)}
              className="input m-b-1"
            />
            <input
              type="text"
              placeholder="https://..."
              value={newLinkHref}
              onChange={(e) => setNewLinkHref(e.target.value)}
              className="input m-b-1"
            />
            <div className="button-group">
              <button className="btn" onClick={handleAddLink}>
                <i className="fa-solid fa-check" />
                <p>Opprett</p>
              </button>
              <button onClick={() => setShowForm(false)}>
                <p>Avbryt</p>
                <i className="fa-solid fa-cancel red" />
              </button>
            </div>
          </div>
        </div>
      )}

      {allCategories.map(({ category, links }) => {
        const isExpanded = expandedCategories[category] ?? false;

        return (
          <div key={category}>
            <div className="ul-heading" onClick={() => toggleCategory(category)}>
              <p className="list-p">{category}</p>
              <i className={`fa-solid fa-caret-${isExpanded ? "up" : "down"} lightgrey`} />
            </div>

            {isExpanded && (
              <ul>
                {links.map(link => (
                  // Use link.id as key to avoid duplication bugs
                  <li key={link.id}>
                    <a href={link.href} target="_blank" rel="noopener noreferrer">
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
