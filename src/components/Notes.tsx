import { useRef } from "react";
import { onSnapshot } from "firebase/firestore";

import { StickerData } from "../types";
import { isValidSticker } from "../utils/validators";

import DragableSticker from "./DragableSticker";
import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, setDoc, doc, deleteDoc } from "firebase/firestore";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { DragEndEvent } from "@dnd-kit/core";

const cellSize = 252; // px

type NotesProps = {
  user: {
    id: string;
    username: string;
    name?: string;
    role: string;
  };
  toggleActive: (name: string) => void;
};

const Notes = ({ user, toggleActive }: NotesProps) => {
  const [stickers, setStickers] = useState<StickerData[]>([]);
  const [maxCols, setMaxCols] = useState(3); // default
  const [isMobileView, setIsMobileView] = useState(false);

  const boardRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 1350);
    };

    handleResize(); // initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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
    const unsubscribe = onSnapshot(
      collection(db, "users", user.id, "notes"),
      async (snapshot) => {
        let dbStickers: StickerData[] = snapshot.docs
          .map((doc) => doc.data())
          .filter(isValidSticker);

        const stickersWithPlacement: StickerData[] = [];

        for (const sticker of dbStickers) {
          if (sticker.row !== undefined && sticker.col !== undefined) {
            stickersWithPlacement.push(sticker);
          } else {
            const width = sticker.width ?? 1;
            const height = sticker.height ?? 1;

            let placed = false;
            for (let row = 0; !placed && row < 1000; row++) {
              for (let col = 0; col < maxCols; col++) {
                if (col + width > maxCols) continue;
                if (
                  isGridSpaceFree(
                    row,
                    col,
                    width,
                    height,
                    stickersWithPlacement
                  )
                ) {
                  sticker.row = row;
                  sticker.col = col;
                  stickersWithPlacement.push(sticker);
                  await setDoc(
                    doc(db, "users", user.id, "notes", sticker.id.toString()),
                    sticker
                  );
                  placed = true;
                  break;
                }
              }
            }
          }
        }

        setStickers(stickersWithPlacement);
      }
    );

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
          if (i >= r && i < r + h && j >= c && j < c + w) {
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
          s.color === "yellow"
            ? "blue"
            : s.color === "blue"
            ? "red"
            : s.color === "red"
            ? "green"
            : "yellow";
        return { ...s, color: newColor };
      } else {
        return s;
      }
    });
    setStickers(updated);
    await setDoc(
      doc(db, "users", user.id, "notes", id.toString()),
      updated.find((s) => s.id === id)!
    );
  };

  const handleContentChange = async (id: number, newContent: string) => {
    const updated = stickers.map((s) =>
      s.id === id ? { ...s, content: newContent } : s
    );
    setStickers(updated);
    await setDoc(
      doc(db, "users", user.id, "notes", id.toString()),
      updated.find((s) => s.id === id)!
    );
  };

  const handleResize = async (
    id: number,
    newWidth: number,
    newHeight: number
  ) => {
    const updated = stickers.map((s) =>
      s.id === id ? { ...s, width: newWidth, height: newHeight } : s
    );
    setStickers(updated);
    await setDoc(
      doc(db, "users", user.id, "notes", id.toString()),
      updated.find((s) => s.id === id)!
    );
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, delta } = event;
    const id = Number(active.id);

    const sticker = stickers.find((s) => s.id === id);
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
    const isOccupied = stickers.some((s) => {
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
    const updated = stickers.map((s) =>
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
    const preview =
      sticker.content.slice(0, 15) + (sticker.content.length > 15 ? "..." : "");
    const confirmed = window.confirm(
      `Are you sure you want to delete note "${preview}"?`
    );

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
    await setDoc(
      doc(db, "users", user.id, "notes", newSticker.id.toString()),
      newSticker
    );
  };

  // Sorting stickers for mobile
  const sortedStickers = [...stickers].sort((a, b) => {
    const ra = a.row ?? 0;
    const rb = b.row ?? 0;
    const ca = a.col ?? 0;
    const cb = b.col ?? 0;
    return ra !== rb ? ra - rb : ca - cb;
  });

  // Calculate max row occupied by any sticker
  const boardHeight = isMobileView
    ? sortedStickers.reduce((sum, s) => sum + (s.height ?? 1), 0) * cellSize
    : (stickers.reduce((max, s) => {
        const row = (s.row ?? 0) + (s.height ?? 1);
        return Math.max(max, row);
      }, 0) +
        1) *
      cellSize;

  return (
    <div className="card has-header full-width">
      <div className="card-header">
        <h3 className="card-title">Notes</h3>
        <div className="card-header-right">
          <button onClick={addSticker}>
            <i className="fa-solid fa-plus blue icon-md hover"></i>
            <p>New Note</p>
          </button>
          <button
            className="close-widget-btn"
            onClick={() => toggleActive("Notes")}
          >
            <i className="fa-solid fa-x icon-md hover" />
          </button>
        </div>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="stickerboard" style={{ height: boardHeight }}>
          {(isMobileView
            ? (() => {
                let nextRow = 0;
                return sortedStickers.map((sticker) => {
                  const adjusted = {
                    ...sticker,
                    row: nextRow,
                  };
                  nextRow += sticker.height ?? 1;
                  return adjusted;
                });
              })()
            : stickers
          ).map((sticker) => (
            <DragableSticker
              key={sticker.id}
              id={sticker.id}
              content={sticker.content}
              color={sticker.color}
              onDelete={() => deleteSticker(sticker)}
              onColorChange={() => handleColorChange(sticker.id)}
              onContentChange={(newContent) =>
                handleContentChange(sticker.id, newContent)
              }
              onResize={(w, h) => handleResize(sticker.id, w, h)}
              width={sticker.width || 1}
              height={sticker.height || 1}
              row={sticker.row ?? 0}
              col={isMobileView ? 0 : sticker.col ?? 0}
              disableDrag={isMobileView}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
};

export default Notes;
