import { useEffect, useState } from "react";
import { onSnapshot, collection, Timestamp, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "./firebase";
import "./Foodorders.css";

type FoodItem = {
  item: string;
  options?: {
    remove?: string[];
    extra?: string[];
    sizes: string;
    spice: string;
  };
};

type FoodOrder = {
  id: string;
  createdBy: string;
  createdAt: Timestamp;
  order: FoodItem[];
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

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "foodorders"), (snapshot) => {
      const updatedOrders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as unknown as FoodOrder[];

      setOrders(updatedOrders);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to food orders:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /* Fetch users data */
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const map: Record<string, string> = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        const username = data.username;
        const nickname = data.nickname?.trim();
        const name = data.name?.trim();
        map[username] = nickname || name || username; // fallback
      });
      setUsersMap(map);
    });

    return () => unsubscribe();
  }, []);

  const clearAllOrders = async () => {
    const confirm = window.confirm("Er du sikker på at du vil slette alle bestillinger?");
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

  return (
    <div className="card has-header grow-1">
      <div className="card-header">
        <h3>Bestillinger</h3>
        {user.role === "admin" && orders.length !== 0 && <button className="btn-red small danger" onClick={clearAllOrders}>
          <i className="fa-solid fa-trash"></i>
          Slett ordre
        </button>}
      </div>
      <div className="card-content">
        {loading ? (
          <p>Laster bestillinger...</p>
        ) : orders.length === 0 ? (
          <p>Det finnes ingen bestillinger.</p>
        ) : (
          <ul className="foodorders-list">
            {orders.map((order) => (
              <li className={order.createdBy === user.username ? "foodorders-item-user" : "foodorders-item"} key={order.id} style={{ marginBottom: "1rem" }}>
                <p className="message-info">
                    <strong className="user">{usersMap[order.createdBy] || order.createdBy}</strong>
                </p>
                <ul style={{ paddingLeft: "rem" }}>
                  {order.order.map((item, index) => {
                    const removeList = item.options?.remove ?? [];
                    const extraList = item.options?.extra ?? [];
                    const size = item.options?.sizes;
                    const spice = item.options?.spice;

                    const showSize = size === "Stor" ? " Stor" : "";

                    return (
                        <li key={index} style={{ marginBottom: "0.75rem" }}>
                        <div>
                            <strong>{item.item}{showSize}</strong>
                        </div>
                        {spice && spice !== "Medium" && <div>{spice}</div>}
                        {removeList.length > 0 && (
                            <div>Uten {removeList.join(", ")}</div>
                        )}
                        {extraList.map((extra, i) => (
                            <div key={i}>{extra}</div>
                        ))}
                        </li>
                    );
                    })}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default FoodordersList;
