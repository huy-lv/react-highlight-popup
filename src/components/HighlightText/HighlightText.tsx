/* eslint-disable react/display-name */
import React, { useEffect, useState, useRef } from "react";
import "./HighlightText.scss";
import { Meta, Offset } from "../../types/Meta";
import { addToSelectedText } from "./utils";

export interface HighlightTextProps {
  children: string;
  colors?: string[];
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
