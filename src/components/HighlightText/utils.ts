import { Meta } from "../../types/Meta";

export function addToSelectedText(selectedText: Meta[], newItem: Meta): Meta[] {
  const result = [newItem];
  const log = false;
  for (const o of selectedText) {
    log && console.log("foreach ", o, newItem);
    if (o.offset.end <= newItem.offset.start) {
      result.splice(result.length - 1, 0, o);
      continue;
    }
    if (
      newItem.offset.start <= o.offset.start &&
      newItem.offset.end >= o.offset.end
    ) {
      log && console.log("o inside new");
      continue;
    }
    if (newItem.offset.end <= o.offset.start) {
      log && console.log("new < o");
      result.push(o);
      continue;
    }
    if (
      o.offset.start <= newItem.offset.start &&
      o.offset.end >= newItem.offset.end
    ) {
      log && console.log("o wrap new");
      o.offset.start !== newItem.offset.start &&
        result.splice(result.length - 1, 0, {
          offset: { start: o.offset.start, end: newItem.offset.start },
          color: o.color,
        });
      newItem.offset.end !== o.offset.end &&
        result.push({
          offset: { start: newItem.offset.end, end: o.offset.end },
          color: o.color,
        });
      continue;
    }
    if (
      newItem.offset.start < o.offset.end &&
      o.offset.start < newItem.offset.end &&
      o.offset.start < newItem.offset.start
    ) {
      log && console.log("overlap o < new");
      result.splice(result.length - 1, 0, {
        offset: { start: o.offset.start, end: newItem.offset.start },
        color: o.color,
      });
      continue;
    }
    if (
      o.offset.start < newItem.offset.end &&
      newItem.offset.start < newItem.offset.end &&
      newItem.offset.start < o.offset.start
    ) {
      log && console.log("overlap new < o");
      const item = {
        offset: { start: newItem.offset.end, end: o.offset.end },
        color: o.color,
      };
      result.push(item);
      continue;
    }
  }
  return result;
}
