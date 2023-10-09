import React from "react";
import { render } from "@testing-library/react";
import HighlightText from "../HighlightText";

describe("HighlightText", () => {
  test("renders the HighlightText component", () => {
    render(<HighlightText>Hello world!</HighlightText>);
  });
});
