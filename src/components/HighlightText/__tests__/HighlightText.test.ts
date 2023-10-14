import { addToSelectedText } from "../utils";

test("addToSelectedText", () => {
  const input = [
    { color: "red", offset: { start: 3, end: 6 } },
    { color: "green", offset: { start: 9, end: 14 } },
  ];

  expect(
    addToSelectedText(input, {
      color: "yellow",
      offset: { start: 3, end: 6 },
    })
  ).toStrictEqual([
    { color: "yellow", offset: { start: 3, end: 6 } },
    { color: "green", offset: { start: 9, end: 14 } },
  ]);
  expect(
    addToSelectedText(input, {
      color: "yellow",
      offset: { start: 4, end: 7 },
    })
  ).toStrictEqual([
    { color: "red", offset: { start: 3, end: 4 } },
    { color: "yellow", offset: { start: 4, end: 7 } },
    { color: "green", offset: { start: 9, end: 14 } },
  ]);
  expect(
    addToSelectedText(input, {
      color: "yellow",
      offset: { start: 2, end: 4 },
    })
  ).toStrictEqual([
    { color: "yellow", offset: { start: 2, end: 4 } },
    { color: "red", offset: { start: 4, end: 6 } },
    { color: "green", offset: { start: 9, end: 14 } },
  ]);
  expect(
    addToSelectedText(input, {
      color: "yellow",
      offset: { start: 3, end: 4 },
    })
  ).toStrictEqual([
    { color: "yellow", offset: { start: 3, end: 4 } },
    { color: "red", offset: { start: 4, end: 6 } },
    { color: "green", offset: { start: 9, end: 14 } },
  ]);
  expect(
    addToSelectedText(input, {
      color: "yellow",
      offset: { start: 2, end: 7 },
    })
  ).toStrictEqual([
    { color: "yellow", offset: { start: 2, end: 7 } },
    { color: "green", offset: { start: 9, end: 14 } },
  ]);
  expect(
    addToSelectedText(input, {
      color: "yellow",
      offset: { start: 4, end: 5 },
    })
  ).toStrictEqual([
    { color: "red", offset: { start: 3, end: 4 } },
    { color: "yellow", offset: { start: 4, end: 5 } },
    { color: "red", offset: { start: 5, end: 6 } },
    { color: "green", offset: { start: 9, end: 14 } },
  ]);
  expect(
    addToSelectedText(input, {
      color: "yellow",
      offset: { start: 2, end: 15 },
    })
  ).toStrictEqual([{ color: "yellow", offset: { start: 2, end: 15 } }]);
  expect(
    addToSelectedText(input, {
      color: "yellow",
      offset: { start: 4, end: 10 },
    })
  ).toStrictEqual([
    { color: "red", offset: { start: 3, end: 4 } },
    { color: "yellow", offset: { start: 4, end: 10 } },
    { color: "green", offset: { start: 10, end: 14 } },
  ]);
});

test("addToSelectedText 2", () => {
  expect(
    addToSelectedText(
      [
        { color: "red", offset: { start: 3, end: 4 } },
        { color: "green", offset: { start: 4, end: 5 } },
        { color: "red", offset: { start: 5, end: 6 } },
      ],
      {
        color: "yellow",
        offset: { start: 5, end: 6 },
      }
    )
  ).toStrictEqual([
    { color: "red", offset: { start: 3, end: 4 } },
    { color: "green", offset: { start: 4, end: 5 } },
    { color: "yellow", offset: { start: 5, end: 6 } },
  ]);
});

test("addToSelectedText 3", () => {
  expect(
    addToSelectedText(
      [
        { color: "red", offset: { start: 3, end: 4 } },
        { color: "green", offset: { start: 4, end: 5 } },
        { color: "blue", offset: { start: 5, end: 7 } },
      ],
      {
        color: "yellow",
        offset: { start: 3, end: 6 },
      }
    )
  ).toStrictEqual([
    { color: "yellow", offset: { start: 3, end: 6 } },
    { color: "blue", offset: { start: 6, end: 7 } },
  ]);
});
