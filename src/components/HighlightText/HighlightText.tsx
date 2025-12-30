/* eslint-disable react/display-name */
import React, { useEffect, useState, useRef } from "react";
import "./HighlightText.scss";
import { Meta, Offset } from "../../types/Meta";
import { addToSelectedText, unwrapHighlightsInRange } from "./utils";

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

  /**
   * Hàm xử lý highlight cho HTML content
   * @param selectedText - Text được user select
   * @param color - Màu nền cần apply
   *
   * Logic:
   * 1. Tìm vị trí start/end của selectedText trong full text content
   * 2. Unwrap (remove) tất cả highlights cũ trong vùng [start, end)
   * 3. Split text nodes và wrap phần được select bằng <span> có background-color
   *
   * Ví dụ: <p>12345678901234567890</p>
   *   Select "2345" (index 1-5) màu đỏ   → <p><span>1</span><span style="background-color:red">2345</span><span>678901234567890</span></p>
   *   Select "4567890123" (index 3-13) màu xanh → <p><span>1</span><span style="background-color:red">23</span><span style="background-color:blue">4567890123</span><span>456789...</span></p>
   */
  const handleHtmlHighlight = (selectedText: string, color?: string) => {
    if (!highlight.current) return;

    const popableElement = highlight.current.querySelector(".h-popable");
    if (!popableElement) return;

    const fullText = popableElement.textContent || "";
    const startIndex = fullText.indexOf(selectedText);

    if (startIndex === -1) return;

    const endIndex = startIndex + selectedText.length;

    // Bước 1: Unwrap (xóa) tất cả highlights cũ trong vùng [startIndex, endIndex)
    // Điều này giúp tránh overlap: nếu select 4-13 sau khi đã select 2-5,
    // phần 4-5 sẽ bị xóa highlight cũ rồi apply highlight mới
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      try {
        const rangeToUnwrap = selection.getRangeAt(0).cloneRange();
        unwrapHighlightsInRange(rangeToUnwrap, popableElement as HTMLElement);
      } catch (e) {
        // Ignore nếu không thể tạo range
      }
    }

    // Bước 2: Tách text nodes dựa trên character offset và wrap phần được select
    wrapTextRangeByCharIndex(
      popableElement as HTMLElement,
      startIndex,
      endIndex,
      color
    );
  };

  /**
   * Hàm tách text nodes dựa trên character index và wrap phần được select
   * @param root - Root element chứa text
   * @param startChar - Vị trí ký tự bắt đầu (0-based index)
   * @param endChar - Vị trí ký tự kết thúc (exclusive)
   * @param backgroundColor - Màu nền cần apply
   *
   * Cách hoạt động:
   * 1. Duyệt tất cả text nodes trong root
   * 2. Với mỗi text node, tính phạm vi ký tự của nó trong text chung
   * 3. Nếu text node overlap với vùng [startChar, endChar), tách và wrap
   */
  const wrapTextRangeByCharIndex = (
    root: HTMLElement,
    startChar: number,
    endChar: number,
    backgroundColor?: string
  ) => {
    // Thu thập tất cả text nodes với vị trí ký tự của chúng
    const textNodes: { node: Text; charStart: number; charEnd: number }[] = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);

    let currentCharIndex = 0;
    let node: Node | null = walker.nextNode();
    while (node) {
      const textNode = node as Text;
      const text = textNode.textContent || "";
      const textLength = text.length;

      if (textLength > 0) {
        textNodes.push({
          node: textNode,
          charStart: currentCharIndex,
          charEnd: currentCharIndex + textLength,
        });
        currentCharIndex += textLength;
      }
      node = walker.nextNode();
    }

    // Xử lý tách và wrap cho mỗi text node
    for (const entry of textNodes) {
      const { node: textNode, charStart, charEnd } = entry;

      // Tính vùng overlap giữa [startChar, endChar) và [charStart, charEnd)
      const overlapStart = Math.max(charStart, startChar);
      const overlapEnd = Math.min(charEnd, endChar);

      // Nếu không có overlap, bỏ qua
      if (overlapStart >= overlapEnd) continue;

      // Chuyển đổi char index thành offset trong text node
      const nodeStartOffset = overlapStart - charStart;
      const nodeEndOffset = overlapEnd - charStart;
      const textLength = (textNode.textContent || "").length;

      // Tách text node nếu cần
      let selectedNode: Text | null = null;

      // Nếu end không phải là cuối text node, tách để tạo phần sau
      if (nodeEndOffset < textLength) {
        textNode.splitText(nodeEndOffset);
      }

      // Nếu start không phải là đầu text node, tách để tạo phần được select
      if (nodeStartOffset > 0) {
        selectedNode = textNode.splitText(nodeStartOffset);
      } else {
        selectedNode = textNode;
      }

      // Tạo span wrapper và apply background color
      if (selectedNode && selectedNode.textContent) {
        const span = document.createElement("span");
        span.style.backgroundColor = backgroundColor || "transparent";
        span.className = "highlighted-text";
        selectedNode.parentNode?.insertBefore(span, selectedNode);
        span.appendChild(selectedNode);
      }
    }
  };

  const onClickColor = (color?: string) => () => {
    if (!selectionRangeRef.current) return;

    if (isHtmlContent) {
      const selection = window.getSelection();
      if (!selection) return;

      const selectedText = selection.toString().trim();
      if (!selectedText) return;

      // Gọi hàm xử lý HTML highlight
      handleHtmlHighlight(selectedText, color);
    } else {
      // Logic cho string content
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
