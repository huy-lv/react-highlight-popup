import { Meta } from "../../types/Meta";

// export function addToSelectedText(selectedText: Meta[], newItem: Meta): Meta[] {
//   const result = [newItem];
//   const log = true
//   for (const o of selectedText) {
//     if (o.offset.end <= newItem.offset.start) {
//       result.unshift(o);
//       continue;
//     }
//     if (
//       newItem.offset.start <= o.offset.start &&
//       newItem.offset.end >= o.offset.end
//     ) {
//       log && console.log("o inside new");
//       continue
//     }
//     if (
//       o.offset.start <= newItem.offset.start &&
//       o.offset.end >= newItem.offset.end &&
//     ) {
//       log && console.log("o wrap new");
//       o.offset.start !== newItem.offset.start &&
//         result.push({
//           offset: { start: o.offset.start, end: newItem.offset.start },
//           color: o.color,
//         });
//       result.push(newItem);
//       newItem.offset.end !== o.offset.end &&
//         result.push({
//           offset: { start: newItem.offset.end, end: o.offset.end },
//           color: o.color,
//         });
//     }
//   }
//   return result;
// }

export function addToSelectedText(selectedText: Meta[], newItem: Meta): Meta[] {
  const log = true;
  const result = [];
  let lastItem: Meta | undefined = undefined;
  let pushed = false;
  for (const o of selectedText) {
    log && console.log("foreach ", o, newItem, lastItem);
    if (o.offset.end <= newItem.offset.start) {
      log && console.log("o < new");
      result.push(o);
      continue;
    }
    if (
      lastItem &&
      lastItem.offset.start < o.offset.end &&
      o.offset.start < lastItem.offset.end &&
      o.offset.start < lastItem.offset.start
    ) {
      log && console.log("o < last");
      result.push({
        offset: { start: lastItem.offset.start, end: lastItem.offset.end },
        color: lastItem.color,
      });
      lastItem = undefined;
      continue;
    }
    if (
      lastItem &&
      o.offset.start < lastItem.offset.end &&
      lastItem.offset.start < o.offset.end &&
      lastItem.offset.start < o.offset.start
    ) {
      log && console.log("last < o");
      result.push({
        offset: { start: lastItem.offset.end, end: o.offset.end },
        color: o.color,
      });
      lastItem = undefined;
      continue;
    }
    if (
      newItem.offset.start <= o.offset.start &&
      newItem.offset.end >= o.offset.end &&
      !pushed
    ) {
      log && console.log("new wrap o");
      result.push(newItem);
      pushed = true;
      continue;
    }
    if (
      o.offset.start <= newItem.offset.start &&
      o.offset.end >= newItem.offset.end &&
      !pushed
    ) {
      log && console.log("o wrap new");
      o.offset.start !== newItem.offset.start &&
        result.push({
          offset: { start: o.offset.start, end: newItem.offset.start },
          color: o.color,
        });
      result.push(newItem);
      newItem.offset.end !== o.offset.end &&
        result.push({
          offset: { start: newItem.offset.end, end: o.offset.end },
          color: o.color,
        });
      pushed = true;
      continue;
    }
    if (
      newItem.offset.start < o.offset.end &&
      o.offset.start < newItem.offset.end &&
      o.offset.start < newItem.offset.start &&
      !pushed
    ) {
      log && console.log("overlap o < new");
      result.push({
        offset: { start: o.offset.start, end: newItem.offset.start },
        color: o.color,
      });
      const item = {
        offset: { start: newItem.offset.start, end: newItem.offset.end },
        color: newItem.color,
      };
      result.push(item);
      lastItem = item;
      pushed = true;
      continue;
    }
    if (
      o.offset.start < newItem.offset.end &&
      newItem.offset.start < newItem.offset.end &&
      newItem.offset.start < o.offset.start &&
      !pushed
    ) {
      log && console.log("overlap new < o");
      result.push({
        offset: { start: newItem.offset.start, end: newItem.offset.end },
        color: newItem.color,
      });
      const item = {
        offset: { start: newItem.offset.end, end: o.offset.end },
        color: o.color,
      };
      result.push(item);
      lastItem = item;
      pushed = true;
      continue;
    }
    if (newItem.offset.end <= o.offset.start) {
      log && console.log("new < o");
      result.push(o);
    }
  }
  !pushed && result.push(newItem);
  return result;
}
