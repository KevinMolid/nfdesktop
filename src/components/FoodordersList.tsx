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
  // Support both old and new formats:
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
  const [showOrdersModal, setShowOrdersModal] = useState(false)

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
        const data = doc.data();
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

  const renderPageOrder = (
    item: string,
    options?: FoodItem["options"],
  ) => {
    const removeList = options?.remove ?? [];
    const extraList = options?.extra ?? [];
    const size = options?.sizes;
    const spice = options?.spice;

    return (
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
        {spice && spice !== "Medium" && <div>{spice}</div>}
        {removeList.length > 0 && <div>Uten {removeList.join(", ")}</div>}
        {extraList.map((extra, i) => (
          <div key={i}>{extra}</div>
        ))}
      </div>
    );
  };

  return (
    <div className="card has-header grow-1">
      <div className="card-header">

        <h3>Orders</h3>
        <div className="card-header-right icon-container">
          <button onClick={() => setShowOrdersModal(!showOrdersModal)}><i className="fa-solid fa-file"></i> Show Page</button>
          {user.role === "admin" && orders.length !== 0 && (
          <button className="delete-btn" onClick={clearAllOrders}>
            <i className="fa-solid fa-trash"></i>
            Delete orders
          </button>
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
                style={{ marginBottom: "1rem" }}
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

        {/* Modal */}
      {showOrdersModal && <div className="modal">
        <button onClick={() => setShowOrdersModal(!showOrdersModal)}><i className="fa-solid fa-x"></i> Close</button>
        <ul className="foodorders-list">
            {orders.map((order) => (
              <div
                className={
                  order.createdBy === user.username
                    ? "foodorders-item-user"
                    : "foodorders-item"
                }
                key={order.id}
                style={{ marginBottom: "1rem" }}
              >
                {usersMap[order.createdBy] || order.createdBy}
                <ul>
                  {order.order?.map((item, index) =>
                    renderPageOrder(
                      item.item,
                      item.options,
                    )
                  )}
                  {order.item &&
                    renderPageOrder(
                      order.item,
                      order.options,
                    )}
                </ul>
              </div>
            ))}
          </ul>
      </div>}
    </div>
  );
};

export default FoodordersList;
