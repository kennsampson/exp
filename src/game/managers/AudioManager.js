const MUSIC_KEY = "bgm";

const STORAGE_KEYS = {
  music: "exp:musicMuted",
  sfx: "exp:sfxMuted",
};

// Thin wrapper around Phaser's sound manager. `scene.sound` is the single
// SoundManager shared by the whole Game instance, so any scene can create
// one of these and stay in sync with music/sfx started from another scene --
// there's no need for a separate singleton.
export default class AudioManager {
  constructor(scene) {
    this.sound = scene.sound;
  }

  get musicMuted() {
    return localStorage.getItem(STORAGE_KEYS.music) === "true";
  }

  get sfxMuted() {
    return localStorage.getItem(STORAGE_KEYS.sfx) === "true";
  }

  playMusic(key = MUSIC_KEY, config = {}) {
    let music = this.sound.get(key);
    if (!music) {
      music = this.sound.add(key, { loop: true, volume: 0.4, ...config });
    }
    music.setMute(this.musicMuted);
    if (!music.isPlaying) music.play();
  }

  playSfx(key, config = {}) {
    if (this.sfxMuted) return;
    this.sound.play(key, { volume: 0.6, ...config });
  }

  // Synthesized effects -- short oscillator notes so the typewriter voices
  // and jingles don't need their own audio files. Web Audio only; on the
  // HTML5 audio fallback these quietly do nothing.
  tone(freq, { start = 0, duration = 0.05, volume = 0.05, type = "square" } = {}) {
    const ctx = this.sound.context;
    if (!ctx || this.sfxMuted) return;
    const t = ctx.currentTime + start;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + duration);
  }

  /** One syllable of a character's "voice" while their text types out. */
  blip(pitch = 260) {
    this.tone(pitch * (0.92 + Math.random() * 0.16), {
      duration: 0.045,
      volume: 0.035,
    });
  }

  /** Rising arpeggio for finding a story. */
  jingle() {
    [523, 659, 784, 1047].forEach((freq, i) =>
      this.tone(freq, { start: i * 0.08, duration: 0.14, volume: 0.05 }),
    );
  }

  setMusicMuted(muted) {
    localStorage.setItem(STORAGE_KEYS.music, String(muted));
    this.sound.get(MUSIC_KEY)?.setMute(muted);
  }

  setSfxMuted(muted) {
    localStorage.setItem(STORAGE_KEYS.sfx, String(muted));
  }

  toggleMusicMuted() {
    const next = !this.musicMuted;
    this.setMusicMuted(next);
    return next;
  }

  toggleSfxMuted() {
    const next = !this.sfxMuted;
    this.setSfxMuted(next);
    return next;
  }
}
