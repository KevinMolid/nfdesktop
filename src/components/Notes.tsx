import Sticker from "./Sticker";
import { useState, useEffect } from "react";

const LOCAL_STORAGE_KEY = "stickers";

const Notes = () => {
    type StickerData = {
        id: number;
        color: string;
        content: string;
    }
    
  const [stickers, setStickers] = useState<StickerData[]>([]);

  // Load from localStorage once on mount
  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setStickers(parsed);
        }
      } catch (e) {
        console.error("Error parsing localStorage", e);
      }
    }
  }, []);

  {/* Handle order change */}

  {/* Handle color change */}
  const handleColorChange = (id: number) => {
    const updated = stickers.map((s) => {
        if (s.id === id){
            const newColor = 
            s.color === "yellow" ? "blue" :
            s.color === "blue" ? "red" :
            s.color === "red" ? "green" :
            "yellow";
            return { ...s, color: newColor}
        } else {
            return s
        }
    });
    setStickers(updated)
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  }

  {/* Handle Content change */}
    const handleContentChange = (id: number, newContent: string) => {
    const updated = stickers.map((s) =>
      s.id === id ? { ...s, content: newContent } : s
    );
    setStickers(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  };

  const deleteSticker = (sticker: StickerData) => {
    const updatedStickers = stickers.filter((s) => s.id !== sticker.id);
    setStickers(updatedStickers);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedStickers));
  }

const addSticker = () => {
    const updatedStickers = [...stickers, {content: "...", color: "yellow", id:Date.now()}];
    setStickers(updatedStickers);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedStickers));
    };

  return (
    <div className="card has-header grow-1">
      <div className="card-header">
        <h3 className="card-title">Notater</h3>
        <i
          className="fa-solid fa-plus blue icon-md hover"
          onClick={addSticker}
        ></i>
      </div>
      <div className="stickerboard">
        {stickers.map((sticker) => (
          <Sticker content={sticker.content} 
            color={sticker.color}
            onDelete={() => deleteSticker(sticker)}
            onColorChange={() => handleColorChange(sticker.id)} 
            onContentChange={(newContent) => handleContentChange(sticker.id, newContent)}
            id={sticker.id} key={sticker.id} />
        ))}
      </div>
    </div>
  );
};

export default Notes;
