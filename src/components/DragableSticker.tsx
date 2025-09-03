import { CSS } from "@dnd-kit/utilities";
import { useDraggable } from "@dnd-kit/core";
import Sticker from "./Sticker";
import type { Dispatch, SetStateAction } from "react";

type StickerColor = "default" | "yellow" | "blue" | "red" | "green";

export type StickerProps = {
  user: {
    id: string;
    username: string;
    name?: string;
    role: string;
  };
  id: number;
  content: string;
  color: StickerColor;
  width: number;
  height: number;
  row: number;
  col: number;
  disableDrag?: boolean;
  onDelete: (id: number) => void;
  onColorChange: (color: StickerColor) => void;
  onContentChange: (newContent: string) => void;
  onResize: (newWidth: number, newHeight: number) => void;
  db: any;
  setStickers: Dispatch<SetStateAction<any[]>>;
  isShared?: boolean;
  createdBy?: string;
  createdByName?: string;
  canEditContent?: boolean;
  canResize?: boolean;
  canChangeColor?: boolean;
};

const gap = 12; // px
const cellSize = 252; // px

const DragableSticker = (props: StickerProps) => {
  const { id, width, height, row, col, disableDrag = false, isShared } = props;

  const { setNodeRef, transform, attributes, listeners, isDragging } = useDraggable({ id });

  const style: React.CSSProperties = {
    position: "absolute",
    top: row * cellSize,
    left: col * cellSize,
    width: width * cellSize - gap,
    height: height * cellSize - gap,
    transform: CSS.Transform.toString(disableDrag ? null : transform),
    zIndex: isDragging ? 1000 : 1,
    touchAction: "manipulation",
  };

  return (
    <div
      ref={disableDrag ? undefined : setNodeRef} 
      style={style}
      className={`sticker-wrapper ${
        isShared ? "sticker-wrapper--shared" : "sticker-wrapper--personal"
      }`}
    >
      <Sticker
        {...props}
        dragHandleProps={
          disableDrag
            ? {}
            : {
                ...attributes,
                ...listeners,
                role: "button",
                "aria-grabbed": isDragging || undefined,
              }
        }
      />
    </div>
  );
};

export default DragableSticker;
