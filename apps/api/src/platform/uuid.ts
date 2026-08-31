export function criarUuidV7(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  const agora = BigInt(Date.now());
  bytes[0] = Number((agora >> 40n) & 0xffn);
  bytes[1] = Number((agora >> 32n) & 0xffn);
  bytes[2] = Number((agora >> 24n) & 0xffn);
  bytes[3] = Number((agora >> 16n) & 0xffn);
  bytes[4] = Number((agora >> 8n) & 0xffn);
  bytes[5] = Number(agora & 0xffn);

  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x70;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;

  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
