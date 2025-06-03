import { useEffect, useState } from "react";
import { onSnapshot, collection, Timestamp } from "firebase/firestore";
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

const FoodordersList = () => {
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [loading, setLoading] = useState(true);

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

    return () => unsubscribe(); // Cleanup on unmount
  }, []);

  return (
    <div className="card has-header grow-1">
      <div className="card-header">
        <h3>Bestillinger</h3>
      </div>
      <div className="card-content">
        {loading ? (
          <p>Laster bestillinger...</p>
        ) : orders.length === 0 ? (
          <p>Ingen bestillinger ennå.</p>
        ) : (
          <ul className="foodorders-list">
            {orders.map((order) => (
              <li className="foodorders-item" key={order.id} style={{ marginBottom: "1rem" }}>
                <p className="message-info">
                    <strong className="user">{order.createdBy}</strong>
                    <small className="message-timestamp">{order.createdAt?.toDate().toLocaleString("no-NO")}</small>
                </p>
                <ul style={{ paddingLeft: "1rem" }}>
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
                            <div>Uten: {removeList.join(", ")}</div>
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
