import { describe, it, expect } from 'vitest';
import { getSize, SIZES } from './sizes';

describe('getSize', () => {
  it('returns the correct config for small', () => {
    expect(getSize('small')).toEqual(SIZES.small);
  });

  it('returns the correct config for medium', () => {
    expect(getSize('medium')).toEqual(SIZES.medium);
  });

  it('returns the correct config for large', () => {
    expect(getSize('large')).toEqual(SIZES.large);
  });

  it('falls back to small for an unknown key', () => {
    expect(getSize('unknown')).toEqual(SIZES.small);
  });

  it('falls back to small for an empty string', () => {
    expect(getSize('')).toEqual(SIZES.small);
  });

  it('falls back to small for an unrecognised size name', () => {
    expect(getSize('xxl')).toEqual(SIZES.small);
  });

  it('all size configs have positive grid dimensions', () => {
    for (const size of Object.values(SIZES)) {
      expect(size.grid.x).toBeGreaterThan(0);
      expect(size.grid.y).toBeGreaterThan(0);
    }
  });

  it('each size config has a matching id', () => {
    for (const [key, size] of Object.entries(SIZES)) {
      expect(size.id).toBe(key);
    }
  });
});
