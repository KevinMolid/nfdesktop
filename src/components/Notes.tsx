import { useEffect, useRef, useState } from "react";
import {
  collection,
  doc,
  deleteDoc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";

import { db } from "./firebase";
import DragableSticker from "./DragableSticker";
import { StickerData } from "../types";
import { isValidSticker } from "../utils/validators";

const cellSize = 252; // px

type StickerWithSource = Omit<StickerData, "color"> & {
  color: StickerColor;
  source: "personal" | "shared";
  placements?: Record<string, { row: number; col: number }>;
  createdBy?: string;
  createdByName?: string;
};

type NotesProps = {
  user: {
    id: string;
    username: string;
    name?: string;
    role: string;
  };
  toggleActive: (name: string) => void;
};

type StickerColor = "default" | "yellow" | "blue" | "red" | "green";

const Notes = ({ user, toggleActive }: NotesProps) => {
  const [stickers, setStickers] = useState<StickerWithSource[]>([]);
  const [maxCols, setMaxCols] = useState(3);
  const [isMobileView, setIsMobileView] = useState(false);

  const boardRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 1350);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (!boardRef.current) return;
      const boardWidth = boardRef.current.offsetWidth;
      const newMaxCols = Math.max(1, Math.floor(boardWidth / cellSize));
      setMaxCols(newMaxCols);
      setIsMobileView(newMaxCols <= 1);
    });

    if (boardRef.current) observer.observe(boardRef.current);
    return () => observer.disconnect();
  }, []);

  // Live notes listeners
  useEffect(() => {
    const personalRef = collection(db, "users", user.id, "notes");
    const sharedRef = collection(db, "notes");

    const unsubPersonal = onSnapshot(personalRef, (snapshot) => {
      const personal = snapshot.docs.map((d) => d.data()).filter(isValidSticker);
      setStickers((prev) => mergeStickers(prev, personal, "personal"));
    });

    const unsubShared = onSnapshot(sharedRef, (snapshot) => {
      const shared = snapshot.docs.map((d) => d.data()).filter(isValidSticker);
      setStickers((prev) => mergeStickers(prev, shared, "shared"));
    });

    return () => {
      unsubPersonal();
      unsubShared();
    };
  }, [user.id]);

  // Ensure shared notes get a per-user placement
  useEffect(() => {
    const needsPlacement = stickers.filter(
      (s) => s.source === "shared" && !(s.placements && s.placements[user.id])
    );
    if (needsPlacement.length === 0) return;

    // Work only with placed stickers to avoid (0,0) conflicts
    let working = stickers.filter((s) => s.row !== undefined && s.col !== undefined);

    (async () => {
      for (const s of needsPlacement) {
        const { row, col } = findFreePlacement(s.width ?? 1, s.height ?? 1, working, maxCols);
        working = [...working, { ...s, row, col }];

        // Optimistic
        setStickers((prev) => prev.map((x) => (x.id === s.id ? { ...x, row, col } : x)));

        // Persist per-user placement
        await setDoc(
          doc(db, "notes", s.id.toString()),
          {
            placements: {
              ...(s.placements || {}),
              [user.id]: { row, col },
            },
          },
          { merge: true }
        );
      }
    })();
  }, [stickers, user.id, maxCols]);

  // 2) Helper to coerce Firestore strings into the union
  const toStickerColor = (c: unknown): StickerColor => {
    const allowed = ["default", "yellow", "blue", "red", "green"] as const;
    return (allowed as readonly string[]).includes(String(c)) ? (c as StickerColor) : "default";
  };

  function mergeStickers(
    prev: StickerWithSource[],
    incoming: StickerData[],
    source: "personal" | "shared"
  ): StickerWithSource[] {
    const tagged = incoming.map((s: any) => {
      const base = {
        ...s,
        color: toStickerColor(s.color),      // ← normalize here
        source,
      };
      if (source === "shared") {
        const placement = s.placements?.[user.id];
        return placement ? { ...base, row: placement.row, col: placement.col } : base;
      }
      return base;
    });

    const keep = prev.filter((s) => s.source !== source);
    const byId = new Map<number, StickerWithSource>();
    for (const s of tagged) byId.set(s.id, s);
    return [...keep, ...byId.values()];
  }

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
          if (i >= r && i < r + h && j >= c && j < c + w) return false;
        }
      }
    }
    return true;
  };

  function findFreePlacement(
    width: number,
    height: number,
    existing: { row?: number; col?: number; width?: number; height?: number }[],
    maxColsLocal: number
  ): { row: number; col: number } {
    const w = width || 1;
    const h = height || 1;

    const isFree = (r: number, c: number) => {
      for (const s of existing) {
        if (s.row === undefined || s.col === undefined) continue;
        const sr = s.row;
        const sc = s.col;
        const sw = s.width ?? 1;
        const sh = s.height ?? 1;
        if (r < sr + sh && r + h > sr && c < sc + sw && c + w > sc) return false;
      }
      return true;
    };

    for (let row = 0; row < 1000; row++) {
      for (let col = 0; col < maxColsLocal; col++) {
        if (col + w > maxColsLocal) continue;
        if (isFree(row, col)) return { row, col };
      }
    }
    return { row: 0, col: 0 };
  }

  const handleSetColor = async (id: number, newColor: StickerColor) => {
    setStickers((prev) => prev.map((s) => (s.id === id ? { ...s, color: newColor } : s)));

    const sticker = stickers.find((s) => s.id === id);
    if (!sticker) return;

    if (sticker.source === "personal") {
      await setDoc(
        doc(db, "users", user.id, "notes", id.toString()),
        { ...sticker, color: newColor },
        { merge: true }
      );
    } else {
      await setDoc(
        doc(db, "notes", id.toString()),
        { ...sticker, color: newColor },
        { merge: true }
      );
    }
  };

  const saveSticker = async (sticker: StickerWithSource, userId: string) => {
    try {
      if (sticker.source === "personal") {
        const ref = doc(db, "users", userId, "notes", sticker.id.toString());
        await setDoc(ref, sticker, { merge: true });
      } else {
        const ref = doc(db, "notes", sticker.id.toString());
        await setDoc(ref, sticker, { merge: true });
      }
    } catch (err) {
      console.error("Error saving sticker:", err);
    }
  };

  const handleContentChange = async (id: number, newContent: string) => {
    setStickers((prev) => prev.map((s) => (s.id === id ? { ...s, content: newContent } : s)));
    const sticker = stickers.find((s) => s.id === id);
    if (sticker) await saveSticker({ ...sticker, content: newContent }, user.id);
  };

  const handleResize = async (id: number, newWidth: number, newHeight: number) => {
    const sticker = stickers.find((s) => s.id === id);
    if (!sticker) return;

    setStickers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, width: newWidth, height: newHeight } : s))
    );

    if (sticker.source === "personal") {
      await setDoc(doc(db, "users", user.id, "notes", id.toString()), {
        ...sticker,
        width: newWidth,
        height: newHeight,
      });
    } else {
      await setDoc(
        doc(db, "notes", id.toString()),
        { ...sticker, width: newWidth, height: newHeight },
        { merge: true }
      );
    }
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

    if (newCol < 0 || newRow < 0) return;

    const isOccupied = stickers.some((s) => {
      if (s.id === id) return false;
      const sw = s.width ?? 1;
      const sh = s.height ?? 1;
      const sr = s.row ?? 0;
      const sc = s.col ?? 0;
      return newRow < sr + sh && newRow + height > sr && newCol < sc + sw && newCol + width > sc;
    });
    if (isOccupied) return;

    setStickers((prev) => prev.map((s) => (s.id === id ? { ...s, row: newRow, col: newCol } : s)));

    if (sticker.source === "personal") {
      await setDoc(doc(db, "users", user.id, "notes", id.toString()), {
        ...sticker,
        row: newRow,
        col: newCol,
      });
    } else {
      await setDoc(
        doc(db, "notes", id.toString()),
        {
          ...sticker,
          placements: {
            ...(sticker.placements || {}),
            [user.id]: { row: newRow, col: newCol },
          },
        },
        { merge: true }
      );
    }
  };

  const deleteSticker = async (sticker: StickerWithSource) => {
    const preview = sticker.content.slice(0, 15) + (sticker.content.length > 15 ? "..." : "");
    const confirmed = window.confirm(`Are you sure you want to delete note "${preview}"?`);
    if (!confirmed) return;

    setStickers((prev) => prev.filter((s) => s.id !== sticker.id));

    try {
      if (sticker.source === "personal") {
        await deleteDoc(doc(db, "users", user.id, "notes", sticker.id.toString()));
      } else {
        const sharedRef = doc(db, "notes", sticker.id.toString());
        if (sticker.createdBy === user.id) {
          await deleteDoc(sharedRef);
        } else {
          const { placements = {} } = sticker;
          const updatedPlacements = { ...placements };
          delete updatedPlacements[user.id];

          if (Object.keys(updatedPlacements).length === 0) {
            await deleteDoc(sharedRef);
          } else {
            await setDoc(sharedRef, { placements: updatedPlacements }, { merge: true });
          }
        }
      }
    } catch (err) {
      console.error("Error deleting sticker:", err);
    }
  };

  const addSticker = async () => {
    const newSticker: StickerWithSource = {
      content: "...",
      color: "default",
      id: Date.now(),
      index: stickers.length,
      width: 1,
      height: 1,
      source: "personal",
    };

    const width = newSticker.width ?? 1;
    const height = newSticker.height ?? 1;

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

    setStickers((prev) => [...prev, newSticker]);
    await setDoc(doc(db, "users", user.id, "notes", newSticker.id.toString()), newSticker);
  };

  const sortedStickers = [...stickers].sort((a, b) => {
    const ra = a.row ?? 0;
    const rb = b.row ?? 0;
    const ca = a.col ?? 0;
    const cb = b.col ?? 0;
    return ra !== rb ? ra - rb : ca - cb;
  });

  const boardHeight = isMobileView
    ? sortedStickers.reduce((sum, s) => sum + (s.height ?? 1), 0) * cellSize
    : (stickers.reduce((max, s) => {
        const row = (s.row ?? 0) + (s.height ?? 1);
        return Math.max(max, row);
      }, 0) + 1) * cellSize;

  return (
    <div className="card has-header full-width">
      <div className="card-header">
        <h3 className="card-title">Noticeboard</h3>
        <div className="card-header-right">
          <button onClick={addSticker}>
            <i className="fa-solid fa-plus grey icon-md hover" />
            Add
          </button>
          <button className="close-widget-btn" onClick={() => toggleActive("Notes")}>
            <i className="fa-solid fa-x icon-md hover" />
          </button>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="stickerboard" ref={boardRef} style={{ height: boardHeight }}>
          {(isMobileView
            ? (() => {
                let nextRow = 0;
                return sortedStickers.map((sticker) => {
                  const adjusted = { ...sticker, row: nextRow };
                  nextRow += sticker.height ?? 1;
                  return adjusted;
                });
              })()
            : stickers
          ).map((sticker) => {
            const canEditShared =
              !(sticker.source === "shared") || sticker.createdBy === user.id;

            return (
              <DragableSticker
                user={user}
                key={`${sticker.source}-${sticker.id}`}
                id={sticker.id}
                content={sticker.content}
                color={sticker.color}
                onDelete={() => deleteSticker(sticker)}
                onColorChange={(color) => handleSetColor(sticker.id, color as StickerColor)}
                onContentChange={(newContent) => handleContentChange(sticker.id, newContent)}
                onResize={(w, h) => handleResize(sticker.id, w, h)}
                width={sticker.width || 1}
                height={sticker.height || 1}
                row={sticker.row ?? 0}
                col={isMobileView ? 0 : sticker.col ?? 0}
                disableDrag={isMobileView}
                db={db}
                setStickers={setStickers}
                isShared={sticker.source === "shared"}
                createdBy={sticker.createdBy}
                createdByName={sticker.createdByName}
                canEditContent={canEditShared}
                canResize={canEditShared}
                canChangeColor={canEditShared}
              />
            );
          })}
        </div>
      </DndContext>
    </div>
  );
};

export default Notes;
