import { StickerData } from "../types";
import { Task } from "../types";

export function isValidSticker(obj: any): obj is StickerData {
  return obj && typeof obj === "object" &&
    typeof obj.id === "number" &&
    typeof obj.content === "string" &&
    typeof obj.color === "string";
}

export function isValidTask(obj: any): obj is Task {
  return obj && typeof obj === "object" &&
    typeof obj.id === "number" &&
    typeof obj.name === "string" &&
    typeof obj.status === "string";
}
