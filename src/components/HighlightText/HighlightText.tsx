/* eslint-disable react/display-name */
import React, { useEffect, useState, useRef } from "react";
import "./HighlightText.scss";
import { Meta, Offset } from "../../types/Meta";
import { addToSelectedText } from "./utils";

export interface HighlightTextProps {
  children: string | React.ReactNode;
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

  // Helper function để lấy text content từ children
  const getTextContent = (node: string | React.ReactNode): string => {
    if (typeof node === "string") {
      return node;
    }
    if (React.isValidElement(node)) {
      return node.props?.children ? getTextContent(node.props.children) : "";
    }
    if (Array.isArray(node)) {
      return node.map(getTextContent).join("");
    }
    return "";
  };

  const textContent = getTextContent(children);
  const isHtmlContent = typeof children !== "string";

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
    if (isHtmlContent) {
      // Với HTML content, tính offset dựa trên text content thực tế
      const popableElement = highlight.current?.querySelector(".h-popable");
      if (!popableElement) return { start: 0, end: 0 };

      const fullText = popableElement.textContent || "";
      const selectedText = selection.toString();

      // Tìm vị trí của selected text trong full text
      const startIndex = fullText.indexOf(selectedText);
      if (startIndex === -1) return { start: 0, end: 0 };

      return { start: startIndex, end: startIndex + selectedText.length };
    }

    // Logic cũ cho string content
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
    savedBounding.current = { x: 0, y: 0, width: 0 };
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

    if (isHtmlContent) {
      // Với HTML content, tạo highlight trực tiếp trên DOM
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const span = document.createElement("span");
      span.style.backgroundColor = color || "transparent";
      span.className = "highlighted-text";

      try {
        // Thử surround contents trước
        range.surroundContents(span);
      } catch (e) {
        // Nếu không thể surround (selection qua nhiều elements),
        // sử dụng extractContents và insertNode
        try {
          // Chỉ thử extractContents nếu selection trong cùng một element
          if (range.startContainer === range.endContainer) {
            const contents = range.extractContents();
            span.appendChild(contents);
            range.insertNode(span);
          } else {
            throw new Error("Selection across multiple elements");
          }
        } catch (extractError) {
          // Nếu không thể surround hoặc extract, tách selection thành nhiều phần riêng biệt
          const startContainer = range.startContainer;
          const endContainer = range.endContainer;
          const startOffset = range.startOffset;
          const endOffset = range.endOffset;

          // Tạo highlight cho phần đầu (start container)
          if (startContainer.nodeType === Node.TEXT_NODE) {
            const startText = startContainer as Text;
            const textLength = startText.length;
            const actualEndOffset =
              startContainer === endContainer ? endOffset : textLength;

            if (
              startOffset < actualEndOffset &&
              actualEndOffset > startOffset
            ) {
              // Tách text node: trước selection
              const beforeText = startText.splitText(startOffset);
              // Tách text node: phần được chọn
              const selectedText = beforeText.splitText(
                actualEndOffset - startOffset
              );

              // Chỉ tạo wrapper nếu có text được chọn
              if (selectedText.textContent && selectedText.textContent.trim()) {
                const wrapper = document.createElement("span");
                wrapper.style.backgroundColor = color || "transparent";
                wrapper.className = "highlighted-text";
                wrapper.appendChild(selectedText);

                startText.parentNode?.insertBefore(wrapper, beforeText);
              }
            }
          }

          // Tạo highlight cho phần cuối (end container) nếu khác start container
          if (
            startContainer !== endContainer &&
            endContainer.nodeType === Node.TEXT_NODE
          ) {
            const endText = endContainer as Text;

            if (endOffset > 0) {
              // Tách text node: phần được chọn từ đầu đến endOffset
              const selectedText = endText.splitText(endOffset);

              // Chỉ tạo wrapper nếu có text được chọn
              if (selectedText.textContent && selectedText.textContent.trim()) {
                const wrapper = document.createElement("span");
                wrapper.style.backgroundColor = color || "transparent";
                wrapper.className = "highlighted-text";
                wrapper.appendChild(selectedText);

                // Insert wrapper vào DOM
                endText.parentNode?.insertBefore(
                  wrapper,
                  selectedText.nextSibling
                );
              }
            }
          }

          // Tạo highlight cho các text nodes ở giữa (nếu có)
          if (startContainer !== endContainer) {
            // Tìm tất cả text nodes nằm giữa start và end container
            const commonAncestor = range.commonAncestorContainer;
            const walker = document.createTreeWalker(
              commonAncestor,
              NodeFilter.SHOW_TEXT,
              null
            );

            const textNodes: Text[] = [];
            let node;
            while ((node = walker.nextNode())) {
              // Chỉ lấy text nodes nằm giữa start và end container
              if (node !== startContainer && node !== endContainer) {
                // Kiểm tra xem node có nằm trong range không
                try {
                  // Tạo range cho node hiện tại
                  const nodeRange = document.createRange();
                  nodeRange.selectNode(node);

                  // Kiểm tra xem node có nằm trong selection range không
                  if (
                    range.compareBoundaryPoints(
                      Range.START_TO_START,
                      nodeRange
                    ) <= 0 &&
                    range.compareBoundaryPoints(Range.END_TO_END, nodeRange) >=
                      0
                  ) {
                    textNodes.push(node as Text);
                  }
                } catch (e) {
                  // Nếu không thể tạo range, bỏ qua
                }
              }
            }

            // Wrap các text nodes ở giữa
            textNodes.forEach((textNode) => {
              const parent = textNode.parentNode;
              if (
                parent &&
                parent.nodeType === Node.ELEMENT_NODE &&
                !(parent as Element).classList.contains("highlighted-text")
              ) {
                const wrapper = document.createElement("span");
                wrapper.style.backgroundColor = color || "transparent";
                wrapper.className = "highlighted-text";
                parent.insertBefore(wrapper, textNode);
                wrapper.appendChild(textNode);
              }
            });
          }
        }
      }

      selection.removeAllRanges();
    } else {
      // Logic cũ cho string content
      const newItem = {
        color,
        offset: selectionRangeRef.current,
      };

      const output = addToSelectedText(selectedText, newItem);
      setSelectedText(output.filter((o) => o.color !== undefined));
    }

    setShowPopover(false);
    selectionRangeRef.current = undefined;
    window.getSelection()?.removeAllRanges();
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
    const firstPart = textContent.slice(meta.offset.start, meta.offset.end);
    const secondPartEndOffset =
      selectedText.length - 1 === index
        ? textContent.length
        : selectedText[index + 1].offset.start;
    const secondPart = textContent.slice(meta.offset.end, secondPartEndOffset);
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
      <span className="h-popable">
        {isHtmlContent ? (
          // Với HTML content, render trực tiếp và để logic highlight hoạt động trên DOM
          children
        ) : selectedText.length === 0 ? (
          children
        ) : (
          <>
            {selectedText[0].offset.start !== 0 && (
              <span>{textContent.slice(0, selectedText[0].offset.start)}</span>
            )}
            {selectedText.map(renderText)}
          </>
        )}
      </span>
    </div>
  );
};

export default HighlightText;
