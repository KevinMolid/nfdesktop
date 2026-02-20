import { useEffect, useMemo, useState } from "react";
import {
  onSnapshot,
  collection,
  Timestamp,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { createPortal } from "react-dom";
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

export type FoodOrder = {
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
  // optional so the component can still be used read-only
  onEditOrder?: (order: FoodOrder) => void;
};

const FoodordersList = ({ user, onEditOrder }: FoodordersListProps) => {
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});
  const [showOrdersModal, setShowOrdersModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "foodorders"),
      (snapshot) => {
        const updatedOrders = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
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
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as {
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

  const deleteOrder = async (orderId: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this order?"
    );
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "foodorders", orderId));
      console.log(`Order ${orderId} deleted.`);
      // onSnapshot will update `orders`
    } catch (error) {
      console.error("Error deleting order:", error);
    }
  };

  const clearAllOrders = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete all orders?"
    );
    if (!confirmDelete) return;

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

  // ---------- Date grouping ----------

  const dateKey = (ts?: Timestamp) => {
    if (!ts) return "unknown";
    const d = ts.toDate();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const dateLabel = (key: string) => {
    if (key === "unknown") return "Unknown date";
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const ordersSorted = useMemo(() => {
    return [...orders].sort(
      (a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()
    );
  }, [orders]);

  const dateGroups = useMemo(() => {
    const grouped = ordersSorted.reduce<Record<string, FoodOrder[]>>(
      (acc, o) => {
        const key = dateKey(o.createdAt);
        (acc[key] ??= []).push(o);
        return acc;
      },
      {}
    );

    // Order is preserved because we reduced from a sorted list,
    // but Object.entries depends on insertion order (which matches insertion).
    return Object.entries(grouped);
  }, [ordersSorted]);

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

  // format one item as simple HTML (no name, just order details)
  const formatItemHtml = (item: string, options?: FoodItem["options"]) => {
    const removeList = options?.remove ?? [];
    const extraList = options?.extra ?? [];
    const spice = options?.spice;
    const size = options?.sizes;

    const lines: string[] = [];

    // Main line: item + size
    lines.push(
      `<strong>${escapeHtml(item)}${escapeHtml(sizeLabel(size))}</strong>`
    );

    if (spice && spice !== "Medium") {
      lines.push(escapeHtml(spice));
    }

    if (removeList.length > 0) {
      lines.push(`Uten ${escapeJoin(removeList)}`);
    }

    const prettyExtras = transformExtras(extraList);
    if (prettyExtras.length > 0) {
      lines.push(escapeJoin(prettyExtras));
    }

    // Join each part on its own line
    return lines.join("<br />");
  };

  const renderOrder = (
    key: string,
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
      <li key={key}>
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
        {drink && <div>{drink}</div>}
        {price && <div className="foodorders-item-price">{price},-</div>}
      </li>
    );
  };

  // Modal JSX extracted so we can portal it
  const modalContent = (
    <div
      className="fixed inset-0 z-[1000] flex flex-col 
      items-center justify-start bg-white overflow-y-auto p-6
      text-black"
    >
      <div className="w-full max-w-4xl">
        <div className="flex justify-end mb-4">
          <Button
            variant="transparent"
            size="sm"
            onClick={() => setShowOrdersModal(false)}
            iconLeft={<i className="fa-solid fa-x"></i>}
          >
            Close
          </Button>
        </div>

        {/* Grouped by date (print-friendly) */}
        <div className="mt-16 space-y-10">
          {dateGroups.map(([key, group]) => (
            <div key={key}>
              {/* Two-column table: left = name, right = order */}
              <table className="border-collapse text-[28px] leading-[1.3] w-full">
                <tbody>
                  {group.map((order) => {
                    const displayName =
                      usersMap[order.createdBy] || order.createdBy;

                    const itemBlocks: string[] = [];

                    if (order.order?.length) {
                      order.order.forEach((itm) => {
                        itemBlocks.push(formatItemHtml(itm.item, itm.options));
                      });
                    }

                    if (order.item) {
                      itemBlocks.push(formatItemHtml(order.item, order.options));
                    }

                    const itemsHtml = itemBlocks.join("<br /><br />");

                    return (
                      <tr key={order.id}>
                        {/* LEFT COLUMN — ONLY NAME */}
                        <td className="align-top whitespace-nowrap font-semibold pr-12 py-1">
                          {displayName}
                        </td>

                        {/* RIGHT COLUMN — ONLY ORDER CONTENT */}
                        <td
                          className="align-top py-1 pb-8"
                          dangerouslySetInnerHTML={{ __html: itemsHtml }}
                        />
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="card has-header grow">
        <div className="card-header">
          <h3 className="card-title">Orders</h3>
          <div className="card-header-right">
            {orders.length !== 0 && <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowOrdersModal(true)}
              iconLeft={<i className="fa-solid fa-file"></i>}
            >
              Show Page
            </Button>}
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
            <p className="text-neutral-400">There are currently no orders.</p>
          ) : (
            // Keep ONE flex container list, and inject date headings as list items
            <ul className="foodorders-list">
              {dateGroups.map(([key, group]) => (
                <div key={key} className="contents">
                  {/* Date heading as a list item so it participates in the same flex container */}
                  <li className="w-full">
                    <div className="text-sm font-semibold text-neutral-400 uppercase tracking-wide mt-2 mb-2">
                      {dateLabel(key)}
                    </div>
                  </li>

                  {/* Orders for that date (still siblings in the same flex list) */}
                  {group.map((order) => (
                    <li
                      className={
                        order.createdBy === user.username
                          ? "foodorders-item foodorders-item-user"
                          : "foodorders-item"
                      }
                      key={order.id}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <p className="message-info">
                          <strong className="user text-lg">
                            {usersMap[order.createdBy] || order.createdBy}
                          </strong>
                        </p>
                        <div className="flex gap-1">
                          {(order.createdBy === user.username ||
                            user.role === "admin") &&
                            onEditOrder && (
                              <Button
                                size="xs"
                                variant="secondary"
                                onClick={() => onEditOrder(order)}
                              >
                                Edit
                              </Button>
                            )}
                          {user.role === "admin" && orders.length !== 0 && (
                            <Button
                              size="xs"
                              variant="destructive"
                              onClick={() => deleteOrder(order.id)}
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>

                      <ul>
                        {order.order?.map((itm, index) =>
                          renderOrder(
                            `${order.id}-multi-${index}`,
                            itm.item,
                            itm.options,
                            order.drink,
                            order.price
                          )
                        )}
                        {order.item &&
                          renderOrder(
                            `${order.id}-single`,
                            order.item,
                            order.options,
                            order.drink,
                            order.price
                          )}
                      </ul>
                    </li>
                  ))}
                </div>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Portal the modal into <body> so it's truly viewport-fixed */}
      {showOrdersModal &&
        typeof document !== "undefined" &&
        createPortal(modalContent, document.body)}
    </>
  );
};

export default FoodordersList;
