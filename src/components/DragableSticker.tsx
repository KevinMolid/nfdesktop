import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import Sticker from "./Sticker";
import { Dispatch, SetStateAction } from "react";

export type StickerProps = {
  user: {
    id: string;
    username: string;
    name?: string;
    role: string;
  };
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
  db: any;
  setStickers: Dispatch<SetStateAction<any[]>>;
  isShared?: boolean;
  createdBy?: string;
  createdByName?: string;
  canEditContent?: boolean;
  canResize?: boolean;
};

const gap = 12; // px
const cellSize = 252; // px

const DragableSticker = (props: StickerProps) => {
  const { id, user, width, height, row, col, disableDrag = false, isShared } = props;

  const draggable = useDraggable({ id });
  const { setNodeRef, transform, attributes, listeners, isDragging } =
    disableDrag
      ? {
          setNodeRef: undefined,
          transform: null,
          attributes: {},
          listeners: {},
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
    <div
      ref={setNodeRef}
      style={style}
      className={`sticker-wrapper ${isShared ? "sticker-wrapper--shared" : "sticker-wrapper--personal"}`}
      {...(disableDrag ? {} : attributes)}
    >
      <Sticker
        {...props}
        dragHandleProps={disableDrag ? {} : { ...attributes, ...listeners }}
      />
    </div>
  );
};

export default DragableSticker;
