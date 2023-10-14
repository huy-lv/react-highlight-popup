import { Meta, StoryObj } from "@storybook/react";
import HighlightText from "./HighlightText";
import React from "react";
import { Typography } from "@mui/material";

const meta: Meta<typeof HighlightText> = {
  component: HighlightText,
};

export default meta;
type Story = StoryObj<typeof HighlightText>;

export const Primary: Story = {
  render: () => (
    <div style={{ marginTop: 80, marginLeft: 40 }}>
      <HighlightText colors={["red", "green", "blue"]}>123456789</HighlightText>
    </div>
  ),
};

export const Secondary: Story = {
  render: () => (
    <div style={{ marginTop: 80, marginLeft: 40 }}>
      <HighlightText colors={["#ff00ff", "#ffff00", "#00ff00"]}>
        123456789
      </HighlightText>
    </div>
  ),
};

export const WithCustomTypo: Story = {
  render: () => (
    <div style={{ marginTop: 80, marginLeft: 40 }}>
      <Typography>
        <HighlightText colors={["#ff00ff", "#ffff00", "#00ff00"]}>
          123456789
        </HighlightText>
      </Typography>
    </div>
  ),
};
