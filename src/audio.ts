import type { PowerUpType } from './types';

const MUTE_KEY = 'snake-mute';

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

export function isMuted(): boolean {
  return localStorage.getItem(MUTE_KEY) === 'true';
}

export function setMuted(muted: boolean): void {
  localStorage.setItem(MUTE_KEY, muted ? 'true' : 'false');
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  gain = 0.15,
  delay = 0,
): void {
  if (isMuted()) return;
  try {
    const ctx = getCtx();
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = type;
    gainNode.gain.setValueAtTime(gain, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  } catch {
    // AudioContext unavailable (e.g., in tests)
  }
}

export function playEat(): void {
  playTone(880, 0.08, 'square', 0.1);
}

function playSpeedBoost(): void {
  playTone(600, 0.055, 'square', 0.13, 0);
  playTone(750, 0.055, 'square', 0.13, 0.06);
  playTone(900, 0.055, 'square', 0.13, 0.12);
}

function playSlowDown(): void {
  if (isMuted()) return;
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.frequency.setValueAtTime(460, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.5);
    osc.type = 'sine';
    gainNode.gain.setValueAtTime(0.13, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.start(now);
    osc.stop(now + 0.5);
  } catch {
    // AudioContext unavailable
  }
}

function playScoreMultiplier(): void {
  playTone(523, 0.1, 'sine', 0.13, 0);
  playTone(784, 0.1, 'sine', 0.13, 0.11);
}

function playShrink(): void {
  if (isMuted()) return;
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.frequency.setValueAtTime(1100, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.2);
    osc.type = 'sawtooth';
    gainNode.gain.setValueAtTime(0.13, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.start(now);
    osc.stop(now + 0.2);
  } catch {
    // AudioContext unavailable
  }
}

function playGhostMode(): void {
  playTone(440, 0.65, 'sine', 0.1, 0);
  playTone(447, 0.65, 'sine', 0.1, 0.03);
  playTone(434, 0.65, 'sine', 0.1, 0.06);
}

export function playPowerup(type: PowerUpType): void {
  switch (type) {
    case 'speed_boost': playSpeedBoost(); break;
    case 'slow_down': playSlowDown(); break;
    case 'score_multiplier': playScoreMultiplier(); break;
    case 'shrink': playShrink(); break;
    case 'ghost_mode': playGhostMode(); break;
  }
}

export function playDie(): void {
  if (isMuted()) return;
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.5);
    osc.type = 'sawtooth';
    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.start(now);
    osc.stop(now + 0.5);
  } catch {
    // AudioContext unavailable
  }
}
