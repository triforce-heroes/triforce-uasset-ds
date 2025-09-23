export function isAscii(buffer: Buffer) {
  return buffer.every((byte) => byte < 0x80);
}
