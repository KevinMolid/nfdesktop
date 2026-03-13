import { useRef, useState, useEffect } from "react";
import RadioButton from "./RadioButton";
import StageSlider from "./StageSlider";
import { AnimatedButton } from "./AnimatedButton";

import FoodordersList, { FoodOrder } from "./FoodordersList";

import SafeWrapper from "./SafeWrapper";

import { db } from "./firebase";
import {
  doc,
  updateDoc,
  collection,
  addDoc,
  Timestamp,
  onSnapshot,
} from "firebase/firestore";

type MessageType = "success" | "error" | "info" | "warning" | "";

type UsersProps = {
  user: {
    username: string;
    role: string;
    id: string;
  };
  setAlerts: React.Dispatch<
    React.SetStateAction<{ text: string; type: MessageType }>
  >;
};

const Foodorders = ({ user, setAlerts }: UsersProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedFood, setSelectedFood] = useState<string | null>(null);
  const [orderOptions, setOrderOptions] = useState<any>({});
  const [drink, setDrink] = useState<string>("");
  const [otherDrink, setOtherDrink] = useState("");
  const [orderFor, setOrderFor] = useState<string>(user.username);
  const [userOptions, setUserOptions] = useState<
    Array<{ username: string; label: string }>
  >([]);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      const opts = snap.docs
        .map((d) => {
          const data = d.data() as {
            username: string;
            nickname?: string;
            name?: string;
          };
          const label = (
            data.nickname?.trim() ||
            data.name?.trim() ||
            data.username ||
            ""
          ).toString();
          return { username: data.username, label };
        })
        .sort((a, b) => a.label.localeCompare(b.label));

      setUserOptions(opts);

      // If the selected user disappears, fall back to current user
      if (!opts.some((o) => o.username === orderFor)) {
        setOrderFor(user.username);
      }
    });

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.username]);

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
      prices: ["103", "138"],
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
      prices: ["103", "138"],
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
      prices: ["137", "167"],
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
      prices: ["137", "167"],
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
      img: "https://www.kebabzone.no/cdn/shop/files/kebabtallerken.jpg?v=1722503247&width=1946",
      spice: ["Mild", "Medium", "Medium+", "Sterk"],
      extra: [
        { name: "Ekstra dressing", price: 5 },
        { name: "Pepper", price: 0 },
        { name: "Jalapeños", price: 0 },
        { name: "Ekstra pita", price: 15 },
      ],
      remove: ["Løk", "Tomat", "Pepper"],
      prices: ["168"],
    },
    {
      name: "Döner Tallerken",
      description: "Oksekjøtt med tilbehør ved siden av.",
      img: "https://www.kebabzone.no/cdn/shop/files/kebabtallerken.jpg?v=1722503247&width=1946",
      spice: ["Mild", "Medium", "Medium+", "Sterk"],
      extra: [
        { name: "Ekstra dressing", price: 5 },
        { name: "Pepper", price: 0 },
        { name: "Jalapeños", price: 0 },
        { name: "Ekstra pita", price: 15 },
      ],
      remove: ["Løk", "Tomat", "Pepper"],
      prices: ["202"],
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
      description: "Cheeseburger med pommes ved siden av.",
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
        {
      name: "Smashburger",
      sizes: ["130g", "160g", "255g"],
      description: "Smashburger.",
      img: "https://www.beefeaterbbq.com/contentassets/0285902d92324c289cdbadbb3ea4e38e/issac-burger-banner-1470x738.jpg",
      spice: ["Mild", "Medium", "Medium+", "Sterk"],
      extra: [
        { name: "Ekstra dressing", price: 5 },
        { name: "Pepper", price: 0 },
        { name: "Jalapeños", price: 0 },
        { name: "Ekstra pita", price: 15 },
      ],
      remove: ["Løk", "Tomat", "Pepper"],
      prices: ["???", "???", "???"],
    },
    {
      name: "Smashburger Tallerken",
      sizes: ["130g", "160g", "255g"],
      description: "Smashburger med pommes ved siden av.",
      img: "data:image/jpeg;base64,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",
      spice: ["Mild", "Medium", "Medium+", "Sterk"],
      extra: [
        { name: "Ekstra dressing", price: 5 },
        { name: "Pepper", price: 0 },
        { name: "Jalapeños", price: 0 },
        { name: "Ekstra pita", price: 15 },
      ],
      remove: ["Løk", "Tomat", "Pepper"],
      prices: ["???", "???", "???"],
    },
  ];

  const drinks = [
    { name: "Cola", price: 18 },
    { name: "Cola Zero", price: 18 },
    { name: "Solo", price: 18 },
    { name: "Other", price: "???" },
    { name: "No drink", price: 0 },
  ];

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

  const handleEditOrder = (order: FoodOrder) => {
    setSelectedFood(order.item || null);
    setOrderOptions(order.options || {});
    setDrink(order.drink || "");
    setOtherDrink(order.drink === "Other" ? order.drink ?? "" : "");
    setOrderFor(order.createdBy);
    setEditingOrderId(order.id);
  };

  const handleExtraChange = (name: string) => {
    setOrderOptions((prev: any) => {
      const updated = prev.extra?.includes(name)
        ? prev.extra.filter((e: any) => e !== name)
        : [...(prev.extra || []), name];
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
      selectedPrice = selectedItem.prices[0];
    } else if (selectedItem.sizes && orderOptions.sizes) {
      const sizeIndex = selectedItem.sizes.indexOf(orderOptions.sizes);
      if (sizeIndex !== -1 && selectedItem.prices[sizeIndex]) {
        selectedPrice = selectedItem.prices[sizeIndex];
      }
    }
  }

  // --- total price for UI ---
  let finalPrice: string | number = "???";

  if (selectedItem) {
    if (selectedPrice !== "???") {
      const foodPrice = parseInt(selectedPrice, 10);

      const extrasPrice = (selectedItem.extra || [])
        .filter((e: any) => orderOptions.extra?.includes(e.name))
        .reduce((sum: number, e: any) => sum + (e.price || 0), 0);

      const drinkObj = drinks.find((d) => d.name === drink);
      if (drinkObj && drinkObj.price === "???") {
        finalPrice = "???";
      } else {
        const drinkPrice =
          drinkObj && typeof drinkObj.price === "number" ? drinkObj.price : 0;

        finalPrice = foodPrice + extrasPrice + drinkPrice;
      }
    } else {
      finalPrice = "???";
    }
  }

  const selectedUserLabel =
    userOptions.find((u) => u.username === orderFor)?.label || orderFor;

  return (
    <div className="container">
      <div className="page-header">
        <h1>Food orders</h1>
      </div>
      <div className="widget-container">
        {/* Order food */}
        <div className="card has-header grow">
          <div className="card-header">
            <h3 className="card-title">Select food</h3>
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
                  className={`food-card pb-4 rounded-lg cursor-pointer transform transition-all duration-200 
                    hover:-translate-y-1 ${
                      selectedFood === food.name ? "bg-(--bg3-color)" : ""
                    }`}
                  onClick={() => handleSelectFood(food.name)}
                >
                  {food.img ? (
                    <img
                      src={food.img}
                      alt={food.name}
                      className="rounded-lg"
                    />
                  ) : (
                    <div className="placeholder" />
                  )}
                  <div className="price-label">
                    <p>NOK</p>
                    <p className="price">{food.prices.join(" / ")}</p>
                  </div>
                  <div className={"px-2"}>
                    <div className="text-sm mt-2">
                      <h3 className="font-semibold">{food.name}</h3>
                    </div>
                    <div className="text-sm text-(--text3-color)">
                      <p>{food.description}</p>
                    </div>
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
            <div className="food-container bg-(--bg3-color) mt-4 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl">{selectedItem.name}</h2>
                {user.role === "admin" && (
                  <div className="flex my-2">
                    <select
                      value={orderFor}
                      onChange={(e) => setOrderFor(e.target.value)}
                      className="bg-(--bg2-color) px-4 py-2 cursor-pointer rounded-full"
                    >
                      {userOptions.map((u) => (
                        <option
                          key={u.username}
                          value={u.username}
                          className="cursor-pointer"
                        >
                          {u.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="food-options">
                {(["sizes", "spice", "extra", "remove"] as const).map((type) =>
                  selectedItem[type]?.length ? (
                    <div key={type}>
                      <h4 className="food-options-header font-semibold">
                        {type === "sizes"
                          ? "Size"
                          : type === "spice"
                          ? "Spiciness"
                          : type === "extra"
                          ? "Extras"
                          : "Without"}
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
                      ) : type === "extra" ? (
                        selectedItem.extra?.map((val: any) => (
                          <div className="options" key={val.name}>
                            <label className="flex gap-2">
                              <input
                                type="checkbox"
                                checked={
                                  orderOptions.extra?.includes(val.name) ||
                                  false
                                }
                                onChange={() => handleExtraChange(val.name)}
                              />
                              {val.name}
                            </label>
                          </div>
                        ))
                      ) : (
                        selectedItem[type].map((val: string) => (
                          <div className="options" key={val + "idk"}>
                            <label className="flex gap-2">
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
                <div>
                  <h4 className="font-semibold">Drink</h4>
                  <div>
                    <RadioButton
                      value={drink}
                      onChange={(val) => setDrink(val)}
                      labels={drinks.map((d) => d.name)}
                    />
                    {drink === "Other" && (
                      <div className="other-drink-container">
                        <label htmlFor="drink">
                          <h4>Specify drink:</h4>
                        </label>
                        <input
                          id="drink"
                          type="text"
                          value={otherDrink}
                          onChange={(e) => setOtherDrink(e.target.value)}
                        />
                      </div>
                    )}
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
                        setAlerts({
                          text: "Please select a drink!",
                          type: "warning",
                        });
                        return;
                      }

                      if (drink === "Other" && !otherDrink.trim()) {
                        setAlerts({
                          text: "Please specify drink when selecting 'Other'",
                          type: "warning",
                        });
                        return;
                      }

                      const drinkValue =
                        drink === "Other" ? otherDrink.trim() : drink;

                      try {
                        if (editingOrderId) {
                          // UPDATE existing order
                          const ref = doc(db, "foodorders", editingOrderId);
                          await updateDoc(ref, {
                            item: selectedFood,
                            options: orderOptions,
                            drink: drinkValue,
                            price: finalPrice,
                            createdAt: Timestamp.now(), // optional: may want to keep original timestamp
                            createdBy:
                              user.role === "admin"
                                ? orderFor
                                : user.username,
                          });
                          setAlerts({
                            text: `Updated order for ${selectedUserLabel}: ${selectedFood} with ${drinkValue}.`,
                            type: "success",
                          });
                        } else {
                          // ADD new order
                          await addDoc(collection(db, "foodorders"), {
                            item: selectedFood,
                            options: orderOptions,
                            drink: drinkValue,
                            price: finalPrice,
                            createdAt: Timestamp.now(),
                            createdBy:
                              user.role === "admin"
                                ? orderFor
                                : user.username,
                          });
                          setAlerts({
                            text:
                              (user.role === "admin" &&
                              orderFor !== user.username
                                ? `Order for ${selectedUserLabel}: `
                                : "Ordered ") +
                              `${selectedFood} with ${drinkValue}.`,
                            type: "success",
                          });
                        }

                        // reset state
                        setEditingOrderId(null);
                        setSelectedFood(null);
                        setDrink("");
                        setOtherDrink("");
                        setOrderOptions({});
                        // reset dropdown to default user
                        setOrderFor(user.username);
                      } catch (error) {
                        console.error("Feil ved bestilling:", error);
                        setAlerts({
                          text: "Something went wrong with the order.",
                          type: "error",
                        });
                      }
                    }}
                  >
                    <i className="fa-solid fa-cart-shopping"></i>{" "}
                    {editingOrderId ? "Update" : "Order"}
                  </AnimatedButton>
                </div>
              </div>
            </div>
          )}
        </div>

        <SafeWrapper fallback={<div>Could not load orders</div>}>
          <FoodordersList user={user} onEditOrder={handleEditOrder} />
        </SafeWrapper>
      </div>
    </div>
  );
};

export default Foodorders;
