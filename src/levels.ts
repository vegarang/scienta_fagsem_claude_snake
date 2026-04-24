import type { LevelConfig } from './types';

export const LEVELS: Record<string, LevelConfig> = {
  easy: {
    id: 'easy',
    name: 'Easy',
    wallBehavior: 'wrap',
    extraWalls: [],
    initialSpeed: 200,
    speedIncrement: 5,
    minSpeed: 80,
  },
  medium: {
    id: 'medium',
    name: 'Medium',
    wallBehavior: 'die',
    extraWalls: [],
    initialSpeed: 150,
    speedIncrement: 8,
    minSpeed: 60,
  },
  hard: {
    id: 'hard',
    name: 'Hard',
    wallBehavior: 'die',
    extraWalls: [
      { from: { x: 5, y: 5 }, to: { x: 5, y: 14 } },
      { from: { x: 14, y: 5 }, to: { x: 14, y: 14 } },
    ],
    initialSpeed: 120,
    speedIncrement: 10,
    minSpeed: 50,
  },
};

export function getLevel(id: string): LevelConfig {
  const level = LEVELS[id];
  if (!level) throw new Error(`Unknown level: ${id}`);
  return level;
}
