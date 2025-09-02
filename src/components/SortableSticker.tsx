import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import Sticker from "./Sticker";
import { Dispatch, SetStateAction } from "react";

/** Match what Sticker needs */
type SortableStickerProps = {
  user: { id: string; username: string; name?: string; role: string };
  id: number;
  content: string;
  color: string;
  width: number;
  height: number;
  row: number;
  col: number;
  disableDrag?: boolean;
  onDelete: () => void;
  onColorChange: () => void;
  onContentChange: (newContent: string) => void;
  onResize: (newWidth: number, newHeight: number) => void;

  /** These were missing */
  db: any;
  setStickers: Dispatch<SetStateAction<any[]>>;

  /** Optional extras you used earlier */
  isShared?: boolean;
  createdBy?: string;
  createdByName?: string;
  canEditContent?: boolean;
  canResize?: boolean;
};

const gap = 12;      // px
const cellSize = 252; // px

const SortableSticker = (props: SortableStickerProps) => {
  const {
    id,
    width,
    height,
    row,
    col,
    disableDrag = false,
    // rest contains user, db, setStickers, handlers, etc.
    ...rest
  } = props;

  const draggable = useDraggable({ id });
  const { setNodeRef, transform, attributes, listeners, isDragging } =
    disableDrag
      ? {
          setNodeRef: undefined,
          transform: null as any,
          attributes: {} as any,
          listeners: {} as any,
          isDragging: false,
        }
      : draggable;

  const style: React.CSSProperties = {
    position: "absolute",
    top: row * cellSize,
    left: col * cellSize,
    width: width * cellSize - gap,
    height: height * cellSize - gap,
    transform: CSS.Transform.toString(transform),
    zIndex: isDragging ? 1000 : 1,
    touchAction: "manipulation",
  };

  return (
    <div ref={setNodeRef} style={style} {...(disableDrag ? {} : attributes)}>
      <Sticker
        {...rest}
        id={id}
        width={width}
        height={height}
        row={row}
        col={col}
        /** Provide drag handle props when enabled */
        dragHandleProps={disableDrag ? {} : { ...attributes, ...listeners }}
      />
    </div>
  );
};

export default SortableSticker;
