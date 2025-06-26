import Sticker from "./Sticker";
import { useState, useEffect } from "react";
import { collection, getDocs, setDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";

type NotesProps = {
  userId: string; // pass in logged-in user's ID
};

type StickerData = {
  id: number;
  color: string;
  content: string;
};

const Notes = ({ userId }: NotesProps) => {
  const [stickers, setStickers] = useState<StickerData[]>([]);

  // 🔁 Load from Firestore (and migrate from localStorage if needed)
  useEffect(() => {
    const loadStickers = async () => {
      const notesRef = collection(db, "users", userId, "notes");
      const snapshot = await getDocs(notesRef);

      // Notes from Firestore
      const firestoreNotes: StickerData[] = snapshot.docs.map((doc) => doc.data() as StickerData);
      const firestoreIds = new Set(firestoreNotes.map(note => note.id));

      // Notes from localStorage
      const stored = localStorage.getItem("stickers");
      let localNotes: StickerData[] = [];
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            localNotes = parsed.filter(note => !firestoreIds.has(note.id)); // avoid duplicates
          }
        } catch (e) {
          console.error("Feil ved parsing av localStorage", e);
        }
      }

      // If there are local notes not in Firestore, upload them
      if (localNotes.length > 0) {
        for (const note of localNotes) {
          await setDoc(doc(db, "users", userId, "notes", note.id.toString()), note);
        }
        localStorage.removeItem("stickers"); // Clean up after migration
      }

      // Merge and set state
      setStickers([...firestoreNotes, ...localNotes]);
    };


    loadStickers();
  }, [userId]);

  // 🔄 Update a note in Firestore
  const updateNote = async (updated: StickerData[]) => {
    setStickers(updated);
    await Promise.all(
      updated.map((s) =>
        setDoc(doc(db, "users", userId, "notes", s.id.toString()), s)
      )
    );
  };

  const handleColorChange = (id: number) => {
    const updated = stickers.map((s) =>
      s.id === id
        ? {
            ...s,
            color:
              s.color === "yellow"
                ? "blue"
                : s.color === "blue"
                ? "red"
                : s.color === "red"
                ? "green"
                : "yellow",
          }
        : s
    );
    updateNote(updated);
  };

  const handleContentChange = (id: number, newContent: string) => {
    const updated = stickers.map((s) =>
      s.id === id ? { ...s, content: newContent } : s
    );
    updateNote(updated);
  };

  const deleteSticker = async (sticker: StickerData) => {
    const updated = stickers.filter((s) => s.id !== sticker.id);
    setStickers(updated);
    await deleteDoc(doc(db, "users", userId, "notes", sticker.id.toString()));
  };

  const addSticker = async () => {
    const newSticker = { id: Date.now(), color: "yellow", content: "..." };
    const updated = [...stickers, newSticker];
    setStickers(updated);
    await setDoc(doc(db, "users", userId, "notes", newSticker.id.toString()), newSticker);
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
            key={sticker.id}
            id={sticker.id}
            content={sticker.content}
            color={sticker.color}
            onDelete={() => deleteSticker(sticker)}
            onColorChange={() => handleColorChange(sticker.id)}
            onContentChange={(newContent) =>
              handleContentChange(sticker.id, newContent)
            }
          />
        ))}
      </div>
    </div>
  );
};

export default Notes;
