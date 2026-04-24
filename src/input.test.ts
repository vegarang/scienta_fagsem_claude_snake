import { describe, it, expect } from 'vitest';
import { keyToDirection, shouldPreventDefault } from './input';

describe('keyToDirection', () => {
  it('maps arrow keys to directions', () => {
    expect(keyToDirection('ArrowUp')).toBe('UP');
    expect(keyToDirection('ArrowDown')).toBe('DOWN');
    expect(keyToDirection('ArrowLeft')).toBe('LEFT');
    expect(keyToDirection('ArrowRight')).toBe('RIGHT');
  });

  it('maps WASD keys to directions', () => {
    expect(keyToDirection('w')).toBe('UP');
    expect(keyToDirection('s')).toBe('DOWN');
    expect(keyToDirection('a')).toBe('LEFT');
    expect(keyToDirection('d')).toBe('RIGHT');
  });

  it('returns null for unmapped keys', () => {
    expect(keyToDirection('Enter')).toBeNull();
    expect(keyToDirection(' ')).toBeNull();
    expect(keyToDirection('Escape')).toBeNull();
    expect(keyToDirection('q')).toBeNull();
    expect(keyToDirection('W')).toBeNull();
  });
});

describe('shouldPreventDefault', () => {
  it('returns true for arrow keys', () => {
    expect(shouldPreventDefault('ArrowUp')).toBe(true);
    expect(shouldPreventDefault('ArrowDown')).toBe(true);
    expect(shouldPreventDefault('ArrowLeft')).toBe(true);
    expect(shouldPreventDefault('ArrowRight')).toBe(true);
  });

  it('returns true for space', () => {
    expect(shouldPreventDefault(' ')).toBe(true);
  });

  it('returns false for other keys', () => {
    expect(shouldPreventDefault('Enter')).toBe(false);
    expect(shouldPreventDefault('w')).toBe(false);
    expect(shouldPreventDefault('a')).toBe(false);
    expect(shouldPreventDefault('Escape')).toBe(false);
    expect(shouldPreventDefault('Tab')).toBe(false);
  });
});
