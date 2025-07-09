import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Sticker from "./Sticker";

export type StickerProps = {
  id: number;
  content: string;
  color: string;
  width: number;
  height: number;
  row: number;
  col: number;
  onDelete: () => void;
  onColorChange: () => void;
  onContentChange: (newContent: string) => void;
  onResize: (newWidth: number, newHeight: number) => void;
};

const gap = 12; // px
const baseNoteSize = 240;
const cellSize = 252; // px

const SortableSticker = (props: StickerProps) => {
  const {
    setNodeRef,
    transform,
    transition,
    attributes,
    listeners,
    isDragging,
  } = useSortable({ id: props.id });

const colCount = Math.floor(window.innerWidth / cellSize);
const row = props.row;
const col = props.col;

// Positioning the sticker on a grid using absolute positioning
const style: React.CSSProperties = {
  position: "absolute",
  top: row * cellSize,
  left: col * cellSize,
  width: props.width * cellSize - gap,
  height: props.height * cellSize - gap,
  transform: CSS.Transform.toString(transform), // for dragging animation
  transition,
  zIndex: isDragging ? 1000 : 1,
  touchAction: "manipulation",
};

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
    >
      <Sticker
        {...props}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
};

export default SortableSticker;
