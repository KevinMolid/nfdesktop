import { useState, useEffect } from "react";
import { collection, getDocs, setDoc, doc } from "firebase/firestore";
import { db } from "./firebase";

type Link = { name: string; href: string };
type LinkCategory = { category: string; links: Link[] };
type LinksProps = { userId: string };

const STATIC_CATEGORIES: LinkCategory[] = [
  {
    category: "Internt",
    links: [
      { name: "Avvik - Fossum IT", href: "https://norrprop.fossumit.no/norrprop.nsf/index?openview" },
      { name: "Eco Online", href: "https://app.ecoonline.com/login/" },
      { name: "Toll - Emma EDOC", href: "https://emmaedoc.no/" },
      { name: "Tripletex", href: "https://tripletex.no/execute/login?site=no" },
    ],
  },
  {
    category: "Leverandører",
    links: [
      { name: "Avial (Boeing)", href: "https://shop.boeing.com/aviation-supply/" },
      { name: "Boeing", href: "https://www.boeingdistribution.com/index.jsp" },
      { name: "Collins", href: "https://www.customers.utcaerospacesystems.com/ngp-my-account" },
      { name: "Hartzell", href: "https://online.hartzellprop.com/Instance2EnvMMLogin/html/login.html" },
      { name: "Skygeek", href: "https://skygeek.com/" },
      { name: "Textron", href: "https://ww2.txtav.com/" },
    ],
  },
  {
    category: "Verktøy",
    links: [{ name: "Kiwa", href: "https://labservices.kiwa.com/eCal_NO/Login.aspx?nochk=-1&lng=EN" }],
  },
  {
    category: "Transport",
    links: [
      { name: "Bring", href: "https://www.mybring.com/frontpage/index.html" },
      { name: "DHL", href: "https://mydhl.express.dhl/no/en/home.html#/createNewShipmentTab" },
      { name: "FedEx", href: "https://www.fedex.com" },
      { name: "Rajapack", href: "https://www.rajapack.no/" },
      { name: "TNT", href: "https://mytnt.tnt.com/?locale=no_NO#/sign-in" },
      { name: "UPS", href: "https://www.ups.com/no/no/home" },
    ],
  },
];

const EXPANDED_KEY = "expandedCategories";
const CUSTOM_LINKS_KEY = "customLinks";

const getInitialExpanded = (): Record<string, boolean> => {
  try {
    return JSON.parse(localStorage.getItem(EXPANDED_KEY) || "{}");
  } catch {
    return {};
  }
};

const getInitialCustomLinks = (): Link[] => {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_LINKS_KEY) || "[]");
  } catch {
    return [];
  }
};

const Links = ({ userId }: LinksProps) => {
  const [expandedCategories, setExpandedCategories] = useState(getInitialExpanded);
  const [customLinks, setCustomLinks] = useState<Link[]>(getInitialCustomLinks);
  const [showForm, setShowForm] = useState(false);
  const [newLinkName, setNewLinkName] = useState("");
  const [newLinkHref, setNewLinkHref] = useState("");

  useEffect(() => {
    localStorage.setItem(EXPANDED_KEY, JSON.stringify(expandedCategories));
  }, [expandedCategories]);

  useEffect(() => {
    const loadLinks = async () => {
      const linksRef = collection(db, "users", userId, "links");
      const snapshot = await getDocs(linksRef);
      const linksFromDb: Link[] = snapshot.docs.map(doc => doc.data() as Link);

      let localLinks: Link[] = [];
      try {
        const stored = localStorage.getItem(CUSTOM_LINKS_KEY);
        if (stored) {
          localLinks = JSON.parse(stored);
        }
      } catch (e) {
        console.error("Error parsing local links:", e);
      }

      const dbLinksSet = new Set(linksFromDb.map(link => link.href));
      const linksToAdd = localLinks.filter(link => !dbLinksSet.has(link.href));
      const mergedLinks = [...linksFromDb, ...linksToAdd];

      // Write missing ones to Firestore
      await Promise.all(
        linksToAdd.map(link =>
          setDoc(doc(db, "users", userId, "links", encodeURIComponent(link.href)), link)
        )
      );

      // Cleanup localStorage
      if (linksToAdd.length > 0) {
        localStorage.removeItem(CUSTOM_LINKS_KEY);
      }

      setCustomLinks(mergedLinks);
    };

    loadLinks();
  }, [userId]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleAddLink = async () => {
    if (!newLinkName.trim() || !newLinkHref.trim()) return;
    const newLink = { name: newLinkName.trim(), href: newLinkHref.trim() };
    const updated = [...customLinks, newLink];

    setCustomLinks(updated);
    setExpandedCategories(prev => ({ ...prev, "Mine lenker": true }));
    setNewLinkName("");
    setNewLinkHref("");
    setShowForm(false);

    await setDoc(
      doc(db, "users", userId, "links", encodeURIComponent(newLink.href)),
      newLink
    );
  };

  const allCategories: LinkCategory[] = [
    ...STATIC_CATEGORIES,
    ...(customLinks.length > 0 ? [{ category: "Mine lenker", links: customLinks }] : []),
  ];

  return (
    <div className="card has-header grow-1">
      <div className="card-header">
        <h3 className="card-title">Lenker</h3>
        {!showForm && <i className="fa-solid fa-plus blue icon-md hover" onClick={() => setShowForm(prev => !prev)}></i>}
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
              <button className="btn"
                onClick={handleAddLink}>
                  <i className="fa-solid fa-check" ></i>
                  <p>Opprett</p>
              </button>
              <button onClick={() => setShowForm(false)}>
                <p>Avbryt</p>
                <i className="fa-solid fa-cancel red" ></i>
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
              <i className={`fa-solid fa-caret-${isExpanded ? "up" : "down"} lightgrey`}></i>
            </div>

            {isExpanded && (
              <ul>
                {links.map(link => (
                  <li key={link.href}>
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
