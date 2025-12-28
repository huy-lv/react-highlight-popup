import "@testing-library/jest-dom";
import { jestPreviewConfigure } from "jest-preview";

// Import CSS files for jest-preview
import "./components/HighlightText/HighlightText.scss";

// Configure jest-preview with automatic mode
jestPreviewConfigure({ autoPreview: true });

// Extend Jest matchers
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
    }
  }
}
