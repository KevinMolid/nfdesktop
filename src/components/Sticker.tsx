import { useEffect, useRef, useState, Dispatch, SetStateAction } from "react";

type StickerColor = "default" | "yellow" | "blue" | "red" | "green";

type Audience = {
  everyone?: boolean;
  userIds?: string[];
  groupIds?: string[];
};

type StickerProps = {
  user: {
    id: string;
    username: string;
    name?: string;
    role: string;
  };
  id: number;
  color: StickerColor;
  content: string;
  width?: number;
  height?: number;
  row: number;
  col: number;

  // actions
  onColorChange: (color: StickerColor) => void;
  onContentChange: (content: string) => void;
  onDelete: () => void;
  onResize?: (width: number, height: number) => void;
  onOpenShare?: () => void;

  // drag
  dragHandleProps?: React.HTMLAttributes<HTMLElement>;

  // kept for compatibility (not used here)
  db: any;
  setStickers: Dispatch<SetStateAction<any[]>>;

  // shared meta
  isShared?: boolean;
  createdBy?: string;
  createdByName?: string;

  // audience display (precomputed label from Notes)
  share?: Audience;
  shareLabel?: string;

  // perms
  canEditContent?: boolean;
  canResize?: boolean;
  canChangeColor?: boolean;
};

const COLORS: StickerColor[] = ["default", "yellow", "blue", "red", "green"];

