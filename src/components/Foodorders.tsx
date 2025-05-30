import { useRef, useState } from "react";
import "./Foodorders.css"; // External CSS for better control
import ToggleSwitch from "./ToggleSwitch";

const Foodorders = () => {
  const menu = [
    {
      name: "Kebab i Pita",
      img: "https://i1.vrs.gd/gladkokken/uploads/images/DSC_0442.jpg?width=1000&height=556&format=jpg&quality=80&crop=5159%2C2869%2C0%2C349",
      sizes: ["Liten", "Stor"],
      spice: ["Sterk", "Medium", "Mild"],
      extra: ["Ekstra dressing", "Pommes Frittes oppi", "Ekstra pita"],
      remove: ["Løk"],
      price: "100"
    },
    {
      name: "Kebab i Rull",
      img: "https://i1.vrs.gd/gladkokken/uploads/images/DSC_0442.jpg?width=1000&height=556&format=jpg&quality=80&crop=5159%2C2869%2C0%2C349",
      sizes: ["Liten", "Stor"],
      spice: ["Sterk", "Medium", "Mild"],
      extra: ["Ekstra dressing", "Pommes Frittes oppi", "Ekstra pita"],
      remove: ["Løk"],
      price: "100"
    },
    {
      name: "Döner i Pita",
      img: "https://i1.vrs.gd/gladkokken/uploads/images/DSC_0442.jpg?width=1000&height=556&format=jpg&quality=80&crop=5159%2C2869%2C0%2C349",
      sizes: ["Liten", "Stor"],
      spice: ["Sterk", "Medium", "Mild"],
      extra: ["Ekstra dressing", "Pommes Frittes oppi", "Ekstra pita"],
      remove: ["Løk"],
      price: "100"
    },
    {
      name: "Döner i Rull",
      img: "https://i1.vrs.gd/gladkokken/uploads/images/DSC_0442.jpg?width=1000&height=556&format=jpg&quality=80&crop=5159%2C2869%2C0%2C349",
      sizes: ["Liten", "Stor"],
      spice: ["Sterk", "Medium", "Mild"],
      extra: ["Ekstra dressing", "Pommes Frittes oppi", "Ekstra pita"],
      remove: ["Løk"],
      price: "100"
    },
    {
      name: "Kebab Tallerken",
      img: "https://i1.vrs.gd/gladkokken/uploads/images/DSC_0442.jpg?width=1000&height=556&format=jpg&quality=80&crop=5159%2C2869%2C0%2C349",
      spice: ["Sterk", "Medium", "Mild"],
      extra: ["Ekstra dressing", "Ekstra pita"],
      remove: ["Løk"],
      price: "100"
    },
    {
      name: "Döner Tallerken",
      img: "https://i1.vrs.gd/gladkokken/uploads/images/DSC_0442.jpg?width=1000&height=556&format=jpg&quality=80&crop=5159%2C2869%2C0%2C349",
      spice: ["Sterk", "Medium", "Mild"],
      extra: ["Ekstra dressing", "Ekstra pita"],
      remove: ["Løk"],
      price: "100"
    }
  ];

  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedFood, setSelectedFood] = useState<string | null>(null);
  const [orderOptions, setOrderOptions] = useState<any>({});

  const handleSelectFood = (foodName: string) => {
    const selected = menu.find((item) => item.name === foodName);
    const initialSize = selected?.sizes?.[0]; // usually "Liten"

    setSelectedFood(foodName);
    setOrderOptions({
      sizes: initialSize,
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
                <p>{food.price}NOK</p>
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
                          labels={[size1, size2]}/>
                      );
                    })()
                  ) : (
                    selectedItem[type].map((val: string) => (
                      <label key={val}>
                        <input
                          type={type === "spice" ? "radio" : "checkbox"}
                          name={type}
                          checked={
                            type === "spice"
                              ? orderOptions[type] === val
                              : orderOptions[type]?.includes(val)
                          }
                          onChange={() => handleChange(type, val, type === "spice")}
                        />
                        {val}
                      </label>
                    ))
                  )}
              </div>
            ) : null
          )}
        </div>
      )}

      <button
        className="confirm-btn"
        onClick={() => {
          console.log("Bestilling:", { item: selectedFood, options: orderOptions });
          alert("Bestilling sendt! Se konsollen for detaljer.");
        }}
        disabled={!selectedFood}
      >
        Bestill
      </button>
    </div>
  );
};

export default Foodorders;
