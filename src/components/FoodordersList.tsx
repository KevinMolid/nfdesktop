import { useEffect, useState } from "react";
import {
  onSnapshot,
  collection,
  Timestamp,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "./firebase";

import Button from "./Button";

type FoodItem = {
  item: string;
  options?: {
    remove?: string[];
    extra?: string[];
    sizes?: string;
    spice?: string;
  };
};

type FoodOrder = {
  id: string;
  createdBy: string;
  createdAt: Timestamp;
  order?: FoodItem[];
  item?: string;
  options?: FoodItem["options"];
  drink?: string;
  price?: string;
};

type User = {
  id: string;
  username: string;
  role: string;
};

type FoodordersListProps = {
  user: User;
};

const FoodordersList = ({ user }: FoodordersListProps) => {
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});
  const [showOrdersModal, setShowOrdersModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "foodorders"),
      (snapshot) => {
        const updatedOrders = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as unknown as FoodOrder[];

        setOrders(updatedOrders);
        setLoading(false);
      },
      (error) => {
        console.error("Error listening to food orders:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const map: Record<string, string> = {};
      snapshot.forEach((doc) => {
        const data = doc.data() as {
          username: string;
          nickname?: string;
          name?: string;
        };
        const username = data.username;
        const nickname = data.nickname?.trim();
        const name = data.name?.trim();
        map[username] = nickname || name || username;
      });
      setUsersMap(map);
    });

    return () => unsubscribe();
  }, []);

  const clearAllOrders = async () => {
    const confirm = window.confirm(
      "Are you sure you want to delete all orders?"
    );
    if (!confirm) return;

    try {
      const querySnapshot = await getDocs(collection(db, "foodorders"));
      const deletions = querySnapshot.docs.map((docSnap) =>
        deleteDoc(doc(db, "foodorders", docSnap.id))
      );
      await Promise.all(deletions);
      console.log("Alle bestillinger er slettet.");
    } catch (error) {
      console.error("Feil ved sletting av bestillinger:", error);
    }
  };

  // ---------- Helpers for modal formatting ----------

  const sizeLabel = (size?: string) => {
    if (!size || size === "Normal") return "";
    if (size === "Large") return " Stor";
    return ` ${size}`;
  };

  const transformExtras = (arr: string[]) =>
    arr.map((x) => {
      const t = x.trim().toLowerCase();
      // match common spellings
      if (t === "pommes frittes" || t === "pommes frites") {
        return "Pommes Frittes oppi";
      }
      return x;
    });

  // Basic HTML escape to keep bold tags safe & avoid injecting markup
  const escapeHtml = (s: string) =>
    s
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const escapeJoin = (arr: string[]) => arr.map(escapeHtml).join(", ");

  const formatItemBlockHtml = (
    displayName: string,
    item: string,
    options?: FoodItem["options"]
  ) => {
    const removeList = options?.remove ?? [];
    const extraList = options?.extra ?? [];
    const spice = options?.spice;
    const size = options?.sizes;

    const shortName = (displayName || "").slice(0, 6);
    const paddedName = shortName.padEnd(6, " ");

    const lines: string[] = [];

    lines.push(
      `${escapeHtml(paddedName)}\t` +
        `<strong>${escapeHtml(item)}${escapeHtml(sizeLabel(size))}</strong>`
    );

    if (spice && spice !== "Medium") lines.push(`\t\t${escapeHtml(spice)}`);
    if (removeList.length > 0) lines.push(`\t\tUten ${escapeJoin(removeList)}`);

    // Extras + empty line under it
    const prettyExtras = transformExtras(extraList);
    if (prettyExtras.length > 0) {
      lines.push(`\t\t${escapeJoin(prettyExtras)}`);
    }

    lines.push("");
    return lines.join("\n ");
  };

  const renderOrder = (
    item: string,
    options?: FoodItem["options"],
    drink?: string,
    price?: string
  ) => {
    const removeList = options?.remove ?? [];
    const extraList = options?.extra ?? [];
    const size = options?.sizes;
    const spice = options?.spice;

    return (
      <li>
        <div>
          <strong>
            {item}
            {size === "Normal"
              ? ""
              : size === "Large"
              ? " Stor"
              : size
              ? ` ${size}`
              : ""}
          </strong>
        </div>
        {spice && spice !== "Medium" && <div>{spice}</div>}
        {removeList.length > 0 && <div>Uten {removeList.join(", ")}</div>}
        {extraList.map((extra, i) => (
          <div key={i}>{extra}</div>
        ))}
        <div>{drink}</div>
        <div className="foodorders-item-price">{price},-</div>
      </li>
    );
  };

  return (
    <div className="card has-header grow">
      <div className="card-header">
        <h3 className="card-title">Orders</h3>
        <div className="card-header-right">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowOrdersModal(!showOrdersModal)}
            iconLeft={<i className="fa-solid fa-file"></i>}
          >
            Show Page
          </Button>
          {user.role === "admin" && orders.length !== 0 && (
            <Button
              size="sm"
              variant="destructive"
              className="delete-btn"
              onClick={clearAllOrders}
              iconLeft={<i className="fa-solid fa-trash"></i>}
            >
              Delete orders
            </Button>
          )}
        </div>
      </div>
      <div className="card-content">
        {loading ? (
          <p>Loading orders...</p>
        ) : orders.length === 0 ? (
          <p>There are currently no orders.</p>
        ) : (
          <ul className="foodorders-list">
            {orders.map((order) => (
              <li
                className={
                  order.createdBy === user.username
                    ? "foodorders-item-user"
                    : "foodorders-item"
                }
                key={order.id}
              >
                <p className="message-info">
                  <strong className="user">
                    {usersMap[order.createdBy] || order.createdBy}
                  </strong>
                </p>
                <ul>
                  {order.order?.map((item, index) =>
                    renderOrder(
                      item.item,
                      item.options,
                      order.drink,
                      order.price
                    )
                  )}
                  {order.item &&
                    renderOrder(
                      order.item,
                      order.options,
                      order.drink,
                      order.price
                    )}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Orders Modal */}
      {showOrdersModal && (
        <div className="modal foodorders-modal">
          <Button
            variant="tertiary"
            size="sm"
            onClick={() => setShowOrdersModal(!showOrdersModal)}
            iconLeft={<i className="fa-solid fa-x"></i>}
          >
            Close
          </Button>

          <ul className="foodorders-modal-list">
            {orders.map((order) => {
              const displayName = usersMap[order.createdBy] || order.createdBy;

              // Build one HTML block per item in the order
              const blocks: string[] = [];

              if (order.order?.length) {
                order.order.forEach((itm) => {
                  blocks.push(
                    formatItemBlockHtml(displayName, itm.item, itm.options)
                  );
                });
              }

              if (order.item) {
                blocks.push(
                  formatItemBlockHtml(displayName, order.item, order.options)
                );
              }

              const modalHtml = blocks.join("\n");

              return (
                <li key={order.id}>
                  <pre
                    className="foodorders-modal-text"
                    style={{
                      whiteSpace: "pre",
                      lineHeight: 1.35,
                      margin: 0,
                      fontFamily: "inherit",
                      // Optional: control tab stop width if you want tighter columns
                      // tabSize: 8 as any,
                    }}
                    dangerouslySetInnerHTML={{ __html: modalHtml }}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FoodordersList;
