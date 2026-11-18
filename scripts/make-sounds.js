/**
 * Writes the app's three sounds into assets/sounds as small WAV files:
 *
 *   node scripts/make-sounds.js
 *
 * They are plain sine tones with a soft start and a fade, made here so the app ships no
 * recordings from anywhere else. Change the notes below and run it again to retune them.
 */
const fs = require('fs');
const path = require('path');

const RATE = 22050;

/** One note: frequency in Hz, when it starts and how long it lasts, both in seconds. */
function render(notes, seconds, volume) {
  const samples = new Float32Array(Math.ceil(RATE * seconds));
  for (const { hz, at, lasts } of notes) {
    const from = Math.floor(at * RATE);
    const count = Math.floor(lasts * RATE);
    for (let i = 0; i < count && from + i < samples.length; i++) {
      const t = i / RATE;
      // A quick fade in stops the click; the long fade out makes it ring like a bell.
      const envelope = Math.min(1, t / 0.008) * Math.exp((-4.5 * t) / lasts);
      samples[from + i] += Math.sin(2 * Math.PI * hz * t) * envelope + 0.25 * Math.sin(4 * Math.PI * hz * t) * envelope;
    }
  }
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    const v = Math.max(-1, Math.min(1, samples[i] * volume));
    data.writeInt16LE(Math.round(v * 32767), i * 2);
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

const SOUNDS = {
  // Two notes going up: a small "yes".
  correct: render([{ hz: 659.25, at: 0, lasts: 0.16 }, { hz: 987.77, at: 0.09, lasts: 0.26 }], 0.4, 0.5),
  // One low, soft note. It says "not yet" without scolding.
  wrong: render([{ hz: 233.08, at: 0, lasts: 0.22 }], 0.26, 0.42),
  // Three notes climbing to a held one, for the end of a lesson.
  complete: render(
    [{ hz: 523.25, at: 0, lasts: 0.18 }, { hz: 659.25, at: 0.11, lasts: 0.18 }, { hz: 783.99, at: 0.22, lasts: 0.2 }, { hz: 1046.5, at: 0.34, lasts: 0.55 }],
    0.95,
    0.45,
  ),
};

const dir = path.join(__dirname, '..', 'assets', 'sounds');
fs.mkdirSync(dir, { recursive: true });
for (const [name, wav] of Object.entries(SOUNDS)) {
  fs.writeFileSync(path.join(dir, `${name}.wav`), wav);
  console.log(`${name}.wav  ${wav.length} bytes`);
}
