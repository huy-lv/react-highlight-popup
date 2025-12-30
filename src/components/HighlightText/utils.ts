import { Meta } from "../../types/Meta";

/**
 * Helper function để tính text offset của một node trong container
 */
function getTextOffset(node: Node, offset: number, container: Node): number {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
  let currentOffset = 0;
  let currentNode = walker.nextNode();
  
  while (currentNode) {
    if (currentNode === node) {
      return currentOffset + offset;
    }
    currentOffset += (currentNode.textContent || "").length;
    currentNode = walker.nextNode();
  }
  
  return currentOffset;
}

/**
 * Helper function để tính text content trước một element
 */
function getTextContentBefore(element: Node, container: Node): number {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
  let currentOffset = 0;
  let currentNode = walker.nextNode();
  
  while (currentNode && currentNode !== element) {
    // Kiểm tra xem currentNode có nằm trong element không
    if (element.contains && element.contains(currentNode)) {
      break;
    }
    currentOffset += (currentNode.textContent || "").length;
    currentNode = walker.nextNode();
  }
  
  return currentOffset;
}

/**
 * Helper function để tạo span từ text offset
 */
function createSpanFromTextOffset(
  container: Node,
  startOffset: number,
  endOffset: number,
  color: string | undefined,
  insertBefore: Node | null
): void {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
  let currentOffset = 0;
  let node = walker.nextNode();
  let startNode: Text | null = null;
  let startNodeOffset = 0;
  let endNode: Text | null = null;
  let endNodeOffset = 0;
  
  // Tìm start node
  while (node && !startNode) {
    const textNode = node as Text;
    const nodeText = textNode.textContent || "";
    const nodeLength = nodeText.length;
    const nextOffset = currentOffset + nodeLength;
    
    if (startOffset >= currentOffset && startOffset < nextOffset) {
      startNode = textNode;
      startNodeOffset = startOffset - currentOffset;
    }
    currentOffset = nextOffset;
    if (!startNode) node = walker.nextNode();
  }
  
  // Tìm end node
  currentOffset = 0;
  node = walker.nextNode();
  while (node && !endNode) {
    const textNode = node as Text;
    const nodeText = textNode.textContent || "";
    const nodeLength = nodeText.length;
    const nextOffset = currentOffset + nodeLength;
    
    if (endOffset >= currentOffset && endOffset <= nextOffset) {
      endNode = textNode;
      endNodeOffset = endOffset - currentOffset;
    }
    currentOffset = nextOffset;
    if (!endNode) node = walker.nextNode();
  }
  
  if (startNode && endNode) {
    try {
      const range = document.createRange();
      range.setStart(startNode, startNodeOffset);
      range.setEnd(endNode, endNodeOffset);
      
      if (!range.collapsed && range.toString().trim()) {
        const contents = range.extractContents();
        const span = document.createElement("span");
        span.className = "highlighted-text";
        span.style.backgroundColor = color || "transparent";
        span.appendChild(contents);
        
        const parent = startNode.parentNode || container;
        if (insertBefore) {
          parent.insertBefore(span, insertBefore);
        } else {
          parent.appendChild(span);
        }
      }
    } catch (e) {
      // Nếu không thể tạo range, bỏ qua
    }
  }
}

/**
 * Helper function để tách text nodes tại một offset và tạo span mới
 * @param span Span cần tách
 * @param offset Offset trong text content của span
 * @param color Màu cho span mới
 * @param parent Parent node để insert span
 * @param insertBefore Node để insert before
 * @returns Các nodes đã được move (để có thể unwrap phần còn lại)
 */
function splitAndCreateSpan(
  span: HTMLSpanElement,
  offset: number,
  color: string | undefined,
  parent: Node,
  insertBefore: Node | null
): Node[] {
  const movedNodes: Node[] = [];
  let currentOffset = 0;
  let node = span.firstChild;
  
  while (node && currentOffset < offset) {
    if (node.nodeType === Node.TEXT_NODE) {
      const textNode = node as Text;
      const nodeText = textNode.textContent || "";
      const nodeLength = nodeText.length;
      const nextOffset = currentOffset + nodeLength;
      
      if (nextOffset <= offset) {
        // Toàn bộ node nằm trước offset - move sang span mới
        movedNodes.push(node);
        currentOffset = nextOffset;
        node = node.nextSibling;
      } else {
        // Cần tách node
        const splitOffset = offset - currentOffset;
        const afterNode = textNode.splitText(splitOffset);
        movedNodes.push(textNode);
        break;
      }
    } else {
      // Với non-text nodes, tính dựa trên text content
      const nodeText = (node.textContent || "").length;
      if (currentOffset + nodeText <= offset) {
        movedNodes.push(node);
        currentOffset += nodeText;
        node = node.nextSibling;
      } else {
        break;
      }
    }
  }
  
  if (movedNodes.length > 0) {
    const newSpan = document.createElement("span");
    newSpan.className = "highlighted-text";
    newSpan.style.backgroundColor = color || "transparent";
    movedNodes.forEach((node) => {
      span.removeChild(node);
      newSpan.appendChild(node);
    });
    if (insertBefore) {
      parent.insertBefore(newSpan, insertBefore);
    } else {
      parent.appendChild(newSpan);
    }
  }
  
  return movedNodes;
}

