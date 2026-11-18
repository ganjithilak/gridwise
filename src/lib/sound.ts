import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

export type Sound = 'correct' | 'wrong' | 'complete';

/** Made by scripts/make-sounds.js. Run it again to change them. */
const FILES: Record<Sound, number> = {
  correct: require('../../assets/sounds/correct.wav'),
  wrong: require('../../assets/sounds/wrong.wav'),
  complete: require('../../assets/sounds/complete.wav'),
};

const players: Partial<Record<Sound, AudioPlayer>> = {};

/**
 * Plays one of the app's short sounds. A sound is never worth an error message, so if
 * the phone refuses (silent mode, no audio on this device) nothing happens at all.
 */
export function play(sound: Sound): void {
  try {
    const player = (players[sound] ??= createAudioPlayer(FILES[sound]));
    // Back to the start first, so a second right answer straight after the first is heard too.
    void Promise.resolve(player.seekTo(0)).catch(() => {});
    player.play();
  } catch {
    // No sound on this device.
  }
}
