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

type StickerWithSource = StickerData & {
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

const Notes = ({ user, toggleActive }: NotesProps) => {
  const [stickers, setStickers] = useState<StickerWithSource[]>([]);
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
    const personalRef = collection(db, "users", user.id, "notes");
    const sharedRef = collection(db, "notes");

    const unsubPersonal = onSnapshot(personalRef, (snapshot) => {
      const personal = snapshot.docs
        .map((doc) => doc.data())
        .filter(isValidSticker);
      setStickers((prev) => mergeStickers(prev, personal, "personal"));
    });

    const unsubShared = onSnapshot(sharedRef, (snapshot) => {
      const shared = snapshot.docs
        .map((doc) => doc.data())
        .filter(isValidSticker);
      setStickers((prev) => mergeStickers(prev, shared, "shared"));
    });

    return () => {
      unsubPersonal();
      unsubShared();
    };
  }, [user.id, maxCols]);

  useEffect(() => {
    // collect shared stickers that lack a placement for this user
    const needsPlacement = stickers.filter(
      (s: any) =>
        s.source === "shared" &&
        (!s.placements || !s.placements[user.id]) // no per-user placement yet
    );

    if (needsPlacement.length === 0) return;

    // Work with a local copy to compute free slots against what's currently on the board
    let working = [...stickers];

    (async () => {
      for (const s of needsPlacement) {
        const { row, col } = findFreePlacement(
          s.width ?? 1,
          s.height ?? 1,
          working,
          maxCols
        );

        // update local working list so the next placement respects this one
        working = working.map((x) =>
          x.id === s.id ? { ...x, row, col } : x
        );

        // optimistic UI: update state immediately
        setStickers((prev) =>
          prev.map((x) => (x.id === s.id ? { ...x, row, col } : x))
        );

        // persist placement for this user in the shared doc
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

  function mergeStickers(
    prev: StickerWithSource[],
    incoming: StickerData[],
    source: "personal" | "shared"
  ): StickerWithSource[] {
    const tagged = incoming.map((s: any) => {
      if (source === "shared" && s.placements) {
        const placement = s.placements[user.id];
        return {
          ...s,
          row: placement?.row ?? 0,
          col: placement?.col ?? 0,
          source,
        };
      }
      return { ...s, source };
    });

    // replace everything from this source in one go
    const keep = prev.filter((s) => s.source !== source);

    // also dedupe within the new batch by id
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
          if (i >= r && i < r + h && j >= c && j < c + w) {
            return false;
          }
        }
      }
    }
    return true;
  };

  // helper: find the first free spot that fits (width x height)
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
        const sr = s.row ?? 0;
        const sc = s.col ?? 0;
        const sw = s.width ?? 1;
        const sh = s.height ?? 1;
        // overlap?
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
    // fallback
    return { row: 0, col: 0 };
  }

  const handleColorChange = async (id: number) => {
    // compute new color locally
    let nextColor: string | null = null;

    setStickers((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const newColor =
          s.color === "default"
            ? "yellow"
            : s.color === "yellow"
            ? "blue"
            : s.color === "blue"
            ? "red"
            : s.color === "red"
            ? "green"
            : "default";
        nextColor = newColor;
        return { ...s, color: newColor };
      })
    );

    // find sticker & persist to the correct collection
    const sticker = stickers.find((s) => s.id === id);
    if (!sticker || !nextColor) return;

    if (sticker.source === "personal") {
      await setDoc(
        doc(db, "users", user.id, "notes", id.toString()),
        { ...sticker, color: nextColor },
        { merge: true }
      );
    } else if (sticker.source === "shared") {
      // global color for the shared note
      await setDoc(
        doc(db, "notes", id.toString()),
        { ...sticker, color: nextColor },
        { merge: true }
      );
    }
  };

  const saveSticker = async (sticker: StickerWithSource, userId: string) => {
    try {
      if (sticker.source === "personal") {
        const ref = doc(db, "users", userId, "notes", sticker.id.toString());
        await setDoc(ref, sticker, { merge: true });
      } else if (sticker.source === "shared") {
        const ref = doc(db, "notes", sticker.id.toString());
        await setDoc(ref, sticker, { merge: true });
      }
    } catch (err) {
      console.error("Error saving sticker:", err);
    }
  };

  const handleContentChange = async (id: number, newContent: string) => {
    setStickers(prev =>
      prev.map(s => (s.id === id ? { ...s, content: newContent } : s))
    );

    const sticker = stickers.find(s => s.id === id);
    if (sticker) {
      await saveSticker({ ...sticker, content: newContent }, user.id);
    }
  };

  const handleResize = async (id: number, newWidth: number, newHeight: number) => {
    const sticker = stickers.find((s) => s.id === id);
    if (!sticker) return;

    const updated = stickers.map((s) =>
      s.id === id ? { ...s, width: newWidth, height: newHeight } : s
    );
    setStickers(updated);

    if (sticker.source === "personal") {
      await setDoc(doc(db, "users", user.id, "notes", id.toString()), {
        ...sticker,
        width: newWidth,
        height: newHeight,
      });
    } else if (sticker.source === "shared") {
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
      return (
        newRow < sr + sh &&
        newRow + height > sr &&
        newCol < sc + sw &&
        newCol + width > sc
      );
    });

    if (isOccupied) return;

    const updated = stickers.map((s) =>
      s.id === id ? { ...s, row: newRow, col: newCol } : s
    );
    setStickers(updated);

    if (sticker.source === "personal") {
      await setDoc(doc(db, "users", user.id, "notes", id.toString()), {
        ...sticker,
        row: newRow,
        col: newCol,
      });
    } else if (sticker.source === "shared") {
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
    const preview =
      sticker.content.slice(0, 15) + (sticker.content.length > 15 ? "..." : "");
    const confirmed = window.confirm(
      `Are you sure you want to delete note "${preview}"?`
    );

    if (!confirmed) return;

    // Optimistic local update
    setStickers((prev) => prev.filter((s) => s.id !== sticker.id));

    try {
      if (sticker.source === "personal") {
        // delete from personal notes
        await deleteDoc(
          doc(db, "users", user.id, "notes", sticker.id.toString())
        );
      } else if (sticker.source === "shared") {
        const sharedRef = doc(db, "notes", sticker.id.toString());

        if (sticker.createdBy === user.id) {
          // ✅ creator deletes the entire shared sticker
          await deleteDoc(sharedRef);
        } else {
          // ✅ other user just removes their placement
          const { placements = {} } = sticker;
          const updatedPlacements = { ...placements };
          delete updatedPlacements[user.id];

          // If no placements left → delete entire doc
          if (Object.keys(updatedPlacements).length === 0) {
            await deleteDoc(sharedRef);
          } else {
            await setDoc(
              sharedRef,
              { placements: updatedPlacements },
              { merge: true }
            );
          }
        }
      }
    } catch (err) {
      console.error("Error deleting sticker:", err);
    }
  };

  const addSticker = async () => {
    const newSticker: StickerWithSource  = {
      content: "...",
      color: "default",
      id: Date.now(),
      index: stickers.length,
      width: 1,
      height: 1,
      source: "personal",
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
        <h3 className="card-title">Noticeboard</h3>
        <div className="card-header-right">
          <button onClick={addSticker}>
            <i className="fa-solid fa-plus grey icon-md hover"></i>
            Add
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
          ).map((sticker) => 
            {const canEditShared = !(sticker.source === "shared") || sticker.createdBy === user.id;
            return <DragableSticker
              user={user}
              key={`${sticker.source}-${sticker.id}`}
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
              db={db}
              setStickers={setStickers}
              isShared={sticker.source === "shared"}
              createdBy={sticker.createdBy}
              createdByName={sticker.createdByName}
              canEditContent={canEditShared}
              canResize={canEditShared}
            />}
          )}
        </div>
      </DndContext>
    </div>
  );
};

export default Notes;
