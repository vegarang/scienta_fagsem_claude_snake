const KEY = 'snake-scoreboard';
const MAX = 10;

export interface ScoreEntry {
  name: string;
  score: number;
  date: string;
}

export function loadScoreboard(): ScoreEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ScoreEntry[];
  } catch {
    return [];
  }
}

export function addEntry(entry: ScoreEntry): ScoreEntry[] {
  try {
    const entries = loadScoreboard();
    entries.push(entry);
    entries.sort((a, b) => b.score - a.score);
    const trimmed = entries.slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(trimmed));
    return trimmed;
  } catch {
    return loadScoreboard();
  }
}
