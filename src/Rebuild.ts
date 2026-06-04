import { BufferBuilder } from "@triforce-heroes/triforce-core/BufferBuilder";

import { extract } from "@/Extract";
import { isAscii } from "@/services/BufferService";

export function rebuild(
  source: Buffer,
  entriesReplacements: Map<string, string>,
  containerSize?: number,
) {
  const builder = new BufferBuilder();
  const messagesBuilder = new BufferBuilder();

  const sourceMessagesOffset = source.readUInt32LE(0x04);
  const sourceSizeOffset = source.readUInt32LE(0x0_20) + 0x08;

  builder.push(source.subarray(0, sourceSizeOffset));
  builder.writeUnsignedInt32(() => messagesBuilder.length);
  builder.push(source.subarray(sourceSizeOffset + 0x04, sourceMessagesOffset));

  messagesBuilder.push(source.subarray(sourceMessagesOffset, sourceMessagesOffset + 0x0e));

  const entries = extract(source);

  for (const [entryId, entry] of entries) {
    messagesBuilder.writeUnsignedInt32(entry.id);
    messagesBuilder.writeUnsignedInt32(entry.idSub);
    messagesBuilder.push(entry.attribute);

    const entryMessage = entriesReplacements.get(entryId) ?? entry.message;
    const entryMessageIsUnicode = !isAscii(Buffer.from(entryMessage));

    if (entryMessageIsUnicode) {
      messagesBuilder.writeInt32(-entryMessage.length - 1);
      messagesBuilder.push(Buffer.from(`${entryMessage}\0`, "utf16le"));
    } else {
      messagesBuilder.writeLengthPrefixedString(`${entryMessage}\0`);
    }
  }

  builder.push(messagesBuilder.build(), source.subarray(-4));

  if (containerSize !== undefined) {
    builder.pad(containerSize);
  }

  return builder.build();
}
