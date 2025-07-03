import Sticker from "./Sticker";
import { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  getDocs,
  setDoc,
  doc,
  deleteDoc
} from "firebase/firestore";

const LOCAL_STORAGE_KEY = "stickers";
const NOTES_MOVED_KEY = "notesMoved";

const Notes = ({ user }: { user: { id: string } }) => {
  type StickerData = {
    id: number;
    color: string;
    content: string;
  };

  const [stickers, setStickers] = useState<StickerData[]>([]);

  useEffect(() => {
    const loadStickers = async () => {
      const notesMoved = localStorage.getItem(NOTES_MOVED_KEY) === "true";

      let localStickers: StickerData[] = [];
      if (!notesMoved) {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              localStickers = parsed;
            }
          } catch (e) {
            console.error("Error parsing localStorage", e);
          }
        }
      }

      let dbStickers: StickerData[] = [];
      try {
        const snapshot = await getDocs(collection(db, "users", user.id, "notes"));
        dbStickers = snapshot.docs.map(doc => doc.data() as StickerData);
      } catch (e) {
        console.warn("No DB notes found or failed to fetch", e);
      }

      if (localStickers.length > 0 && !notesMoved) {
        await Promise.all(
          localStickers.map(note =>
            setDoc(doc(db, "users", user.id, "notes", note.id.toString()), note)
          )
        );
        localStorage.setItem(NOTES_MOVED_KEY, "true");
        setStickers([...dbStickers, ...localStickers]);
      } else {
        setStickers(dbStickers);
      }
    };

    loadStickers();
  }, [user]);

  const handleColorChange = async (id: number) => {
    const updated = stickers.map((s) => {
      if (s.id === id) {
        const newColor =
          s.color === "yellow" ? "blue" :
          s.color === "blue" ? "red" :
          s.color === "red" ? "green" :
          "yellow";
        return { ...s, color: newColor };
      } else {
        return s;
      }
    });
    setStickers(updated);
    await setDoc(doc(db, "users", user.id, "notes", id.toString()), updated.find(s => s.id === id)!);
  };

  const handleContentChange = async (id: number, newContent: string) => {
    const updated = stickers.map((s) =>
      s.id === id ? { ...s, content: newContent } : s
    );
    setStickers(updated);
    await setDoc(doc(db, "users", user.id, "notes", id.toString()), updated.find(s => s.id === id)!);
  };

  const deleteSticker = async (sticker: StickerData) => {
    const updatedStickers = stickers.filter((s) => s.id !== sticker.id);
    setStickers(updatedStickers);
    await deleteDoc(doc(db, "users", user.id, "notes", sticker.id.toString()));
  };

  const addSticker = async () => {
    const newSticker = { content: "...", color: "yellow", id: Date.now() };
    const updatedStickers = [...stickers, newSticker];
    setStickers(updatedStickers);
    await setDoc(doc(db, "users", user.id, "notes", newSticker.id.toString()), newSticker);
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
          <Sticker
            content={sticker.content}
            color={sticker.color}
            onDelete={() => deleteSticker(sticker)}
            onColorChange={() => handleColorChange(sticker.id)}
            onContentChange={(newContent) => handleContentChange(sticker.id, newContent)}
            id={sticker.id}
            key={sticker.id}
          />
        ))}
      </div>
    </div>
  );
};

export default Notes;
