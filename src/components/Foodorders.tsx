import { useRef, useState } from "react";
import RadioButton from "./RadioButton";
import StageSlider from "./StageSlider";
import { AnimatedButton } from "./AnimatedButton";

import FoodordersList from "./FoodordersList";

import SafeWrapper from "./SafeWrapper";

import { db } from "./firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";

import "./Foodorders.css";

type UsersProps = {
  user: {
    username: string;
    role: string;
    id: string;
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
      spice: ["Mild", "Medium", "Medium+", "Sterk"],
      extra: [
        "Ekstra dressing",
        "Pepper",
        "Jalapeños",
        "Pommes Frittes oppi",
        "Ekstra pita",
      ],
      remove: ["Løk", "Tomat", "Pepper"],
      prices: ["100", "135"],
    },
    {
      name: "Kebab i Rull",
      description: "Lammekjøtt / Oksekjøtt i hvete-tortilla.",
      img: "https://i1.vrs.gd/gladkokken/uploads/images/DSC_0442.jpg?width=1000&height=556&format=jpg&quality=80&crop=5159%2C2869%2C0%2C349",
      sizes: ["Normal", "Large"],
      spice: ["Mild", "Medium", "Medium+", "Sterk"],
      extra: [
        "Ekstra dressing",
        "Pepper",
        "Jalapeños",
        "Pommes Frittes oppi",
        "Ekstra pita",
      ],
      remove: ["Løk", "Tomat", "Pepper"],
      prices: ["100", "135"],
    },
    {
      name: "Döner i Pita",
      description: "Oksekjøtt i pitabrød.",
      img: "https://oppdagoslo.no/wp-content/uploads/2024/08/Kebab-Oslo.png",
      sizes: ["Normal", "Large"],
      spice: ["Mild", "Medium", "Medium+", "Sterk"],
      extra: [
        "Ekstra dressing",
        "Pepper",
        "Jalapeños",
        "Pommes Frittes oppi",
        "Ekstra pita",
      ],
      remove: ["Løk", "Tomat", "Pepper"],
      prices: ["129", "165"],
    },
    {
      name: "Döner i Rull",
      description: "Oksekjøtt i hvete-tortilla.",
      img: "https://imageproxy.wolt.com/menu/menu-images/shared/8c5f553c-a72c-11ee-80cb-2e89079b6b30_doner_i_rull.jpg",
      sizes: ["Normal", "Large"],
      spice: ["Mild", "Medium", "Medium+", "Sterk"],
      extra: [
        "Ekstra dressing",
        "Pepper",
        "Jalapeños",
        "Pommes Frittes oppi",
        "Ekstra pita",
      ],
      remove: ["Løk", "Tomat", "Pepper"],
      prices: ["129", "165"],
    },
    {
      name: "Shawarma i Pita",
      description: "Kylling i pitabrød.",
      img: "https://smakfullpbk.com/wp-content/uploads/2021/10/Syrisk-Shawarma-Kylling-Rull-i-Norge.jpg",
      sizes: ["Normal", "Large"],
      spice: ["Mild", "Medium", "Medium+", "Sterk"],
      extra: [
        "Ekstra dressing",
        "Pepper",
        "Jalapeños",
        "Pommes Frittes oppi",
        "Ekstra pita",
      ],
      remove: ["Løk", "Tomat", "Pepper"],
      prices: ["???"],
    },
    {
      name: "Shawarma i Rull",
      description: "Kylling i hvete-tortilla",
      img: "https://ministryofcurry.com/wp-content/uploads/2021/05/chicken-shawarma-6.jpg",
      sizes: ["Normal", "Large"],
      spice: ["Mild", "Medium", "Medium+", "Sterk"],
      extra: [
        "Ekstra dressing",
        "Pepper",
        "Jalapeños",
        "Pommes Frittes oppi",
        "Ekstra pita",
      ],
      remove: ["Løk", "Tomat", "Pepper"],
      prices: ["???"],
    },
    {
      name: "Kebab Tallerken",
      description: "Kebabkjøtt med tilbehør ved siden av.",
      img: "https://smilelevering.com/wp-content/uploads/2021/09/c017d2e2-7ad8-11eb-935f-cabe328652e3_kebabtallerken-1024x575.jpeg",
      spice: ["Mild", "Medium", "Medium+", "Sterk"],
      extra: ["Ekstra dressing", "Pepper", "Jalapeños", "Ekstra pita"],
      remove: ["Løk", "Tomat", "Pepper"],
      prices: ["165"],
    },
    {
      name: "Hamburger",
      sizes: ["130g", "160g", "255g"],
      description: "Hamburger.",
      img: "https://assets.biggreenegg.eu/app/uploads/2019/03/28145521/topimage-classic-hamburger-2019m04-800x534.jpg",
      spice: ["Mild", "Medium", "Medium+", "Sterk"],
      extra: ["Ekstra dressing", "Pepper", "Jalapeños", "Ekstra pita"],
      remove: ["Løk", "Tomat", "Pepper"],
      prices: ["???"],
    },
    {
      name: "Burger Tallerken",
      sizes: ["130g", "160g", "255g"],
      description: "Hamburger med pommes frittes ved siden av.",
      img: "https://gulsetgrillen.no/wp-content/uploads/2022/02/burgertallerkenbasic.png",
      spice: ["Mild", "Medium", "Medium+", "Sterk"],
      extra: ["Ekstra dressing", "Pepper", "Jalapeños", "Ekstra pita"],
      remove: ["Løk", "Tomat", "Pepper"],
      prices: ["???"],
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

  let selectedPrice = "";
  if (selectedItem) {
    if (selectedItem.prices.length === 1) {
      // Only one price available → use it
      selectedPrice = selectedItem.prices[0];
    } else if (selectedItem.sizes && orderOptions.sizes) {
      // Match the selected size with its corresponding price
      const sizeIndex = selectedItem.sizes.indexOf(orderOptions.sizes);
      if (sizeIndex !== -1 && selectedItem.prices[sizeIndex]) {
        selectedPrice = selectedItem.prices[sizeIndex];
      }
    }
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Food orders</h1>
      </div>
      <div className="widget-container">
        {/* Order food */}
        <div className="card has-header grow-1">
          <div className="card-header">
            <h3>Order food</h3>
          </div>

          <div className="scroll-wrapper">
            <button
              className="scroll-button left"
              onClick={() => scroll("left")}
            >
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
                  <div className="price-label">
                    <p>NOK</p>
                    <p className="price">{food.prices.join(" / ")}</p>
                  </div>
                  <div className="food-info">
                    <h3>{food.name}</h3>
                  </div>
                  <div className="food-description">
                    <p>{food.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              className="scroll-button right"
              onClick={() => scroll("right")}
            >
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
                      <h4 className="food-options-header">
                        {type === "sizes"
                          ? "Size"
                          : type === "spice"
                          ? "Spiciness"
                          : type === "extra"
                          ? "Extras"
                          : "Without"}
                        :
                      </h4>
                      {type === "sizes" ? (
                        <RadioButton
                          value={orderOptions.sizes}
                          onChange={(val) => handleChange("sizes", val, true)}
                          labels={selectedItem.sizes || ["1", "2"]}
                        />
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
                  <div className="order-price-container">
                    <p>NOK</p>
                    <p className="order-price">{selectedPrice || "???"},-</p>
                  </div>
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
                          setMessage(`You ordered ${selectedFood}.`);
                          setSelectedFood(null);
                          setOrderOptions({});
                        } catch (error) {
                          console.error("Feil ved bestilling:", error);
                          setMessage("Noe gikk galt med bestillingen.");
                        }
                      }
                    }}
                  >
                    <i className="fa-solid fa-cart-shopping"></i> Order
                  </AnimatedButton>
                </div>
              </div>
            </div>
          )}
        </div>

        <SafeWrapper fallback={<div>Could not load orders</div>}>
          <FoodordersList user={user} />
        </SafeWrapper>
      </div>
    </div>
  );
};

export default Foodorders;
