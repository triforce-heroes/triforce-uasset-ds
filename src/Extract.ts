import { BufferConsumer } from "@triforce-heroes/triforce-core/BufferConsumer";

interface Entry {
  id: number;
  idSub: number;
  attribute: Buffer;
  message: string;
}

const HEADER_LENGTH = 0x44;

function readAttribute(consumer: BufferConsumer) {
  const attributeType = consumer.readUnsignedInt16();

  if (attributeType === 0x0900) {
    return consumer.back(2).read(2 + 16);
  }

  if (attributeType === 0x0980) {
    const attributeTypeSub = consumer.at();

    if (attributeTypeSub === 4) {
      return consumer.back(2).read(2 + 1 + 8);
    }

    if (attributeTypeSub === 2) {
      return consumer.back(2).read(2 + 1 + 12);
    }

    throw new Error(`Unknown attribute type: ${attributeType}:${attributeTypeSub}`);
  } else {
    throw new Error(`Unknown attribute type: ${attributeType}`);
  }
}

export function extract(data: Buffer) {
  const labelsCount = data.readUInt32LE(0x34);
  const labelsLengthOffset = HEADER_LENGTH + labelsCount * 8;
  const labelsOffset = labelsLengthOffset + labelsCount * 2;

  const labelsLengthConsumer = new BufferConsumer(data, labelsLengthOffset);
  const labelsConsumer = new BufferConsumer(data, labelsOffset);

  const labels = new Map<number, string>();

  for (let labelIndex = 0; labelIndex < labelsCount; labelIndex++) {
    const labelLengthFlag = labelsLengthConsumer.readInt8();
    const labelLength = labelsLengthConsumer.readUnsignedInt8();

    const isUnicode = labelLengthFlag === -128;

    labels.set(
      labelIndex,
      isUnicode
        ? labelsConsumer.read(labelLength * 2).toString("utf16le")
        : labelsConsumer.readString(labelLength),
    );
  }

  const messagesConsumer = new BufferConsumer(data, data.readUInt32LE(4) + 0x0a);
  const messagesCount = messagesConsumer.readUnsignedInt32();

  const entries = new Map<string, Entry>();

  for (let messageIndex = 0; messageIndex < messagesCount; messageIndex++) {
    const entryId = messagesConsumer.readUnsignedInt32();
    const entryIdSub = messagesConsumer.readUnsignedInt32();
    const entryAttribute = readAttribute(messagesConsumer);

    const entryMessageLength = messagesConsumer.readInt32();
    const entryMessageIsUnicode = entryMessageLength < 0;
    const entryMessageLengthReal = entryMessageIsUnicode
      ? entryMessageLength * -2
      : entryMessageLength;

    const entryMessage = entryMessageIsUnicode
      ? messagesConsumer.read(entryMessageLengthReal - 2).toString("utf-16le")
      : messagesConsumer.read(entryMessageLengthReal - 1).toString();

    messagesConsumer.skip(entryMessageIsUnicode ? 2 : 1);

    const labelName = labels.get(entryId)!;
    const label = `${labelName}:${entryIdSub}`;

    entries.set(label, {
      id: entryId,
      idSub: entryIdSub,
      attribute: entryAttribute,
      message: entryMessage,
    });
  }

  return entries;
}
