/* eslint-disable react/display-name */
import React, { useEffect, useState, useRef } from "react";
import "./HighlightText.scss";

export interface HighlightTextProps {
  children: string;
  colors?: string[];
}

interface Offset {
  start: number;
  end: number;
}

interface Meta {
  color?: string;
  offset: Offset;
}

const HighlightText = ({
  children,
  colors = ["#1D90FF", "#33CD32", "#DA70D6"],
}: HighlightTextProps) => {
  const [showPopover, setShowPopover] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const highlight = useRef<HTMLDivElement | null>(null);
  const savedBounding = useRef({ x: 0, y: 0, width: 0 });
  const [selectedText, setSelectedText] = useState<Meta[]>([]);
  const selectionRangeRef = useRef<Offset>();

  useEffect(() => {
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  function hidePopover() {
    setShowPopover(false);
  }
  function getSelectionOffset(selection: Selection, range: Range) {
    let startOffset = 0,
      endOffset = 0;
    let foundStart = false,
      foundEnd = false;
    let start = range.startOffset;
    let end = range.endOffset;

    const noSelection =
      range.startContainer === range.endContainer &&
      range.startOffset === range.endOffset;
    if (
      selection.focusNode?.parentNode?.parentNode?.nodeName === "SPAN" &&
      selection.focusNode?.parentNode?.parentNode?.hasChildNodes() &&
      selection.focusNode?.parentNode?.parentNode?.childNodes.length > 1 &&
      !noSelection
    ) {
      for (
        let i = 0;
        selection.focusNode?.parentNode?.parentNode.childNodes.length > i;
        i++
      ) {
        const cNode: ChildNode =
          selection.focusNode?.parentNode?.parentNode?.childNodes[i];

        if (cNode.textContent === "") break;
        if (
          !cNode ||
          cNode.isEqualNode(selection.focusNode?.parentNode?.parentNode)
        )
          break;
        if (!range.startContainer.parentNode || !cNode.textContent) return;
        if (
          !cNode?.isEqualNode(range.startContainer.parentNode) &&
          !foundStart
        ) {
          startOffset += cNode.textContent.length;
        } else {
          foundStart = true;
        }

        if (!cNode?.isEqualNode(range.endContainer.parentNode) && !foundEnd) {
          endOffset += cNode.textContent.length;
        } else {
          foundEnd = true;
        }
      }
    }

    start = start + startOffset;
    end = end + endOffset;

    return { start, end };
  }
  function onMouseUp(e: MouseEvent) {
    const selection = window.getSelection();
    if (!selection) return;
    const selectedText = selection.toString().trim();

    if (!selectedText) {
      setShowPopover(false);
      return;
    }
    const selectionRange = selection.getRangeAt(0);
    selectionRangeRef.current = getSelectionOffset(selection, selectionRange);
    // console.log(
    //   "🚀 ~ file: HighlightText.tsx:103 ~ onMouseUp ~ selectionRangeRef.current:",
    //   selectionRangeRef.current
    // );

    const startNode = selectionRange.startContainer.parentNode;
    const endNode = selectionRange.endContainer.parentNode;

    if (!startNode || !endNode) {
      return;
    }

    if (!highlight.current) return;
    const highlightableRegion = highlight.current.querySelector(".h-popable");

    if (highlightableRegion) {
      if (
        !highlightableRegion.contains(startNode) ||
        !highlightableRegion.contains(endNode)
      ) {
        hidePopover();
        return;
      }
    } else if (
      !highlight.current.contains(startNode) ||
      !highlight.current.contains(endNode)
    ) {
      hidePopover();
      return;
    }

    // if (!startNode.isSameNode(endNode)) {
    //   hidePopover();
    //   return;
    // }

    const { x, y, width } = selectionRange.getBoundingClientRect();

    if (
      x === savedBounding.current.x &&
      y === savedBounding.current.y &&
      width === savedBounding.current.width
    ) {
      return;
    }
    savedBounding.current = { x, y, width };
    if (!width) {
      hidePopover();
      return;
    }

    // setPos({ x: x + width / 2, y: y + window.scrollY - 10 });
    setPos({ x: e.clientX, y: y + window.scrollY - 10 });
    setShowPopover(true);
  }

  const onClickColor = (color?: string) => () => {
    if (!selectionRangeRef.current) return;
    const newItem = {
      color,
      offset: selectionRangeRef.current,
    };

    const output = addToSelectedText(selectedText, newItem);
    setSelectedText(output.filter((o) => o.color !== undefined));
    // console.log(
    //   "🚀 ~ file: HighlightText.tsx:175 ~ onClickColor ~ output:",
    //   output
    // );
  };

  const renderColor = (color?: string, index?: number) => {
    return color ? (
      <div
        key={color}
        style={{
          backgroundColor: color,
          width: 40,
          height: 40,
          pointerEvents: "auto",
          cursor: "pointer",
        }}
        onClick={onClickColor(color)}
      />
    ) : (
      <div
        key={index}
        style={{
          backgroundColor: "white",
          width: 40,
          height: 40,
          pointerEvents: "auto",
          cursor: "pointer",
          overflow: "hidden",
        }}
        onClick={onClickColor(color)}
      >
        <div
          style={{
            width: 40,
            height: 4,
            backgroundColor: "red",
          }}
          className="clearButton"
        />
      </div>
    );
  };

  const renderText = (meta: Meta, index: number) => {
    const firstPart = children.slice(meta.offset.start, meta.offset.end);
    const secondPartEndOffset =
      selectedText.length - 1 === index
        ? children.length
        : selectedText[index + 1].offset.start;
    const secondPart = children.slice(meta.offset.end, secondPartEndOffset);
    return (
      <>
        <span style={{ backgroundColor: meta.color }}>{firstPart}</span>
        {secondPart ? <span>{secondPart}</span> : null}
      </>
    );
  };

  return (
    <div ref={highlight}>
      {showPopover && (
        <div
          className="h-popover"
          style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
          role="presentation"
          onMouseDown={(e) => e.preventDefault()}
        >
          <span role="button" className={"h-popover-item"}>
            {colors?.map(renderColor)}
            {renderColor()}
          </span>
        </div>
      )}
      <span>
        {selectedText.length === 0 ? (
          children
        ) : (
          <>
            <span>{children.slice(0, selectedText[0].offset.start)}</span>
            {selectedText.map(renderText)}
          </>
        )}
      </span>
    </div>
  );
};

export default HighlightText;

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
  const log = false;
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
