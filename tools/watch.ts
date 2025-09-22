import { readFileSync, writeFileSync } from "node:fs";

import { chunk } from "@triforce-heroes/triforce-core/Array";
import { generateQuery } from "@triforce-heroes/triforce-publisher";

import { extract } from "@/Extract";

const languages = new Map([
  ["en_US", "en"],
  ["es_ES", "es"],
  ["fr_FR", "fr"],
  ["it_IT", "it"],
  ["de_DE", "de"],
  ["ja_JP", "jp"],
  ["zh_CN", "zh-CN"],
  ["zh_TW", "zh-TW"],
]);

const entries = new Map<string, Map<string, Set<string>>>();
const letters = new Set<number>();

for (const [languagePath, language] of languages) {
  const sourceEntries = extract(
    readFileSync(`tests/fixtures/messageData_${languagePath}.uasset`),
  );

  for (const [entryId, entry] of sourceEntries) {
    if (!entries.has(entryId)) {
      entries.set(entryId, new Map());
    }

    const entryMessages = entries.get(entryId)!;

    if (!entryMessages.has(entry.message)) {
      entryMessages.set(entry.message, new Set());

      for (const letter of entry.message) {
        letters.add(letter.codePointAt(0)!);
      }
    }

    entryMessages.get(entry.message)!.add(language);
  }
}

const processedEntries = [...entries.entries()].map(([reference, entry]) => ({
  reference: String(reference),
  sources: Object.fromEntries(
    [...entry.entries()].map(([message, messageLanguages]) => [
      message,
      [...messageLanguages],
    ]),
  ),
}));

writeFileSync("entries.json", JSON.stringify(processedEntries, null, "\t"));

writeFileSync(
  "letters.json",
  JSON.stringify(
    [...letters].sort((letterA, letterB) => letterA - letterB),
    null,
    "\t",
  ),
);

writeFileSync(
  "uniques.json",
  JSON.stringify(
    [...new Set([...entries.values()].flatMap((entry) => [...entry.keys()]))],
    null,
    "\t",
  ),
);

const chunkEntries = chunk(processedEntries, 100);
const chunkDate = Date.now();

writeFileSync(
  "query.sql",

  chunkEntries
    .map((partialEntries) => generateQuery(3, partialEntries, chunkDate)!)
    .join(";\n\n"),
);
