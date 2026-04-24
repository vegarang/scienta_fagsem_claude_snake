import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadScoreboard, addEntry, type ScoreEntry } from './scoreboard';

function makeLocalStorageMock() {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((n: number) => Object.keys(store)[n] ?? null),
  };
}

describe('scoreboard', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', makeLocalStorageMock());
  });

  describe('loadScoreboard', () => {
    it('returns empty array when localStorage is empty', () => {
      expect(loadScoreboard()).toEqual([]);
    });

    it('returns empty array and does not throw when JSON is corrupt', () => {
      localStorage.setItem('snake-scoreboard', 'not valid json{{{');
      expect(() => loadScoreboard()).not.toThrow();
      expect(loadScoreboard()).toEqual([]);
    });

    it('returns stored entries', () => {
      const entry: ScoreEntry = { name: 'Alice', score: 100, date: '2025-01-01' };
      localStorage.setItem('snake-scoreboard', JSON.stringify([entry]));
      expect(loadScoreboard()).toEqual([entry]);
    });
  });

  describe('addEntry', () => {
    it('inserts an entry and returns it', () => {
      const result = addEntry({ name: 'Alice', score: 50, date: '2025-01-01' });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Alice');
    });

    it('sorts entries by score descending', () => {
      addEntry({ name: 'Alice', score: 50, date: '2025-01-01' });
      addEntry({ name: 'Bob', score: 100, date: '2025-01-02' });
      const result = loadScoreboard();
      expect(result[0].score).toBe(100);
      expect(result[1].score).toBe(50);
    });

    it('trims to 10 entries', () => {
      for (let i = 0; i < 15; i++) {
        addEntry({ name: `Player${i}`, score: i * 10, date: '2025-01-01' });
      }
      expect(loadScoreboard()).toHaveLength(10);
    });

    it('keeps the highest scores when trimming', () => {
      for (let i = 0; i < 15; i++) {
        addEntry({ name: `Player${i}`, score: i * 10, date: '2025-01-01' });
      }
      const entries = loadScoreboard();
      expect(entries[0].score).toBe(140);
      expect(entries[9].score).toBe(50);
    });

    it('persists entries across calls', () => {
      addEntry({ name: 'Alice', score: 100, date: '2025-01-01' });
      addEntry({ name: 'Bob', score: 200, date: '2025-01-02' });
      expect(loadScoreboard()).toHaveLength(2);
    });

    it('preserves stable order for identical scores', () => {
      addEntry({ name: 'Alice', score: 100, date: '2025-01-01' });
      addEntry({ name: 'Bob', score: 100, date: '2025-01-02' });
      const entries = loadScoreboard();
      expect(entries).toHaveLength(2);
      expect(entries[0].score).toBe(100);
      expect(entries[1].score).toBe(100);
    });
  });
});
