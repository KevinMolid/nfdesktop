import { useRef, useState } from "react";
import RadioButton from "./RadioButton";
import StageSlider from "./StageSlider";
import { AnimatedButton } from "./AnimatedButton";

import FoodordersList from "./FoodordersList";

import SafeWrapper from "./SafeWrapper";

import { db } from "./firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";

type MessageType = "success" | "error" | "info" | "warning" | "";

type UsersProps = {
  user: {
    username: string;
    role: string;
    id: string;
  };
  setMessage: React.Dispatch<
    React.SetStateAction<{ text: string; type: MessageType }>
  >;
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
        { name: "Ekstra dressing", price: 5 },
        { name: "Pepper", price: 0 },
        { name: "Jalapeños", price: 0 },
        { name: "Pommes Frittes", price: 20 },
        { name: "Ekstra pita", price: 15 },
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
        { name: "Ekstra dressing", price: 5 },
        { name: "Pepper", price: 0 },
        { name: "Jalapeños", price: 0 },
        { name: "Pommes Frittes", price: 20 },
        { name: "Ekstra pita", price: 15 },
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
        { name: "Ekstra dressing", price: 5 },
        { name: "Pepper", price: 0 },
        { name: "Jalapeños", price: 0 },
        { name: "Pommes Frittes", price: 20 },
        { name: "Ekstra pita", price: 15 },
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
        { name: "Ekstra dressing", price: 5 },
        { name: "Pepper", price: 0 },
        { name: "Jalapeños", price: 0 },
        { name: "Pommes Frittes", price: 20 },
        { name: "Ekstra pita", price: 15 },
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
        { name: "Ekstra dressing", price: 5 },
        { name: "Pepper", price: 0 },
        { name: "Jalapeños", price: 0 },
        { name: "Pommes Frittes", price: 20 },
        { name: "Ekstra pita", price: 15 },
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
        { name: "Ekstra dressing", price: 5 },
        { name: "Pepper", price: 0 },
        { name: "Jalapeños", price: 0 },
        { name: "Pommes Frittes", price: 20 },
        { name: "Ekstra pita", price: 15 },
      ],
      remove: ["Løk", "Tomat", "Pepper"],
      prices: ["???"],
    },
    {
      name: "Kebab Tallerken",
      description: "Kebabkjøtt med tilbehør ved siden av.",
      img: "https://smilelevering.com/wp-content/uploads/2021/09/c017d2e2-7ad8-11eb-935f-cabe328652e3_kebabtallerken-1024x575.jpeg",
      spice: ["Mild", "Medium", "Medium+", "Sterk"],
      extra: [
        { name: "Ekstra dressing", price: 5 },
        { name: "Pepper", price: 0 },
        { name: "Jalapeños", price: 0 },
        { name: "Ekstra pita", price: 15 },
      ],
      remove: ["Løk", "Tomat", "Pepper"],
      prices: ["165"],
    },
    {
      name: "Cheeseburger",
      sizes: ["130g", "160g", "255g"],
      description: "Hamburger med ost.",
      img: "https://assets.biggreenegg.eu/app/uploads/2019/03/28145521/topimage-classic-hamburger-2019m04-800x534.jpg",
      spice: ["Mild", "Medium", "Medium+", "Sterk"],
      extra: [
        { name: "Ekstra dressing", price: 5 },
        { name: "Pepper", price: 0 },
        { name: "Jalapeños", price: 0 },
        { name: "Ekstra pita", price: 15 },
      ],
      remove: ["Løk", "Tomat", "Pepper"],
      prices: ["???", "145", "???"],
    },
    {
      name: "Cheeseburger Tallerken",
      sizes: ["130g", "160g", "255g"],
      description: "Cheeseburger med pommes frittes ved siden av.",
      img: "https://gulsetgrillen.no/wp-content/uploads/2022/02/burgertallerkenbasic.png",
      spice: ["Mild", "Medium", "Medium+", "Sterk"],
      extra: [
        { name: "Ekstra dressing", price: 5 },
        { name: "Pepper", price: 0 },
        { name: "Jalapeños", price: 0 },
        { name: "Ekstra pita", price: 15 },
      ],
      remove: ["Løk", "Tomat", "Pepper"],
      prices: ["???", "175", "???"],
    },
  ];

  const drinks = [
    {
      name: "Cola",
      price: 15,
    },
    {
      name: "Cola Zero",
      price: 15,
    },
    {
      name: "Solo",
      price: 15,
    },
    {
      name: "Other",
      price: "???",
    },
    {
      name: "No drink",
      price: 0,
    },
  ];

  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedFood, setSelectedFood] = useState<string | null>(null);
  const [orderOptions, setOrderOptions] = useState<any>({});
  const [drink, setDrink] = useState<string>("");

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

  const handleExtraChange = (name: string) => {
    setOrderOptions((prev: any) => {
      const updated = prev.extra?.includes(name)
        ? prev.extra.filter((e:any) => e !== name) // remove
        : [...(prev.extra || []), name];       // add
      return { ...prev, extra: updated };
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

 // --- total price for UI ---
let finalPrice: string | number = "???";

if (selectedItem) {
  // base food price
  if (selectedPrice !== "???") {
    const foodPrice = parseInt(selectedPrice, 10);

    // extras price (orderOptions.extra holds names)
    const extrasPrice = (selectedItem.extra || [])
      .filter((e: any) => orderOptions.extra?.includes(e.name))
      .reduce((sum: number, e: any) => sum + (e.price || 0), 0);

    // drink price (0 if none selected; ??? only if selected drink is ???)
    const drinkObj = drinks.find((d) => d.name === drink);
    if (drinkObj && drinkObj.price === "???") {
      finalPrice = "???";
    } else {
      const drinkPrice =
        drinkObj && typeof drinkObj.price === "number" ? drinkObj.price : 0;

      finalPrice = foodPrice + extrasPrice + drinkPrice;
    }
  } else {
    // base price is unknown for this size/item
    finalPrice = "???";
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
                      ) : type === "extra"
                        ? selectedItem.extra?.map((val: any) => (
                          <div className="options" key={val.name}>
                          <label>
                            <input
                              type="checkbox"
                              checked={orderOptions.extra?.includes(val.name) || false}
                              onChange={() => handleExtraChange(val.name)}
                            />
                            {val.name}
                          </label>
                          </div>
                        ))
                        : selectedItem[type].map((val: string) => (
                            <div className="options" key={val+"idk"}>
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
                          ))}
                    </div>
                  ) : null
                )}
                <div>
                  <h4>Drink:</h4>
                  <div>
                    <RadioButton
                      value={drink}
                      onChange={(val) => setDrink(val)}
                      labels={drinks.map((d) => d.name)}
                    />
                    {drink === "Other" && <div className="other-drink-container">
                      <label htmlFor="drink"><h4>Specify drink:</h4></label>
                      <input id="drink" type="text" />
                    </div>}
                  </div>
                </div>
                <div className="order-btn-container">
                  <div className="order-price-container">
                    <p>NOK</p>
                    <p className="order-price">{finalPrice || "???"},-</p>
                  </div>
                  <AnimatedButton
                    onClick={async () => {
                      if (!selectedFood) return;

                      if (!drink) {
                        setMessage({
                          text: "Please select a drink before ordering.",
                          type: "error",
                        });
                        return;
                      }

                      try {
                        await addDoc(collection(db, "foodorders"), {
                          item: selectedFood,
                          options: orderOptions,
                          drink: drink,
                          price: finalPrice,
                          createdAt: Timestamp.now(),
                          createdBy: user.username,
                        });
                        setMessage({
                          text: `You ordered ${selectedFood} with ${drink}.`,
                          type: "success",
                        });
                        setSelectedFood(null);
                        setDrink("");
                        setOrderOptions({});
                      } catch (error) {
                        console.error("Feil ved bestilling:", error);
                        setMessage({
                          text: "Noe gikk galt med bestillingen.",
                          type: "error",
                        });
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
