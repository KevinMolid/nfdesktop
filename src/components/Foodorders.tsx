import { useRef, useState } from "react";
import ToggleSwitch from "./ToggleSwitch";
import StageSlider from "./StageSlider";
import { AnimatedButton } from "./AnimatedButton";

import { db } from "./firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";

import "./Foodorders.css";

type UsersProps = {
  user: {
    username: string;
    role: string;
  };
  setMessage: (msg: string) => void;
  toggleActive: (name: string) => void;
};

const Foodorders = ({ user, setMessage, toggleActive }: UsersProps) => {
  const menu = [
    {
      name: "Kebab i Pita",
      description: "Lammekjøtt / Oksekjøtt i pitabrød.",
      img: "https://www.gilde.no/assets/images/_heroimage/3456020/Gilde_Kebabkjott_kebab_i_pita_miljobilde_no034179_Foto_Stian_Broch.png",
      sizes: ["Normal", "Large"],
      spice: ["Mild", "Medium", "Spicy"],
      extra: [
        "Ekstra dressing",
        "Pepper",
        "Jalapeños",
        "Pommes Frittes oppi",
        "Ekstra pita",
      ],
      remove: ["Løk", "Pepper"],
      price: "100/135",
    },
    {
      name: "Kebab i Rull",
      description: "Lammekjøtt / Oksekjøtt i hvete-tortilla.",
      img: "https://i1.vrs.gd/gladkokken/uploads/images/DSC_0442.jpg?width=1000&height=556&format=jpg&quality=80&crop=5159%2C2869%2C0%2C349",
      sizes: ["Normal", "Large"],
      spice: ["Mild", "Medium", "Spicy"],
      extra: [
        "Ekstra dressing",
        "Pepper",
        "Jalapeños",
        "Pommes Frittes oppi",
        "Ekstra pita",
      ],
      remove: ["Løk", "Pepper"],
      price: "100/135",
    },
    {
      name: "Döner i Pita",
      description: "Oksekjøtt i pitabrød.",
      img: "https://oppdagoslo.no/wp-content/uploads/2024/08/Kebab-Oslo.png",
      sizes: ["Normal", "Large"],
      spice: ["Mild", "Medium", "Spicy"],
      extra: [
        "Ekstra dressing",
        "Pepper",
        "Jalapeños",
        "Pommes Frittes oppi",
        "Ekstra pita",
      ],
      remove: ["Løk", "Pepper"],
      price: "129/165",
    },
    {
      name: "Döner i Rull",
      description: "Oksekjøtt i hvete-tortilla.",
      img: "https://imageproxy.wolt.com/menu/menu-images/shared/8c5f553c-a72c-11ee-80cb-2e89079b6b30_doner_i_rull.jpg",
      sizes: ["Normal", "Large"],
      spice: ["Mild", "Medium", "Spicy"],
      extra: [
        "Ekstra dressing",
        "Pepper",
        "Jalapeños",
        "Pommes Frittes oppi",
        "Ekstra pita",
      ],
      remove: ["Løk", "Pepper"],
      price: "129/165",
    },
    {
      name: "Shawarma i Pita",
      description: "Kylling i pitabrød.",
      img: "https://smakfullpbk.com/wp-content/uploads/2021/10/Syrisk-Shawarma-Kylling-Rull-i-Norge.jpg",
      sizes: ["Normal", "Large"],
      spice: ["Mild", "Medium", "Spicy"],
      extra: [
        "Ekstra dressing",
        "Pepper",
        "Jalapeños",
        "Pommes Frittes oppi",
        "Ekstra pita",
      ],
      remove: ["Løk", "Pepper"],
      price: "???",
    },
    {
      name: "Shawarma i Rull",
      description: "Kylling i hvete-tortilla",
      img: "https://ministryofcurry.com/wp-content/uploads/2021/05/chicken-shawarma-6.jpg",
      sizes: ["Normal", "Large"],
      spice: ["Mild", "Medium", "Spicy"],
      extra: [
        "Ekstra dressing",
        "Pepper",
        "Jalapeños",
        "Pommes Frittes oppi",
        "Ekstra pita",
      ],
      remove: ["Løk", "Pepper"],
      price: "???",
    },
    {
      name: "Kebab Tallerken",
      description: "Lammekjøtt / Oksekjøtt med grønnsaker ved siden av.",
      img: "https://smilelevering.com/wp-content/uploads/2021/09/c017d2e2-7ad8-11eb-935f-cabe328652e3_kebabtallerken-1024x575.jpeg",
      spice: ["Mild", "Medium", "Spicy"],
      extra: ["Ekstra dressing", "Pepper", "Jalapeños", "Ekstra pita"],
      remove: ["Løk", "Pepper"],
      price: "165",
    },
  ];

  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedFood, setSelectedFood] = useState<string | null>(null);
  const [orderOptions, setOrderOptions] = useState<any>({});

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
      extra: [],
      remove: [],
    });
  };

  const handleChange = (type: string, value: string, isRadio = false) => {
    setOrderOptions((prev: any) => {
      if (isRadio) {
        return { ...prev, [type]: value };
      } else {
        const currentSet = new Set(prev[type] || []);
        currentSet.has(value)
          ? currentSet.delete(value)
          : currentSet.add(value);
        return { ...prev, [type]: Array.from(currentSet) };
      }
    });
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === "left" ? -200 : 200,
        behavior: "smooth",
      });
    }
  };

  const selectedItem = menu.find((item) => item.name === selectedFood);

  return (
    <div className="card has-header grow-1">
      <div className="card-header">
        <h3>Order Kebab</h3>
        <button
          className="close-widget-btn"
          onClick={() => toggleActive("Kebab")}
        >
          <i className="fa-solid fa-x icon-md hover" />
        </button>
      </div>

      <div className="scroll-wrapper">
        <button className="scroll-button left" onClick={() => scroll("left")}>
          <i className="fa-solid fa-chevron-left"></i>
        </button>
        <div className="food-scroll" ref={scrollRef}>
          {menu.map((food) => (
            <div
              key={food.name}
              className={`food-card ${
                selectedFood === food.name ? "selected" : ""
              }`}
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
              <div className="food-description">
                <p>{food.description}</p>
              </div>
            </div>
          ))}
        </div>
        <button className="scroll-button right" onClick={() => scroll("right")}>
          <i className="fa-solid fa-chevron-right"></i>
        </button>
      </div>

      {selectedItem && (
        <div className="food-container">
          <h2>{selectedItem.name}</h2>
          <div className="food-options">
            {(["sizes", "spice", "extra", "remove"] as const).map((type) =>
              selectedItem[type]?.length ? (
                <div key={type}>
                  <h4>
                    {type === "sizes"
                      ? "Size"
                      : type === "spice"
                      ? "Spice"
                      : type === "extra"
                      ? "Extras"
                      : "Without"}
                    :
                  </h4>
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
                      <div className="options" key={val}>
                        <label>
                          <input
                            type="checkbox"
                            name={type}
                            checked={
                              Array.isArray(orderOptions[type]) &&
                              orderOptions[type].includes(val)
                            }
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
            <div className="order-btn-container">
              <AnimatedButton
                onClick={async () => {
                  if (selectedFood) {
                    try {
                      await addDoc(collection(db, "foodorders"), {
                        item: selectedFood,
                        options: orderOptions,
                        createdAt: Timestamp.now(),
                        createdBy: user.username,
                      });
                      setMessage(`You have ordered ${selectedFood}.`);
                      setSelectedFood(null);
                      setOrderOptions({});
                    } catch (error) {
                      console.error("Feil ved bestilling:", error);
                      setMessage("Noe gikk galt med bestillingen.");
                    }
                  }
                }}
              >
                <i className="fa-solid fa-cart-shopping"></i> Bestill
              </AnimatedButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Foodorders;
