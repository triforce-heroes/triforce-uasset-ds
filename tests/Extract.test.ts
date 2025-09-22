import { readdirSync, readFileSync } from "node:fs";

import { it, describe, expect } from "vitest";

import { extract } from "@/Extract";

const path = "tests/fixtures";

describe("service Extract", () => {
  const tests = readdirSync(path, { withFileTypes: true })
    .filter((file) => file.name.endsWith(".uasset") && file.isFile())
    .map((file) => file.name);

  it.each(tests)("extract(%j)", async (file) => {
    expect.assertions(1);

    const entries = extract(readFileSync(`${path}/${file}`));

    await expect(entries).toMatchFileSnapshot(`fixtures/${file}.snap`);
  });
});
