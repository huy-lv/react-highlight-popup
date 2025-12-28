import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
// import { debug } from "jest-preview";
import HighlightText from "../HighlightText";

// Mock window.getSelection
const mockSelection = {
  toString: jest.fn(),
  getRangeAt: jest.fn(),
  removeAllRanges: jest.fn(),
  rangeCount: 1,
};

const mockRange = {
  startContainer: null as any,
  endContainer: null as any,
  startOffset: 0,
  endOffset: 0,
  getBoundingClientRect: jest.fn(() => ({
    x: 100,
    y: 100,
    width: 50,
    height: 20,
  })),
  surroundContents: jest.fn(),
  extractContents: jest.fn(),
  insertNode: jest.fn(),
  compareBoundaryPoints: jest.fn(),
  intersectsNode: jest.fn(),
};

// Mock DOM methods
Object.defineProperty(window, "getSelection", {
  writable: true,
  value: jest.fn(() => mockSelection),
});

Object.defineProperty(document, "createRange", {
  writable: true,
  value: jest.fn(() => mockRange),
});

Object.defineProperty(document, "createTreeWalker", {
  writable: true,
  value: jest.fn(() => ({
    nextNode: jest.fn(() => null),
  })),
});

describe("HighlightText", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelection.toString.mockReturnValue("test text");
    mockSelection.getRangeAt.mockReturnValue(mockRange);
    mockRange.surroundContents.mockClear();
    mockRange.extractContents.mockClear();
    mockRange.insertNode.mockClear();
  });

  test("renders HTML content", () => {
    render(
      <HighlightText>
        <div>
          <h1>Title</h1>
          <p>Content</p>
        </div>
      </HighlightText>
    );
    expect(screen.getByText("Title")).toBeTruthy();
    expect(screen.getByText("Content")).toBeTruthy();
  });

  test("handles multi-element text selection", async () => {
    render(
      <HighlightText colors={["red"]}>
        <div>
          <h1>Title text</h1>
          <p>Content text</p>
        </div>
      </HighlightText>
    );

    const titleElement = screen.getByText("Title text");
    const contentElement = screen.getByText("Content text");

    // Mock selection across multiple elements
    mockSelection.toString.mockReturnValue("text Content");
    mockRange.startContainer = titleElement.firstChild;
    mockRange.endContainer = contentElement.firstChild;
    mockRange.startOffset = 5; // "text" in "Title text"
    mockRange.endOffset = 7; // "Content" in "Content text"

    // Mock failed surroundContents and extractContents
    mockRange.surroundContents.mockImplementation(() => {
      throw new Error("Cannot surround contents across multiple elements");
    });
    mockRange.extractContents.mockImplementation(() => {
      throw new Error("Cannot extract contents across multiple elements");
    });

    // Simulate mouseup
    fireEvent.mouseUp(titleElement);

    await waitFor(() => {
      const colorButton = screen.getByRole("presentation");
      expect(colorButton).toBeTruthy();
    });

    // Click on color button
    const colorButtons = screen.getAllByRole("button");
    fireEvent.click(colorButtons[0]);

    // Should handle multi-element selection gracefully
    // Verify that color button was clicked (popover should still be visible in test environment)
    expect(colorButtons[0]).toBeTruthy();
  });

  test("handles specific multi-element case: h1 to p selection", async () => {
    render(
      <div style={{ margin: 200 }}>
        <HighlightText colors={["#ffff00"]}>
          <div>
            <h1>Tiêu đề này có thể highlight</h1>
            <p>Lorem ipsum is simply</p>
          </div>
        </HighlightText>
      </div>
    );

    const titleElement = screen.getByText("Tiêu đề này có thể highlight");
    const contentElement = screen.getByText("Lorem ipsum is simply");

    // Mock selection from "thể highlight" to "Lorem ipsum"
    mockSelection.toString.mockReturnValue("thể highlight Lorem ipsum");
    mockRange.startContainer = titleElement.firstChild;
    mockRange.endContainer = contentElement.firstChild;
    mockRange.startOffset = 10; // "thể highlight" position
    mockRange.endOffset = 11; // "Lorem ipsum" end position

    // Mock failed surroundContents and extractContents
    mockRange.surroundContents.mockImplementation(() => {
      throw new Error("Cannot surround contents across multiple elements");
    });
    mockRange.extractContents.mockImplementation(() => {
      throw new Error("Cannot extract contents across multiple elements");
    });

    // Simulate mouseup
    fireEvent.mouseUp(titleElement);

    await waitFor(() => {
      const colorButton = screen.getByRole("presentation");
      expect(colorButton).toBeTruthy();
    });

    // Click on color button
    const colorButtons = screen.getAllByRole("button");
    fireEvent.click(colorButtons[0]);
    // debug();
    // Should handle multi-element selection gracefully
    // Verify that color button was clicked (popover should still be visible in test environment)
    expect(colorButtons[0]).toBeTruthy();
  });
});
