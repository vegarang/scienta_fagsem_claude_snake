import type { Direction } from './types';

const KEY_MAP: Record<string, Direction> = {
  ArrowUp: 'UP',
  ArrowDown: 'DOWN',
  ArrowLeft: 'LEFT',
  ArrowRight: 'RIGHT',
  w: 'UP',
  s: 'DOWN',
  a: 'LEFT',
  d: 'RIGHT',
};

const PREVENT_DEFAULTS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ']);

export function keyToDirection(key: string): Direction | null {
  return KEY_MAP[key] ?? null;
}

export function shouldPreventDefault(key: string): boolean {
  return PREVENT_DEFAULTS.has(key);
}
