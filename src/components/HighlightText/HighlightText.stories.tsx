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
      <HighlightText colors={["red", "green", "blue"]}>
        Lorem Ipsum is simply dummy text of the printing and typesetting
        industry. Lorem Ipsum has been the industry's standard dummy text ever
        since the 1500s, when an unknown printer took a galley of type and
        scrambled it to make a type specimen book. It has survived not only five
        centuries, but also the leap into electronic typesetting, remaining
        essentially unchanged. It was popularised in the 1960s with the release
        of Letraset sheets containing Lorem Ipsum passages, and more recently
        with desktop publishing software like Aldus PageMaker including versions
        of Lorem Ipsum.
      </HighlightText>
    </div>
  ),
};

export const Secondary: Story = {
  render: () => (
    <div style={{ marginTop: 80, marginLeft: 40 }}>
      <HighlightText colors={["#ff00ff", "#ffff00", "#00ff00"]}>
        Lorem Ipsum is simply dummy text of the printing and typesetting
        industry. Lorem Ipsum has been the industry's standard dummy text ever
        since the 1500s, when an unknown printer took a galley of type and
        scrambled it to make a type specimen book. It has survived not only five
        centuries, but also the leap into electronic typesetting, remaining
        essentially unchanged. It was popularised in the 1960s with the release
        of Letraset sheets containing Lorem Ipsum passages, and more recently
        with desktop publishing software like Aldus PageMaker including versions
        of Lorem Ipsum.
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
