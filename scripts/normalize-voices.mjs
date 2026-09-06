import { readFileSync, writeFileSync } from 'node:fs';

// Normalise the original PCM16 voice files for small phone speakers without
// changing their duration or adding a runtime dependency.
for (let index = 1; index <= 47; index += 1) {
  const code = String(index).padStart(2, '0');
  const path = `assets/sounds/voices/${code}.wav`;
  const wav = readFileSync(path);
  let offset = 12; let dataOffset = -1; let dataLength = 0; let pcm16 = false;
  while (offset + 8 <= wav.length) {
    const id = wav.toString('ascii', offset, offset + 4);
    const length = wav.readUInt32LE(offset + 4);
    if (id === 'fmt ') pcm16 = wav.readUInt16LE(offset + 8) === 1 && wav.readUInt16LE(offset + 22) === 16;
    if (id === 'data') { dataOffset = offset + 8; dataLength = Math.min(length, wav.length - dataOffset); break; }
    offset += 8 + length + (length % 2);
  }
  if (!pcm16 || dataOffset < 0) throw new Error(`${path} is not PCM16 WAV`);
  let peak = 0; let sum = 0; let samples = 0;
  for (let byte = dataOffset; byte + 1 < dataOffset + dataLength; byte += 2) {
    const value = wav.readInt16LE(byte) / 32768;
    peak = Math.max(peak, Math.abs(value)); sum += value * value; samples += 1;
  }
  const rms = Math.sqrt(sum / Math.max(1, samples));
  const gain = Math.max(1, Math.min(.96 / Math.max(.0001, peak), .13 / Math.max(.0001, rms)));
  for (let byte = dataOffset; byte + 1 < dataOffset + dataLength; byte += 2) {
    const value = Math.max(-32768, Math.min(32767, Math.round(wav.readInt16LE(byte) * gain)));
    wav.writeInt16LE(value, byte);
  }
  writeFileSync(path, wav);
  console.log(`${code}: ${gain.toFixed(2)}x`);
}
