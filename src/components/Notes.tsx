import { useRef } from "react";
import { onSnapshot } from "firebase/firestore";

import DragableSticker from "./DragableSticker";
import { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  setDoc,
  doc,
  deleteDoc
} from "firebase/firestore";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { DragEndEvent } from "@dnd-kit/core";

const LOCAL_STORAGE_KEY = "stickers";
const NOTES_MOVED_KEY = "notesMoved";

const cellSize = 252; // px

const Notes = ({ user }: { user: { id: string } }) => {
  type StickerData = {
    id: number;
    color: string;
    content: string;
    width?: number;
    height?: number;
    index: number;
    col?: number;
    row?: number;
  };

  const [stickers, setStickers] = useState<StickerData[]>([]);
  const [maxCols, setMaxCols] = useState(3); // default
  const [isMobileView, setIsMobileView] = useState(false);

  const boardRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    if (boardRef.current) {
      const boardWidth = boardRef.current.offsetWidth;
      const newMaxCols = Math.max(1, Math.floor(boardWidth / cellSize));
      setMaxCols(newMaxCols);
      setIsMobileView(newMaxCols <= 1); // 💡 treat 1 column or less as mobile layout
    }
  }, []);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (boardRef.current) {
        const boardWidth = boardRef.current.offsetWidth;
        const newMaxCols = Math.max(1, Math.floor(boardWidth / cellSize));
        setMaxCols(newMaxCols);
        setIsMobileView(newMaxCols <= 1); // update on resize too
      }
    });

    if (boardRef.current) {
      observer.observe(boardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users", user.id, "notes"), async (snapshot) => {
      const notesMoved = localStorage.getItem(NOTES_MOVED_KEY) === "true";

      let localStickers: StickerData[] = [];
      if (!notesMoved) {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              localStickers = parsed.map((s, i) => ({ ...s, index: i }));
            }
          } catch (e) {
            console.error("Error parsing localStorage", e);
          }
        }
      }

      let dbStickers: StickerData[] = snapshot.docs.map((doc) => doc.data() as StickerData);
      const combinedStickers = [...dbStickers, ...localStickers];

      const stickersWithPlacement: StickerData[] = [];

      for (const sticker of combinedStickers) {
        if (sticker.row !== undefined && sticker.col !== undefined) {
          stickersWithPlacement.push(sticker);
        } else {
          const width = sticker.width ?? 1;
          const height = sticker.height ?? 1;

          let placed = false;
          for (let row = 0; !placed && row < 1000; row++) {
            for (let col = 0; col < maxCols; col++) {
              if (col + width > maxCols) continue;
              if (isGridSpaceFree(row, col, width, height, stickersWithPlacement)) {
                sticker.row = row;
                sticker.col = col;
                stickersWithPlacement.push(sticker);
                placed = true;
                await setDoc(doc(db, "users", user.id, "notes", sticker.id.toString()), sticker);
                break;
              }
            }
          }
          if (!placed) {
            console.warn("Couldn't place sticker", sticker);
          }
        }
      }

      setStickers(stickersWithPlacement);

      if (localStickers.length > 0 && !notesMoved) {
        localStorage.setItem(NOTES_MOVED_KEY, "true");
      }
    });

    return () => unsubscribe();
  }, [user.id, maxCols]);


  const isGridSpaceFree = (
    row: number,
    col: number,
    width: number,
    height: number,
    placed: StickerData[]
  ): boolean => {
    for (const other of placed) {
      const r = other.row ?? -1;
      const c = other.col ?? -1;
      const w = other.width ?? 1;
      const h = other.height ?? 1;

      for (let i = row; i < row + height; i++) {
        for (let j = col; j < col + width; j++) {
          if (
            i >= r &&
            i < r + h &&
            j >= c &&
            j < c + w
          ) {
            return false;
          }
        }
      }
    }
    return true;
  };


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

  const handleResize = async (id: number, newWidth: number, newHeight: number) => {
    const updated = stickers.map((s) =>
      s.id === id ? { ...s, width: newWidth, height: newHeight } : s
    );
    setStickers(updated);
    await setDoc(doc(db, "users", user.id, "notes", id.toString()), updated.find(s => s.id === id)!);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, delta } = event;
    const id = Number(active.id);

    const sticker = stickers.find(s => s.id === id);
    if (!sticker) return;

    const width = sticker.width || 1;
    const height = sticker.height || 1;

    const currentCol = sticker.col ?? 0;
    const currentRow = sticker.row ?? 0;

    const newCol = Math.round((currentCol * cellSize + delta.x) / cellSize);
    const newRow = Math.round((currentRow * cellSize + delta.y) / cellSize);

    // Don't allow negative positions
    if (newCol < 0 || newRow < 0) return;

    // Check for space availability
    const isOccupied = stickers.some(s => {
      if (s.id === id) return false;

      const sw = s.width ?? 1;
      const sh = s.height ?? 1;
      const sr = s.row ?? 0;
      const sc = s.col ?? 0;

      return (
        newRow < sr + sh &&
        newRow + height > sr &&
        newCol < sc + sw &&
        newCol + width > sc
      );
    });

    if (isOccupied) return;

    // Save new position
    const updated = stickers.map(s =>
      s.id === id ? { ...s, row: newRow, col: newCol } : s
    );

    setStickers(updated);

    await setDoc(doc(db, "users", user.id, "notes", id.toString()), {
      ...sticker,
      row: newRow,
      col: newCol,
    });
  };

  const deleteSticker = async (sticker: StickerData) => {
    const preview = sticker.content.slice(0, 15) + (sticker.content.length > 15 ? "..." : "");
    const confirmed = window.confirm(`Are you sure you want to delete note "${preview}"?`);

    if (!confirmed) return;

    const updatedStickers = stickers
      .filter((s) => s.id !== sticker.id)
      .map((s, i) => ({ ...s, index: i }));

    setStickers(updatedStickers);
    await deleteDoc(doc(db, "users", user.id, "notes", sticker.id.toString()));
  };

  const addSticker = async () => {
    const newSticker: StickerData = {
      content: "...",
      color: "yellow",
      id: Date.now(),
      index: stickers.length,
      width: 1,
      height: 1,
    };

    const width = newSticker.width!;
    const height = newSticker.height!;

    // Reuse placement logic to find free space
    let placed = false;
    let row = 0;
    let col = 0;

    for (row = 0; !placed && row < 1000; row++) {
      for (col = 0; col < maxCols; col++) {
        if (col + width > maxCols) continue;
        if (isGridSpaceFree(row, col, width, height, stickers)) {
          newSticker.row = row;
          newSticker.col = col;
          placed = true;
          break;
        }
      }
    }

    if (!placed) {
      console.warn("Couldn't place new sticker");
      return;
    }

    const updatedStickers = [...stickers, newSticker];
    setStickers(updatedStickers);
    await setDoc(doc(db, "users", user.id, "notes", newSticker.id.toString()), newSticker);
  };


  // Calculate max row occupied by any sticker
  const maxRow = stickers.reduce((max, s) => {
    const row = (s.row ?? 0) + (s.height ?? 1);
    return Math.max(max, row);
  }, 0);

  const boardHeight = (maxRow + 1) * cellSize; // +1 for extra row

  return (
    <div className="card has-header full-width">
      <div className="card-header">
        <h3 className="card-title">Notater</h3>
        <i
          className="fa-solid fa-plus blue icon-md hover"
          onClick={addSticker}
        ></i>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="stickerboard" style={{ height: boardHeight }}>
          {stickers.map((sticker) => (
            <DragableSticker
              key={sticker.id}
              id={sticker.id}
              content={sticker.content}
              color={sticker.color}
              onDelete={() => deleteSticker(sticker)}
              onColorChange={() => handleColorChange(sticker.id)}
              onContentChange={(newContent) => handleContentChange(sticker.id, newContent)}
              onResize={(w, h) => handleResize(sticker.id, w, h)}
              width={sticker.width || 1}
              height={sticker.height || 1}
              row={sticker.row ?? 0}
              col={sticker.col ?? 0}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
};

export default Notes;
