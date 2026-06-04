import { readdirSync, readFileSync } from "node:fs";

import { it, describe, expect } from "vitest";

import { rebuild } from "@/Rebuild";

const path = "tests/fixtures";

describe("service Rebuild", () => {
  const tests = readdirSync(path, { withFileTypes: true })
    .filter((file) => file.name.endsWith(".uasset") && file.isFile())
    .map((file) => file.name);

  it.each(tests)("rebuild(%j)", (file) => {
    const source = readFileSync(`${path}/${file}`);
    const sourceRebuilded = rebuild(source, new Map());

    expect(sourceRebuilded.toString("hex")).toStrictEqual(source.toString("hex"));
  });
});