/**
 * Xử lý overlapping highlights: tách các spans cũ thành các phần không overlap
 * và unwrap phần overlap để có thể tạo highlight mới
 */
export function unwrapHighlightsInRange(
  range: Range,
  container: HTMLElement
): void {
  // Tìm tất cả highlighted spans
  const allHighlightedSpans = Array.from(
    container.querySelectorAll(".highlighted-text")
  ) as HTMLSpanElement[];

  // Lọc các spans có overlap với range
  const overlappingSpans: HTMLSpanElement[] = [];

  allHighlightedSpans.forEach((span) => {
    try {
      const spanRange = document.createRange();
      spanRange.selectNodeContents(span);

      // Kiểm tra overlap
      const startComparison = range.compareBoundaryPoints(
        Range.START_TO_START,
        spanRange
      );
      const endComparison = range.compareBoundaryPoints(
        Range.END_TO_END,
        spanRange
      );

      // Overlap nếu: range mới bắt đầu trước khi span kết thúc VÀ range mới kết thúc sau khi span bắt đầu
      const hasOverlap =
        startComparison < 0
          ? endComparison > 0
          : startComparison <= 0 && endComparison >= 0;

      if (hasOverlap) {
        overlappingSpans.push(span);
      }
    } catch (e) {
      // Bỏ qua nếu có lỗi
    }
  });

  // Xử lý từng overlapping span: tách thành các phần không overlap
  // Xử lý từ cuối lên đầu để tránh ảnh hưởng đến các range khác
  overlappingSpans.reverse().forEach((span) => {
    const parent = span.parentNode;
    if (!parent) return;

    try {
      const spanRange = document.createRange();
      spanRange.selectNodeContents(span);
      const oldColor = span.style.backgroundColor;

      // So sánh với range để xác định các phần cần tách
      const spanStartsBeforeRange =
        spanRange.compareBoundaryPoints(Range.START_TO_START, range) < 0;
      const spanEndsAfterRange =
        spanRange.compareBoundaryPoints(Range.END_TO_END, range) > 0;

      // Clone range để tránh ảnh hưởng đến range gốc
      const rangeClone = range.cloneRange();
      
      // Lưu text content và offsets trước khi thay đổi DOM
      const spanText = span.textContent || "";
      const spanStartOffset = getTextContentBefore(span, container);
      const spanEndOffset = spanStartOffset + spanText.length;
      const rangeStartOffset = getTextOffset(rangeClone.startContainer, rangeClone.startOffset, container);
      const rangeEndOffset = getTextOffset(rangeClone.endContainer, rangeClone.endOffset, container);
      
      // Tính các phần cần tách
      const beforeStart = spanStartOffset;
      const beforeEnd = Math.min(spanEndOffset, rangeStartOffset);
      const afterStart = Math.max(spanStartOffset, rangeEndOffset);
      const afterEnd = spanEndOffset;
      
      // Unwrap toàn bộ span trước
      const nextSibling = span.nextSibling;
      while (span.firstChild) {
        parent.insertBefore(span.firstChild, span);
      }
      parent.removeChild(span);
      
      // Tạo lại spans dựa trên text content đã unwrap
      if (spanStartsBeforeRange && spanEndsAfterRange) {
        // Span bao bọc range - tách thành 3 phần: trước, overlap (unwrap), sau
        // Phần trước
        if (beforeEnd > beforeStart) {
          createSpanFromTextOffset(container, beforeStart, beforeEnd, oldColor, nextSibling);
        }
        
        // Phần sau
        if (afterEnd > afterStart) {
          createSpanFromTextOffset(container, afterStart, afterEnd, oldColor, nextSibling);
        }
        // Phần overlap đã được unwrap ở trên
      } else if (spanStartsBeforeRange) {
        // Span bắt đầu trước range - tách phần trước
        if (beforeEnd > beforeStart) {
          createSpanFromTextOffset(container, beforeStart, beforeEnd, oldColor, nextSibling);
        }
        // Phần overlap đã được unwrap
      } else if (spanEndsAfterRange) {
        // Span kết thúc sau range - tách phần sau
        if (afterEnd > afterStart) {
          createSpanFromTextOffset(container, afterStart, afterEnd, oldColor, nextSibling);
        }
        // Phần overlap đã được unwrap
      }
      // Nếu range bao bọc span hoàn toàn, span đã được unwrap ở trên
    } catch (e) {
      // Nếu có lỗi, unwrap toàn bộ
      try {
        while (span.firstChild) {
          span.parentNode?.insertBefore(span.firstChild, span);
        }
        span.parentNode?.removeChild(span);
      } catch (e2) {
        // Bỏ qua nếu vẫn có lỗi
      }
    }
  });
}

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
