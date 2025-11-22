import { useEffect, useRef, useState } from "react";
import {
  collection,
  doc,
  deleteDoc,
  onSnapshot,
  setDoc,
  query,
  orderBy,
} from "firebase/firestore";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";

import Button from "./Button";

import { db } from "./firebase";
import DragableSticker from "./DragableSticker";
import { StickerData } from "../types";
import { isValidSticker } from "../utils/validators";

const cellSize = 252; // px

type StickerColor = "default" | "yellow" | "blue" | "red" | "green";

type Audience = {
  /** if true, ignore users/groups */
  everyone?: boolean;
  /** user ids allowed */
  userIds?: string[];
  /** usergroup ids allowed (must be group *IDs*) */
  groupIds?: string[];
};

type StickerWithSource = Omit<StickerData, "color"> & {
  color: StickerColor;
  source: "personal" | "shared";
  placements?: Record<string, { row: number; col: number }>;
  createdBy?: string;
  createdByName?: string;
  /** visibility */
  share?: Audience;
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
  const [maxCols, setMaxCols] = useState(3);
  const [isMobileView, setIsMobileView] = useState(false);

  const [userNamesById, setUserNamesById] = useState<Record<string, string>>(
    {}
  );
  const [groupNamesById, setGroupNamesById] = useState<Record<string, string>>(
    {}
  );
  const [allUsers, setAllUsers] = useState<
    Array<{ id: string; username: string; name?: string }>
  >([]);
  const [allGroups, setAllGroups] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [myGroupIds, setMyGroupIds] = useState<string[]>([]); // derived from usergroups/{gid}/members/{uid}

  // Share modal state
  const [shareOpenForId, setShareOpenForId] = useState<number | null>(null);
  const [shareEveryone, setShareEveryone] = useState<boolean>(true);
  const [shareUserIds, setShareUserIds] = useState<string[]>([]);
  const [shareGroupIds, setShareGroupIds] = useState<string[]>([]);

  const boardRef = useRef<HTMLDivElement>(null);
  const sensors = useSensors(useSensor(PointerSensor));

  // Users → id -> display name
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      const map: Record<string, string> = {};
      snap.forEach((d) => {
        const data = d.data() as any;
        const display =
          (data.nickname && String(data.nickname).trim()) ||
          (data.name && String(data.name).trim()) ||
          data.username ||
          d.id;
        map[d.id] = display;
      });
      setUserNamesById(map);
    });
    return () => unsub();
  }, []);

  // Groups → id -> name
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "usergroups"), (snap) => {
      const map: Record<string, string> = {};
      snap.forEach((d) => {
        const data = d.data() as { name?: string };
        map[d.id] = data.name || d.id;
      });
      setGroupNamesById(map);
    });
    return () => unsub();
  }, []);

  // Build the "Shared with ..." label (names, not counts)
  function getShareLabel(sticker: any): string {
    const share = sticker.share as Audience | undefined;
    if (!share || share.everyone) return "everyone";

    const names: string[] = [];
    (share.userIds || []).forEach((uid) =>
      names.push(userNamesById[uid] || uid)
    );
    (share.groupIds || []).forEach((gid) =>
      names.push(groupNamesById[gid] || gid)
    );
    return names.length ? names.join(", ") : "no one";
  }

  // Responsive layout
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

  // Directory listeners (users & groups for share picker)
  useEffect(() => {
    const unsubUsers = onSnapshot(
      query(collection(db, "users"), orderBy("username")),
      (snap) => {
        setAllUsers(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as { username: string; name?: string }),
          }))
        );
      }
    );

    // Groups + per-group membership watcher for THIS user
    let memberUnsubs: Array<() => void> = [];
    const unsubGroups = onSnapshot(collection(db, "usergroups"), (snap) => {
      const groups = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as { name: string }),
      }));
      setAllGroups(groups);

      // reset current mem listeners + my groups
      memberUnsubs.forEach((u) => u());
      memberUnsubs = [];
      setMyGroupIds([]);

      // for each group: watch usergroups/{gid}/members/{uid}
      groups.forEach((g) => {
        const memRef = doc(db, "usergroups", g.id, "members", user.id);
        const u = onSnapshot(memRef, (memSnap) => {
          setMyGroupIds((prev) => {
            const exists = memSnap.exists();
            const already = prev.includes(g.id);
            if (exists && !already) return [...prev, g.id];
            if (!exists && already) return prev.filter((x) => x !== g.id);
            return prev;
          });
        });
        memberUnsubs.push(u);
      });
    });

    return () => {
      unsubUsers();
      unsubGroups();
      memberUnsubs.forEach((u) => u());
    };
  }, [user.id]);

  // Personal notes
  useEffect(() => {
    const personalRef = collection(db, "users", user.id, "notes");
    const unsubPersonal = onSnapshot(personalRef, (snapshot) => {
      const personal = snapshot.docs
        .map((d) => d.data())
        .filter(isValidSticker);
      setStickers((prev) => mergeStickers(prev, personal, "personal"));
    });
    return () => unsubPersonal();
  }, [user.id]);

  // Shared notes (filter by audience)
  useEffect(() => {
    const sharedRef = collection(db, "notes");
    const unsubShared = onSnapshot(sharedRef, (snapshot) => {
      const raw = snapshot.docs.map((d) => d.data()).filter(isValidSticker);
      const visible = raw.filter((n: any) => canSee(n, user.id, myGroupIds));
      setStickers((prev) => mergeStickers(prev, visible, "shared"));
    });
    return () => unsubShared();
  }, [user.id, myGroupIds]);

  // Ensure shared notes get a per-user placement
  useEffect(() => {
    const needsPlacement = stickers.filter(
      (s) => s.source === "shared" && !(s.placements && s.placements[user.id])
    );
    if (needsPlacement.length === 0) return;

    let working = stickers.filter(
      (s) => s.row !== undefined && s.col !== undefined
    );

    (async () => {
      for (const s of needsPlacement) {
        const { row, col } = findFreePlacement(
          s.width ?? 1,
          s.height ?? 1,
          working,
          maxCols
        );
        working = [...working, { ...s, row, col }];

        // Optimistic
        setStickers((prev) =>
          prev.map((x) => (x.id === s.id ? { ...x, row, col } : x))
        );

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

  // color normalizer
  const toStickerColor = (c: unknown): StickerColor => {
    const allowed = ["default", "yellow", "blue", "red", "green"] as const;
    return (allowed as readonly string[]).includes(String(c))
      ? (c as StickerColor)
      : "default";
  };

  function mergeStickers(
    prev: StickerWithSource[],
    incoming: StickerData[],
    source: "personal" | "shared"
  ): StickerWithSource[] {
    const tagged = incoming.map((s: any) => {
      const base: StickerWithSource = {
        ...s,
        color: toStickerColor(s.color),
        source,
      };
      if (source === "shared") {
        const placement = s.placements?.[user.id];
        return placement
          ? { ...base, row: placement.row, col: placement.col }
          : base;
      }
      return base;
    });

    const keep = prev.filter((s) => s.source !== source);
    const byId = new Map<number, StickerWithSource>();
    for (const s of tagged) byId.set(s.id, s);
    return [...keep, ...byId.values()];
  }

  // visibility check
  function canSee(n: any, uid: string, myGroups: string[]): boolean {
    const share: Audience | undefined = n.share;

    // Creator always sees their own note
    if (n.createdBy === uid) return true;

    // Back-compat: no share field = visible to everyone
    if (!share || share.everyone) return true;

    if (share.userIds?.includes(uid)) return true;
    if (share.groupIds?.some((gid) => myGroups.includes(gid))) return true;

    return false;
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
        if (r < sr + sh && r + h > sr && c < sc + sw && c + w > sc)
          return false;
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
    setStickers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, color: newColor } : s))
    );

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
    setStickers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, content: newContent } : s))
    );
    const sticker = stickers.find((s) => s.id === id);
    if (sticker)
      await saveSticker({ ...sticker, content: newContent }, user.id);
  };

  const handleResize = async (
    id: number,
    newWidth: number,
    newHeight: number
  ) => {
    const sticker = stickers.find((s) => s.id === id);
    if (!sticker) return;

    setStickers((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, width: newWidth, height: newHeight } : s
      )
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
      return (
        newRow < sr + sh &&
        newRow + height > sr &&
        newCol < sc + sw &&
        newCol + width > sc
      );
    });
    if (isOccupied) return;

    setStickers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, row: newRow, col: newCol } : s))
    );

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
    const preview =
      sticker.content.slice(0, 15) + (sticker.content.length > 15 ? "..." : "");
    const confirmed = window.confirm(
      `Are you sure you want to delete note "${preview}"?`
    );
    if (!confirmed) return;

    setStickers((prev) => prev.filter((s) => s.id !== sticker.id));

    try {
      if (sticker.source === "personal") {
        await deleteDoc(
          doc(db, "users", user.id, "notes", sticker.id.toString())
        );
      } else {
        const sharedRef = doc(db, "notes", sticker.id.toString());
        if (sticker.createdBy === user.id) {
          await deleteDoc(sharedRef);
        } else {
          const { placements = {} } = sticker;
          const updatedPlacements = { ...placements };
          delete (updatedPlacements as any)[user.id];

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
    await setDoc(
      doc(db, "users", user.id, "notes", newSticker.id.toString()),
      newSticker
    );
  };

  // open share modal for a sticker
  const openShareModal = (stickerId: number) => {
    const s = stickers.find((x) => x.id === stickerId);
    setShareOpenForId(stickerId);
    const existing = s?.share;
    setShareEveryone(existing?.everyone ?? true);
    setShareUserIds(existing?.userIds ?? []);
    setShareGroupIds(existing?.groupIds ?? []);
  };
  const closeShareModal = () => setShareOpenForId(null);

  const toggleInArray = (arr: string[], id: string) =>
    arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];

  const saveShare = async () => {
    if (shareOpenForId == null) return;
    const s = stickers.find((x) => x.id === shareOpenForId);
    if (!s) return;

    const finalShare: Audience = shareEveryone
      ? { everyone: true, userIds: [], groupIds: [] }
      : {
          everyone: false,
          // ensure author is included
          userIds: Array.from(new Set([...(shareUserIds || []), user.id])),
          groupIds: shareGroupIds || [],
        };

    const payload = {
      ...s,
      share: finalShare,
      createdBy: s.createdBy ?? user.id,
      createdByName: s.createdByName ?? (user.name?.trim() || user.username),
      placements: {
        ...(s.placements || {}),
        [user.id]: { row: s.row ?? 0, col: s.col ?? 0 },
      },
    };

    await setDoc(doc(db, "notes", s.id.toString()), payload, { merge: true });

    if (s.source === "personal") {
      await deleteDoc(doc(db, "users", user.id, "notes", s.id.toString()));
      setStickers(
        (prev) =>
          prev.map((x) =>
            x.id === s.id ? { ...(payload as any), source: "shared" } : x
          ) as StickerWithSource[]
      );
    } else {
      setStickers((prev) =>
        prev.map((x) => (x.id === s.id ? { ...x, share: payload.share } : x))
      );
    }

    closeShareModal();
  };

  const unshareNote = async () => {
    if (shareOpenForId == null) return;
    const s = stickers.find((x) => x.id === shareOpenForId);
    if (!s) return;

    // Only the creator can unshare (others can already "leave" via delete)
    if (s.source !== "shared" || s.createdBy !== user.id) {
      // nothing to do; just close
      closeShareModal();
      return;
    }

    try {
      // Build the personal copy (keep current placement for the creator)
      const personalCopy = {
        content: s.content,
        color: s.color,
        id: s.id,
        index: s.index ?? 0,
        width: s.width ?? 1,
        height: s.height ?? 1,
        row: s.placements?.[user.id]?.row ?? s.row ?? 0,
        col: s.placements?.[user.id]?.col ?? s.col ?? 0,
      };

      // 1) Write it back to the creator's personal notes
      await setDoc(
        doc(db, "users", user.id, "notes", s.id.toString()),
        personalCopy,
        { merge: true }
      );

      // 2) Remove the shared copy so it's no longer visible to others
      await deleteDoc(doc(db, "notes", s.id.toString()));

      // 3) Update local state
      setStickers((prev) =>
        prev.map((x) =>
          x.id === s.id
            ? {
                ...x,
                ...personalCopy,
                source: "personal",
                share: undefined,
                placements: undefined,
                createdBy: undefined,
                createdByName: undefined,
              }
            : x
        )
      );
    } catch (err) {
      console.error("Error unsharing note:", err);
    } finally {
      closeShareModal();
    }
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
      }, 0) +
        1) *
      cellSize;

  return (
    <div className="card has-header full-width">
      <div className="card-header">
        <h3 className="card-title">Noticeboard</h3>
        <div className="card-header-right">
          <Button
            variant="transparent"
            size="sm"
            iconLeft={<i className="fa-solid fa-plus" />}
            onClick={addSticker}
          >
            Add
          </Button>
          <Button
            variant="transparent"
            size="sm"
            onClick={() => toggleActive("Notes")}
          >
            <i className="fa-solid fa-x" />
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div
          className="stickerboard"
          ref={boardRef}
          style={{ height: boardHeight }}
        >
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
                onColorChange={(color) =>
                  handleSetColor(sticker.id, color as StickerColor)
                }
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
                canChangeColor={canEditShared}
                onOpenShare={() => openShareModal(sticker.id)}
                share={(sticker as any).share}
                shareLabel={getShareLabel(sticker)}
              />
            );
          })}
        </div>
      </DndContext>

      {/* Share modal */}
      {shareOpenForId !== null && (
        <div className="share-note-box" role="dialog" aria-modal="true">
          <h4>Share note</h4>

          <div>
            <label className="m-r-1">
              <input
                type="checkbox"
                checked={shareEveryone}
                onChange={(e) => setShareEveryone(e.target.checked)}
              />{" "}
              Share with everyone
            </label>
          </div>

          {!shareEveryone && (
            <div
              className="share-grid"
              style={{
                display: "grid",
                gap: "24px",
                gridTemplateColumns: "2fr 1fr",
                marginBottom: "24px",
              }}
            >
              <div>
                <h5>Users</h5>
                <ul>
                  {allUsers.map((u) => {
                    const label = u.name?.trim()
                      ? `${u.name} (${u.username})`
                      : u.username;
                    const checked = shareUserIds.includes(u.id);
                    return (
                      <li key={u.id}>
                        <label className="checkbox-row">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setShareUserIds((arr) => toggleInArray(arr, u.id))
                            }
                          />
                          <span>{label}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div>
                <h5>User groups</h5>
                <ul>
                  {allGroups.map((g) => {
                    const checked = shareGroupIds.includes(g.id);
                    return (
                      <li key={g.id}>
                        <label className="checkbox-row">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setShareGroupIds((arr) =>
                                toggleInArray(arr, g.id)
                              )
                            }
                          />
                          <span>{g.name}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}

          <div className="button-group m-t-1">
            {/* Unshare: only if this is a shared note AND I'm the creator */}
            {(() => {
              const s =
                shareOpenForId != null
                  ? stickers.find((x) => x.id === shareOpenForId)
                  : null;
              const canUnshare = !!(
                s &&
                s.source === "shared" &&
                s.createdBy === user.id
              );
              return (
                canUnshare && (
                  <button className="delete-btn" onClick={unshareNote}>
                    <i className="fa-solid fa-unlink icon-md" />
                    Unshare
                  </button>
                )
              );
            })()}

            {/* Primary button: Share → Save when already shared */}
            {(() => {
              const s =
                shareOpenForId != null
                  ? stickers.find((x) => x.id === shareOpenForId)
                  : null;
              const isAlreadyShared = !!(s && s.source === "shared");
              const primaryLabel = isAlreadyShared ? "Save" : "Share";
              const primaryIcon = isAlreadyShared
                ? "fa-solid fa-floppy-disk icon-md"
                : "fa-solid fa-share-nodes icon-md";

              return (
                <button className="save-btn" onClick={saveShare}>
                  <i className={primaryIcon} />
                  {primaryLabel}
                </button>
              );
            })()}

            <button className="delete-btn" onClick={closeShareModal}>
              <i className="fa-solid fa-xmark icon-md" />
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notes;
