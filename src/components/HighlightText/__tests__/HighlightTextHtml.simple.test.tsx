import React from "react";
import { render } from "@testing-library/react";
import HighlightText from "../HighlightText";
import ReactHtmlParser from "react-html-parser";

/**
 * Helper function để test highlight sequences
 * @param inputHtml - HTML input string (e.g., '<p>12345678901234567890</p>' hoặc '12345678901234567890')
 * @param selections - Array of selections to apply in order: [{ start, end, color }, ...]
 *   - start: character index (0-based)
 *   - end: character index (exclusive)
 *   - color: background color name
 * @param expectedHtml - Expected HTML output sau khi apply highlights
 */
const testHighlightSequence = (
  inputHtml: string,
  selections: Array<{ start: number; end: number; color: string }>,
  expectedHtml: string
) => {
  const { container } = render(
    <HighlightText colors={["red", "blue", "green", "yellow", "orange"]}>
      {ReactHtmlParser(inputHtml)}
    </HighlightText>
  );

  const rootElement = container.querySelector("div");
  if (!rootElement) throw new Error("Root element not found");

  // Apply each selection in order
  for (const { start, end, color } of selections) {
    // Get all current text nodes
    const walker = document.createTreeWalker(
      rootElement,
      NodeFilter.SHOW_TEXT,
      null
    );

    let charIndex = 0;
    let selectedNode: Text | null = null;
    let nodeStartChar = 0;

    let node = walker.nextNode() as Text | null;
    while (node) {
      const len = (node.textContent || "").length;
      const nodeEndChar = charIndex + len;

      // Check if this node contains the start of selection
      if (charIndex <= start && start < nodeEndChar) {
        selectedNode = node;
        nodeStartChar = charIndex;
        break;
      }
      charIndex += len;
      node = walker.nextNode() as Text | null;
    }

    if (!selectedNode) {
      throw new Error(
        `Could not find text node for selection [${start}, ${end})`
      );
    }

    // Calculate relative indices within this node
    const relativeStart = start - nodeStartChar;
    const relativeEnd = Math.min(
      (selectedNode.textContent || "").length,
      end - nodeStartChar
    );

    // Split: at end first, then at start
    if (relativeEnd < (selectedNode.textContent || "").length) {
      selectedNode.splitText(relativeEnd);
    }
    if (relativeStart > 0) {
      selectedNode = selectedNode.splitText(relativeStart);
    }

    // Wrap with span
    const span = document.createElement("span");
    span.style.backgroundColor = color;
    span.className = "highlighted-text";
    selectedNode.parentNode?.insertBefore(span, selectedNode);
    span.appendChild(selectedNode);
  }

  // Normalize and compare HTML
  const actualHtml = rootElement.innerHTML
    .replace(/<!--.*?-->/g, "") // Remove comments
    .replace(/\s+/g, "") // Normalize whitespace
    .trim();

  const expectedNormalized = expectedHtml
    .replace(/<!--.*?-->/g, "")
    .replace(/\s+/g, "")
    .trim();

  expect(actualHtml).toBe(expectedNormalized);
};

describe("HighlightText - HTML Content Direct DOM Tests", () => {
  test("Single highlight: characters 1-5 with red", () => {
    testHighlightSequence(
      "12345678901234567890",
      [{ start: 1, end: 5, color: "red" }],
      `<span class="h-popable">
        1
        <span style="background-color: red;" class="highlighted-text">
          2345
        </span>
        678901234567890
      </span>`
    );
  });

  test("Adjacent highlights without overlap", () => {
    testHighlightSequence(
      "0123456789",
      [
        { start: 1, end: 4, color: "red" },
        { start: 4, end: 7, color: "blue" },
      ],
      `<span class="h-popable">
				0
				<span style="background-color: red;" class="highlighted-text">
					123
				</span>
				<span style="background-color: blue;" class="highlighted-text">
					456
				</span>
				789
			</span>`
    );
  });

  test("Highlight entire text", () => {
    testHighlightSequence(
      "Hello",
      [{ start: 0, end: 5, color: "red" }],
      `<span class="h-popable">
				<span style="background-color: red;" class="highlighted-text">
					Hello
				</span>
			</span>`
    );
  });

  test("Multiple non-overlapping highlights", () => {
    testHighlightSequence(
      "abcdefghij",
      [
        { start: 0, end: 2, color: "red" },
        { start: 3, end: 5, color: "blue" },
        { start: 6, end: 8, color: "green" },
      ],
      `<span class="h-popable">
				<span style="background-color: red;" class="highlighted-text">
					ab
				</span>
				c
				<span style="background-color: blue;" class="highlighted-text">
					de
				</span>
				f
				<span style="background-color: green;" class="highlighted-text">
					gh
				</span>
				ij
			</span>`
    );
  });

  test("Highlights in HTML with paragraph", () => {
    testHighlightSequence(
      "<p>Hello World</p>",
      [{ start: 0, end: 5, color: "red" }],
      `<span class="h-popable">
				<p>
					<span style="background-color: red;" class="highlighted-text">
						Hello
					</span>
				 World
				</p>
			</span>`
    );
  });

  test("Highlights spanning multiple elements", () => {
    testHighlightSequence(
      "<span>ab</span>cd",
      [{ start: 1, end: 4, color: "blue" }],
      `<span class="h-popable">
				<span>
					a
					<span style="background-color: blue;" class="highlighted-text">
					b
					</span>
				</span>
				cd
			</span>`
    );
  });

  test("Highlights single element", () => {
    testHighlightSequence(
      "<h1>0123456789001234567890</h1>",
      [
        { start: 1, end: 4, color: "blue" },
        { start: 6, end: 9, color: "red" },
      ],
      `<span class="h-popable">
				<h1>
					0
					<span style="background-color: blue;" class="highlighted-text">
						123
					</span>
					45
					<span style="background-color: red;" class="highlighted-text">
						678
					</span>
					9001234567890
				</h1>
			</span>`
    );
  });

  test("Highlights single element (2)", () => {
    testHighlightSequence(
      "<h1>12345678901234567890</h1>",
      [
        { start: 1, end: 6, color: "blue" },
        { start: 4, end: 9, color: "red" },
      ],
      `<span class="h-popable">
				<h1>
					1
					<span style="background-color: blue;" class="highlighted-text">
						234
					</span>
					<span style="background-color: red;" class="highlighted-text">
						56789
					</span>
					01234567890
				</h1>
			</span>`
    );
  });
});
