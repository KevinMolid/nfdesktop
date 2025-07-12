export type StickerData = {
  id: number;
  color: string;
  content: string;
  width?: number;
  height?: number;
  index: number;
  col?: number;
  row?: number;
};

export type TaskData = {
  id: number;
  name: string;
  status: string;
  priority: number;
};