const Sticker = ({
  id,
  user,
  color,
  content,
  width = 1,
  height = 1,
  row,
  col,
  onColorChange,
  onContentChange,
  onDelete,
  onResize,
  dragHandleProps,
  isShared,
  createdBy,
  createdByName,
  share,
  canEditContent = true,
  canResize = true,
  canChangeColor = true,
  onOpenShare,
  shareLabel,
}: StickerProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Root element ref (we measure this for pixel sizes)
  const rootRef = useRef<HTMLDivElement | null>(null);

  // palette dropdown state
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const paletteRef = useRef<HTMLDivElement | null>(null);

  // RESIZE STATE
  const [isResizingRight, setIsResizingRight] = useState(false);
  const [isResizingBottom, setIsResizingBottom] = useState(false);

  // Live pixel size preview while dragging
  const [dragSizePx, setDragSizePx] = useState<{ width: number; height: number } | null>(null);

  // Snapped-to-grid target size in cells (for ghost)
  const [ghostCells, setGhostCells] = useState<{ width: number; height: number } | null>(null);

  // Are we currently animating the snap (release → snapped size)?
  const [snapAnimating, setSnapAnimating] = useState(false);

  // Data captured at the start of resize
  const resizeStartRef = useRef<{
    startX: number;
    startY: number;
    widthCells: number;
    heightCells: number;
    cellWidthPx: number;
    cellHeightPx: number;
  } | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (paletteRef.current && !paletteRef.current.contains(e.target as Node)) {
        setIsPaletteOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Turn off snap anim + explicit size after 200ms
  useEffect(() => {
    if (!snapAnimating) return;
    const id = setTimeout(() => {
      setSnapAnimating(false);
      setDragSizePx(null); // let it fall back to natural/grid size
    }, 200);
    return () => clearTimeout(id);
  }, [snapAnimating]);

  // Existing click-based controls (still useful)
  const increaseWidth = () => onResize?.(width + 1, height);
  const decreaseWidth = () => onResize?.(Math.max(1, width - 1), height);
  const increaseHeight = () => onResize?.(width, height + 1);
  const decreaseHeight = () => onResize?.(width, Math.max(1, height - 1));

  // ---- DRAG RESIZE: start ----
  const beginResize = (e: React.MouseEvent, direction: "right" | "bottom") => {
    if (!rootRef.current || !onResize || !canResize) return;

    e.preventDefault();
    e.stopPropagation();

    const rect = rootRef.current.getBoundingClientRect();

    // Each cell is approx this big in px
    const cellWidthPx = rect.width / width;
    const cellHeightPx = rect.height / height;

    resizeStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      widthCells: width,
      heightCells: height,
      cellWidthPx,
      cellHeightPx,
    };

    // Start preview at current size
    setDragSizePx({ width: rect.width, height: rect.height });
    setGhostCells({ width, height });
    setSnapAnimating(false); // ensure no snap transition during drag

    if (direction === "right") {
      setIsResizingRight(true);
    } else {
      setIsResizingBottom(true);
    }
  };

  const beginResizeRight = (e: React.MouseEvent) => beginResize(e, "right");
  const beginResizeBottom = (e: React.MouseEvent) => beginResize(e, "bottom");

  // ---- DRAG RESIZE: move + end ----
  useEffect(() => {
    if (!isResizingRight && !isResizingBottom) return;

    const handleMove = (e: MouseEvent) => {
      if (!resizeStartRef.current) return;

      const {
        startX,
        startY,
        widthCells,
        heightCells,
        cellWidthPx,
        cellHeightPx,
      } = resizeStartRef.current;

      // Current raw pixel size based on drag distance
      let nextWidthPx = widthCells * cellWidthPx;
      let nextHeightPx = heightCells * cellHeightPx;

      if (isResizingRight) {
        const dx = e.clientX - startX;
        nextWidthPx = Math.max(cellWidthPx, widthCells * cellWidthPx + dx);
      }

      if (isResizingBottom) {
        const dy = e.clientY - startY;
        nextHeightPx = Math.max(cellHeightPx, heightCells * cellHeightPx + dy);
      }

      setDragSizePx({
        width: nextWidthPx,
        height: nextHeightPx,
      });

      // Compute snapped cell counts for the ghost preview
      const targetWidthCells = Math.max(1, Math.round(nextWidthPx / cellWidthPx));
      const targetHeightCells = Math.max(1, Math.round(nextHeightPx / cellHeightPx));

      setGhostCells({
        width: targetWidthCells,
        height: targetHeightCells,
      });
    };

    const handleUp = () => {
      if (resizeStartRef.current && ghostCells && onResize) {
        const { cellWidthPx, cellHeightPx } = resizeStartRef.current;

        // Where should it snap to, in pixels?
        const targetWidthPx = ghostCells.width * cellWidthPx;
        const targetHeightPx = ghostCells.height * cellHeightPx;

        // Trigger snap animation from current dragSizePx -> target
        setSnapAnimating(true);
        setDragSizePx((current) => {
          const from = current ?? {
            width: targetWidthPx,
            height: targetHeightPx,
          };
          // React will animate between previous width/height and these ones
          return {
            width: targetWidthPx,
            height: targetHeightPx,
          };
        });

        // Persist snapped cell dimensions
        onResize(ghostCells.width, ghostCells.height);
      }

      setIsResizingRight(false);
      setIsResizingBottom(false);
      setGhostCells(null);
      resizeStartRef.current = null;
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isResizingRight, isResizingBottom, onResize, ghostCells]);

  /** Parse simple BBCode into HTML */
  function parseBBCode(text: string): string {
    return text
      .replace(/\[b\](.*?)\[\/b\]/gi, "<strong>$1</strong>")
      .replace(/\[i\](.*?)\[\/i\]/gi, "<em>$1</em>")
      .replace(/\[u\](.*?)\[\/u\]/gi, "<u>$1</u>")
      .replace(/\n/g, "<br />");
  }

  /** CTRL/CMD + B/I/U for BBCode */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!e.ctrlKey && !e.metaKey) return;
    let tag: "b" | "i" | "u" | null = null;
    const k = e.key.toLowerCase();
    if (k === "b") tag = "b";
    if (k === "i") tag = "i";
    if (k === "u") tag = "u";
    if (tag && textareaRef.current) {
      e.preventDefault();
      const el = textareaRef.current;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const before = content.substring(0, start);
      const sel = content.substring(start, end);
      const after = content.substring(end);
      const next = `${before}[${tag}]${sel}[/${tag}]${after}`;
      onContentChange(next);
      setTimeout(() => {
        el.selectionStart = start + tag!.length + 2;
        el.selectionEnd = end + tag!.length + 2;
      }, 0);
    }
  };

  // Ghost preview width/height in px (snapped to cells)
  let ghostWidthPx: number | undefined;
  let ghostHeightPx: number | undefined;

  if (ghostCells && resizeStartRef.current) {
    const { cellWidthPx, cellHeightPx } = resizeStartRef.current;
    ghostWidthPx = ghostCells.width * cellWidthPx;
    ghostHeightPx = ghostCells.height * cellHeightPx;
  }

  // Style for the inner container:
  // - While dragging: width/height = live drag px, no transition
  // - On snap: animate width/height to snapped px over 200ms
  const containerStyle: React.CSSProperties = {
    ...(dragSizePx
      ? {
          width: dragSizePx.width,
          height: dragSizePx.height,
        }
      : {}),
    transition: snapAnimating ? "width 200ms ease-out, height 200ms ease-out" : "none",
  };

  return (
    <div
      ref={rootRef}
      className={`relative sticker-inside rounded-md ${
        isShared ? "sticker--shared" : `sticker-${color}`
      }`}
      style={containerStyle}
    >
      {/* Ghost overlay (snapped size) */}
      {ghostWidthPx != null && ghostHeightPx != null && (
        <div
          className="pointer-events-none absolute top-0 left-0 z-[1] box-border rounded-md border-2 border-dashed border-(--text5-color)"
          style={{
            width: ghostWidthPx,
            height: ghostHeightPx,
          }}
        />
      )}

      <div className="sticker-headline relative z-[2]">
        {isShared && (
          <div className="sticker-shared-by">
            {createdBy === user.id
              ? `Shared with ${shareLabel ?? "everyone"}`
              : `Shared by ${createdByName || "Unknown"}`}
          </div>
        )}

        <div className="drag-handle" {...dragHandleProps} />

        {canEditContent && (
          <div className="sticker-icons">
            {/* Share: open modal in Notes */}
            <i
              className="fa-solid fa-share sticker-icon"
              onClick={onOpenShare}
              title="Share"
              role="button"
            />

            {/* Color palette dropdown */}
            <div ref={paletteRef} className="relative">
              <i
                className={`fa-solid fa-palette sticker-icon ${
                  !canChangeColor ? "disabled" : ""
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (canChangeColor) setIsPaletteOpen((v) => !v);
                }}
                title="Choose color"
                aria-haspopup="menu"
                aria-expanded={isPaletteOpen}
              />
              {isPaletteOpen && (
                <div className="color-dropdown" role="menu" style={{ right: 0 }}>
                  {COLORS.map((c) => (
                    <div
                      key={c}
                      className="dropdown-item hover-border"
                      role="menuitem"
                      onClick={() => {
                        onColorChange(c);
                        setIsPaletteOpen(false);
                      }}
                    >
                      <div className={`color-dropdown-preview sticker-${c}`}>
                        <span className="preview-text">NOTE</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Delete */}
            <i
              className="fa-solid fa-trash sticker-icon"
              onClick={onDelete}
              title="Delete"
              role="button"
            />
          </div>
        )}
      </div>

      {isEditing && canEditContent ? (
        <textarea
          ref={textareaRef}
          className="sticker-textarea relative z-[2]"
          spellCheck={false}
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          onBlur={() => setIsEditing(false)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      ) : (
        <div
          className="sticker-content relative z-[2]"
          dangerouslySetInnerHTML={{ __html: parseBBCode(content) }}
          onClick={() => canEditContent && setIsEditing(true)}
        />
      )}

      {/* Drag resize handles (side + bottom) */}
      {canResize && (
        <>
          <div
            onMouseDown={beginResizeRight}
            role="separator"
            aria-orientation="vertical"
            className="absolute right-0 top-0 z-[3] h-full w-2 cursor-ew-resize"
          />
          <div
            onMouseDown={beginResizeBottom}
            role="separator"
            aria-orientation="horizontal"
            className="absolute bottom-0 left-0 z-[3] h-2 w-full cursor-ns-resize"
          />
        </>
      )}
    </div>
  );
};

export default Sticker;
