import { describe, it, expect } from 'vitest';
import { LEVELS, getLevel } from './levels';

describe('LEVELS', () => {
  it('all levels have unique ids', () => {
    const ids = Object.values(LEVELS).map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('each level has minSpeed less than initialSpeed', () => {
    for (const level of Object.values(LEVELS)) {
      expect(level.minSpeed).toBeLessThan(level.initialSpeed);
    }
  });

  it('easy level has wallBehavior wrap', () => {
    expect(LEVELS.easy.wallBehavior).toBe('wrap');
  });

  it('medium level has wallBehavior die', () => {
    expect(LEVELS.medium.wallBehavior).toBe('die');
  });

  it('hard level has wallBehavior die', () => {
    expect(LEVELS.hard.wallBehavior).toBe('die');
  });

  it('hard level has at least one extraWall', () => {
    expect(LEVELS.hard.extraWalls.length).toBeGreaterThan(0);
  });

  it('easy level has no extraWalls', () => {
    expect(LEVELS.easy.extraWalls.length).toBe(0);
  });

  it('medium level has no extraWalls', () => {
    expect(LEVELS.medium.extraWalls.length).toBe(0);
  });
});

describe('getLevel', () => {
  it('returns correct config for known id', () => {
    const level = getLevel('easy');
    expect(level.id).toBe('easy');
    expect(level.wallBehavior).toBe('wrap');
  });

  it('throws for unknown id', () => {
    expect(() => getLevel('nonexistent')).toThrow('Unknown level: nonexistent');
  });
});
