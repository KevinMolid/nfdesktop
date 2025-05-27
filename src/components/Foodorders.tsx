import { useState } from "react";

const Foodorders = () => {
  const menu = [
    {
      name: "Kebab i Pita",
      sizes: ["Liten", "Stor"],
      spice: ["Sterk", "Medium", "Mild"],
      extra: ["Ekstra dressing", "Pommes Frittes oppi", "Ekstra pita"],
      remove: ["Løk"]
    },
    {
      name: "Kebab i Rull",
      sizes: ["Liten", "Stor"],
      spice: ["Sterk", "Medium", "Mild"],
      extra: ["Ekstra dressing", "Pommes Frittes oppi", "Ekstra pita"],
      remove: ["Løk"]
    },
    {
      name: "Döner i Pita",
      sizes: ["Liten", "Stor"],
      spice: ["Sterk", "Medium", "Mild"],
      extra: ["Ekstra dressing", "Pommes Frittes oppi", "Ekstra pita"],
      remove: ["Løk"]
    },
    {
      name: "Döner i Rull",
      sizes: ["Liten", "Stor"],
      spice: ["Sterk", "Medium", "Mild"],
      extra: ["Ekstra dressing", "Pommes Frittes oppi", "Ekstra pita"],
      remove: ["Løk"]
    },
    {
      name: "Kebab Tallerken",
      spice: ["Sterk", "Medium", "Mild"],
      extra: ["Ekstra dressing", "Ekstra pita"],
      remove: ["Løk"]
    },
    {
      name: "Döner Tallerken",
      spice: ["Sterk", "Medium", "Mild"],
      extra: ["Ekstra dressing", "Ekstra pita"],
      remove: ["Løk"]
    }
  ];

  const [selectedFood, setSelectedFood] = useState<string | null>(null);
  const [orderOptions, setOrderOptions] = useState<any>({});

  const handleSelectFood = (foodName: string) => {
    setSelectedFood(foodName);
    setOrderOptions({}); // Reset options when switching
  };

  const handleChange = (type: string, value: string, isRadio = false) => {
    setOrderOptions((prev: any) => {
      if (isRadio) {
        return { ...prev, [type]: value };
      } else {
        const currentSet = new Set(prev[type] || []);
        if (currentSet.has(value)) {
          currentSet.delete(value);
        } else {
          currentSet.add(value);
        }
        return { ...prev, [type]: Array.from(currentSet) };
      }
    });
  };

  const selectedItem = menu.find((item) => item.name === selectedFood);

  return (
    <div className="card has-header grow-1">
      <div className="card-header">
        <h3 className="card-title">Bestille Kebab</h3>
      </div>

      <div className="card-body">
        <label>
          <select
            value={selectedFood || ""}
            onChange={(e) => handleSelectFood(e.target.value)}
            style={{ display: "block", margin: "1rem 0", padding: "0.5rem" }}
          >
            <option value="">-- Velg matrett --</option>
            {menu.map((food) => (
              <option key={food.name} value={food.name}>
                {food.name}
              </option>
            ))}
          </select>
        </label>

        {selectedItem && (
          <div className="food-options">
            {selectedItem.sizes && (
              <div>
                <h4>Størrelse:</h4>
                <div className="inputs">
                    {selectedItem.sizes.map((size) => (
                    <label key={size} style={{ display: "block" }}>
                        <input
                        type="radio"
                        name="size"
                        checked={orderOptions.sizes === size}
                        onChange={() => handleChange("sizes", size, true)}
                        />
                        {size}
                    </label>
                    ))}
                </div>
              </div>
            )}

            {selectedItem.spice && (
              <div>
                <h4>Styrke:</h4>
                <div className="inputs">
                    {selectedItem.spice.map((level) => (
                    <label key={level} style={{ display: "block" }}>
                        <input
                        type="radio"
                        name="spice"
                        checked={orderOptions.spice === level}
                        onChange={() => handleChange("spice", level, true)}
                        />
                        {level}
                    </label>
                    ))}
                </div>
              </div>
            )}

            {selectedItem.extra && (
            <div>
                <h4>Ekstra:</h4>
                {selectedItem.extra.map((extra) => (
                <label key={extra} style={{ display: "block" }}>
                    <input
                    type="checkbox"
                    checked={orderOptions.extra?.includes(extra) || false}
                    onChange={() => handleChange("extra", extra)}
                    />
                    {extra}
                </label>
                ))}
            </div>
            )}

            {selectedItem.remove && (
            <div>
                <h4>Uten:</h4>
                {selectedItem.remove.map((item) => (
                <label key={item} style={{ display: "block" }}>
                    <input
                    type="checkbox"
                    checked={orderOptions.remove?.includes(item) || false}
                    onChange={() => handleChange("remove", item)}
                    />
                    {item}
                </label>
                ))}
            </div>
            )}

            <button className="add-food-btn">Legg til</button>
          </div>
        )}
      </div>

      <button
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
