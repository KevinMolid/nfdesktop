import { useRef, useState } from "react";
import ToggleSwitch from "./ToggleSwitch";
import StageSlider from "./StageSlider";

import { db } from "./firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";

import "./Foodorders.css";

type UsersProps = {
  user: {
    username: string;
    role: string;
  },
  setMessage: (msg: string) => void
};

const Foodorders = ({user, setMessage}: UsersProps) => {
  const menu = [
    {
      name: "Kebab i Pita",
      img: "https://www.gilde.no/assets/images/_heroimage/3456020/Gilde_Kebabkjott_kebab_i_pita_miljobilde_no034179_Foto_Stian_Broch.png",
      sizes: ["Liten", "Stor"],
      spice: ["Mild", "Medium", "Sterk"],
      extra: ["Ekstra dressing", "Pommes Frittes oppi", "Ekstra pita"],
      remove: ["Løk"],
      price: "100"
    },
    {
      name: "Kebab i Rull",
      img: "https://i1.vrs.gd/gladkokken/uploads/images/DSC_0442.jpg?width=1000&height=556&format=jpg&quality=80&crop=5159%2C2869%2C0%2C349",
      sizes: ["Liten", "Stor"],
      spice: ["Mild", "Medium", "Sterk"],
      extra: ["Ekstra dressing", "Pommes Frittes oppi", "Ekstra pita"],
      remove: ["Løk"],
      price: "100"
    },
    {
      name: "Döner i Pita",
      img: "https://oppdagoslo.no/wp-content/uploads/2024/08/Kebab-Oslo.png",
      sizes: ["Liten", "Stor"],
      spice: ["Mild", "Medium", "Sterk"],
      extra: ["Ekstra dressing", "Pommes Frittes oppi", "Ekstra pita"],
      remove: ["Løk"],
      price: "129"
    },
    {
      name: "Döner i Rull",
      img: "https://imageproxy.wolt.com/menu/menu-images/shared/8c5f553c-a72c-11ee-80cb-2e89079b6b30_doner_i_rull.jpg",
      sizes: ["Liten", "Stor"],
      spice: ["Mild", "Medium", "Sterk"],
      extra: ["Ekstra dressing", "Pommes Frittes oppi", "Ekstra pita"],
      remove: ["Løk"],
      price: "129"
    },
    {
      name: "Kebab Tallerken",
      img: "https://smilelevering.com/wp-content/uploads/2021/09/c017d2e2-7ad8-11eb-935f-cabe328652e3_kebabtallerken-1024x575.jpeg",
      spice: ["Mild", "Medium", "Sterk"],
      extra: ["Ekstra dressing", "Ekstra pita"],
      remove: ["Løk"],
      price: "159"
    },
  ];

  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedFood, setSelectedFood] = useState<string | null>(null);
  const [orderOptions, setOrderOptions] = useState<any>({});
  const [orderList, setOrderList] = useState<{ item: string; options: any }[]>([]);

  const handleSelectFood = (foodName: string) => {
    const selected = menu.find((item) => item.name === foodName);
    const initialSize = selected?.sizes?.[0];
      const defaultSpice = selected?.spice?.includes("Medium")
    ? "Medium"
    : selected?.spice?.[0];

    setSelectedFood(foodName);
    setOrderOptions({
  ...(initialSize ? { sizes: initialSize } : {}),
  ...(defaultSpice ? { spice: defaultSpice } : {}),
});
  };

  const handleChange = (type: string, value: string, isRadio = false) => {
    setOrderOptions((prev: any) => {
      if (isRadio) {
        return { ...prev, [type]: value };
      } else {
        const currentSet = new Set(prev[type] || []);
        currentSet.has(value) ? currentSet.delete(value) : currentSet.add(value);
        return { ...prev, [type]: Array.from(currentSet) };
      }
    });
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === "left" ? -200 : 200,
        behavior: "smooth"
      });
    }
  };

  const selectedItem = menu.find((item) => item.name === selectedFood);

  return (
    <div className="card has-header grow-1">
      <div className="card-header">
        <h3>Bestille Kebab</h3>
      </div>

      <div className="scroll-wrapper">
        <button className="scroll-button left" onClick={() => scroll("left")}>
          <i className="fa-solid fa-chevron-left"></i>
        </button>
        <div className="food-scroll" ref={scrollRef}>
          {menu.map((food) => (
            <div
              key={food.name}
              className={`food-card ${selectedFood === food.name ? "selected" : ""}`}
              onClick={() => handleSelectFood(food.name)}
            >
              {food.img ? (
                <img src={food.img} alt={food.name} />
              ) : (
                <div className="placeholder" />
              )}
              <div className="food-info">
                <h3>{food.name}</h3>
                <p>{food.price} NOK</p>
              </div>
            </div>
          ))}
        </div>
        <button className="scroll-button right" onClick={() => scroll("right")}>
          <i className="fa-solid fa-chevron-right"></i>
        </button>
      </div>

      {selectedItem && (
        <div className="food-options">
        {(["sizes", "spice", "extra", "remove"] as const).map((type) =>
          selectedItem[type]?.length ? (
            <div key={type}>
              <h4>{type === "sizes" ? "Størrelse" : type === "spice" ? "Styrke" : type === "extra" ? "Ekstra" : "Uten"}:</h4>
              {type === "sizes" && selectedItem.sizes?.length === 2 ? (
                (() => {
                  const [size1, size2] = selectedItem.sizes!;
                  return (
                    <ToggleSwitch
                      value={orderOptions.sizes}
                      onChange={(val) => handleChange("sizes", val, true)}
                      labels={[size1, size2]}
                    />
                  );
                })()
              ) : type === "spice" ? (
                <StageSlider
                  value={orderOptions.spice || selectedItem.spice[0]}
                  onChange={(val) => handleChange("spice", val, true)}
                  labels={selectedItem.spice}
                />
              ) : (
                selectedItem[type].map((val: string) => (
                  <div className="options">
                    <label key={val}>
                      <input
                        type="checkbox"
                        name={type}
                        checked={orderOptions[type]?.includes(val)}
                        onChange={() => handleChange(type, val)}
                      />
                      {val}
                    </label>
                  </div>
                ))
              )}
            </div>
          ) : null
        )}
          <button
            className="add-btn"
            onClick={() => {
              if (selectedFood) {
                setOrderList((prev) => [...prev, { item: selectedFood, options: orderOptions }]);
                setMessage(`${selectedFood} lagt til i bestilling`);
                setSelectedFood(null);         // Reset selected food
                setOrderOptions({});           // Reset options
              }
            }}
          >
            Legg til
          </button>
        </div>
      )}

      {/* Active order */}
      {orderList.length > 0 && (
        <div className="order-list">
          <h4>Min bestilling</h4>
          <ul>
            {orderList.map((order, index) => (
              <li key={index}>
                <div>
                  <strong>
                    {order.item}
                    {order.options.sizes === "Stor" ? ` ${order.options.sizes}` : ""}
                  </strong>
                </div>
                <div>
                  {Object.entries(order.options)
                    .filter(([key, val]) => {
                      if (key === "sizes") return false; // skip showing size
                      if (key === "spice" && val === "Medium") return false; // skip default spice
                      return true; // show all other options
                    })
                    .map(([key, val]) => (
                      <div key={key}>
                        {Array.isArray(val) ? (val as any[]).join(", ") : (val as any)}
                      </div>
                    ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        className="confirm-btn"
        onClick={async () => {
          try {
            const docRef = await addDoc(collection(db, "foodorders"), {
              order: orderList,
              createdAt: Timestamp.now(),
              createdBy: user.username,
            });
            console.log("Order placed with ID: ", docRef.id);
            setMessage("Bestilling sendt!");
            setOrderList([]); // Clear the order list
          } catch (error) {
            console.error("Error adding document: ", error);
            setMessage("Noe gikk galt med bestillingen.");
          }
        }}
        disabled={orderList.length === 0}
      >
        Bestill
      </button>
    </div>
  );
};

export default Foodorders;
