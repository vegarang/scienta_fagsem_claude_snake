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
    wallSpawnScore: 0,
    wallSpawnInterval: 0,
    wallSpawnMaxLength: 0,
  },
  medium: {
    id: 'medium',
    name: 'Medium',
    wallBehavior: 'die',
    extraWalls: [],
    initialSpeed: 150,
    speedIncrement: 8,
    minSpeed: 60,
    wallSpawnScore: 5,
    wallSpawnInterval: 5,
    wallSpawnMaxLength: 3,
  },
  hard: {
    id: 'hard',
    name: 'Hard',
    wallBehavior: 'die',
    extraWalls: [],
    initialSpeed: 120,
    speedIncrement: 10,
    minSpeed: 50,
    wallSpawnScore: 8,
    wallSpawnInterval: 6,
    wallSpawnMaxLength: 4,
  },
};

export function getLevel(id: string): LevelConfig {
  const level = LEVELS[id];
  if (!level) throw new Error(`Unknown level: ${id}`);
  return level;
}
