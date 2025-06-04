import { useState, useEffect } from "react";

type LinkCategory = {
  category: string;
  links: {
    name: string;
    href: string;
  }[];
};

const linkCategories: LinkCategory[] = [
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
    links: [
      { name: "Kiwa", href: "https://labservices.kiwa.com/eCal_NO/Login.aspx?nochk=-1&lng=EN" },
    ],
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

const LOCAL_STORAGE_KEY = "expandedCategories";

// Load from localStorage synchronously at component initialization
const getInitialExpandedCategories = (): Record<string, boolean> => {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      console.warn("Invalid JSON in localStorage");
    }
  }
  // Initialize all categories as collapsed
  return {};
};

const Links = () => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(getInitialExpandedCategories);

  // Save to localStorage whenever expandedCategories changes
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(expandedCategories));
  }, [expandedCategories]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  return (
    <div className="card has-header grow-1">
      <div className="card-header">
        <h3 className="card-title">Lenker</h3>
        <i className="fa-solid fa-plus blue icon-md"></i>
      </div>

      {linkCategories.map(({ category, links }) => {
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
