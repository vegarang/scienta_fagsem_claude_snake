import type { GameState, GamePhase, Direction, LevelConfig, Vec2, ActiveEffect, PowerUp, ExtraWall } from './types';
import { nextHead, moveSnake, hasSelfCollision, hitsExtraWall, samePos } from './snake';
import { placeFood } from './food';
import { generateInitialWalls, spawnWall } from './walls';
import {
  placePowerUp,
  POWERUP_SPAWN_MIN,
  POWERUP_SPAWN_MAX,
  POWERUP_MAX_ON_BOARD,
  EFFECT_DURATION,
  SHRINK_AMOUNT,
} from './powerups';

const OPPOSITE: Record<Direction, Direction> = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
};

function initialSnake(gridSize: Vec2): readonly Vec2[] {
  const midY = Math.floor(gridSize.y / 2);
  const midX = Math.floor(gridSize.x / 2);
  return [
    { x: midX, y: midY },
    { x: midX - 1, y: midY },
    { x: midX - 2, y: midY },
  ];
}

export function createGame(level: LevelConfig, gridSize: Vec2): GameState {
  const snake = initialSnake(gridSize);
  const dynamicWalls = generateInitialWalls(level, gridSize);
  const allWalls = [...level.extraWalls, ...dynamicWalls];
  const food = placeFood(snake, allWalls, gridSize);
  return {
    phase: 'idle',
    snake,
    direction: 'RIGHT',
    directionQueue: [],
    food,
    score: 0,
    tickInterval: level.initialSpeed,
    level,
    gridSize,
    dynamicWalls,
    powerups: [],
    activeEffects: [],
    powerupSpawnCountdown: POWERUP_SPAWN_MIN,
    ticksAlive: 0,
    maxLength: snake.length,
  };
}

export function queueDirection(state: GameState, dir: Direction): GameState {
  const ref = state.directionQueue[state.directionQueue.length - 1] ?? state.direction;
  if (dir === OPPOSITE[ref]) return state;
  if (state.directionQueue.length >= 2) return state;
  return { ...state, directionQueue: [...state.directionQueue, dir] };
}

export function setPhase(state: GameState, phase: GamePhase): GameState {
  return { ...state, phase };
}

export function getEffectiveTickInterval(state: GameState): number {
  if (state.activeEffects.some(e => e.type === 'speed_boost'))
    return Math.max(state.tickInterval * 0.5, 30);
  if (state.activeEffects.some(e => e.type === 'slow_down'))
    return state.tickInterval * 1.8;
  return state.tickInterval;
}

function ageEffectsAndPowerups(state: GameState): {
  agedEffects: readonly ActiveEffect[];
  agedPowerups: readonly PowerUp[];
} {
  return {
    agedEffects: state.activeEffects
      .map(e => ({ ...e, remainingTicks: e.remainingTicks - 1 }))
      .filter(e => e.remainingTicks > 0),
    agedPowerups: state.powerups
      .map(p => ({ ...p, expiresInTicks: p.expiresInTicks - 1 }))
      .filter(p => p.expiresInTicks > 0),
  };
}

type CollisionResult =
  | { died: true }
  | { died: false; newSnake: readonly Vec2[]; ate: boolean; activeEffects: readonly ActiveEffect[]; boardPowerups: readonly PowerUp[] };

function resolveCollisions(
  state: GameState,
  direction: Direction,
  allWalls: readonly ExtraWall[],
  agedEffects: readonly ActiveEffect[],
  agedPowerups: readonly PowerUp[],
): CollisionResult {
  const head = state.snake[0];
  const ghostActive = agedEffects.some(e => e.type === 'ghost_mode');
  const rawHead = nextHead(head, direction, state.gridSize, state.level.wallBehavior);

  if (!ghostActive && (rawHead === null || hitsExtraWall(rawHead, allWalls))) {
    return { died: true };
  }

  const newHead: Vec2 = rawHead ?? nextHead(head, direction, state.gridSize, 'wrap')!;
  const ate = samePos(newHead, state.food);
  let newSnake = moveSnake(state.snake, newHead, ate);

  if (hasSelfCollision(newSnake)) return { died: true };

  let activeEffects: readonly ActiveEffect[] = agedEffects;
  let boardPowerups: readonly PowerUp[] = agedPowerups;
  const collectedPowerup = boardPowerups.find(p => samePos(p.pos, newHead));
  if (collectedPowerup) {
    boardPowerups = boardPowerups.filter(p => !samePos(p.pos, newHead));
    if (collectedPowerup.type === 'shrink') {
      newSnake = newSnake.slice(0, Math.max(1, newSnake.length - SHRINK_AMOUNT));
    } else {
      activeEffects = [...agedEffects, { type: collectedPowerup.type, remainingTicks: EFFECT_DURATION }];
    }
  }

  return { died: false, newSnake, ate, activeEffects, boardPowerups };
}

function maybeSpawnPickups(
  state: GameState,
  newSnake: readonly Vec2[],
  allWalls: readonly ExtraWall[],
  newFood: Vec2,
  newScore: number,
  ate: boolean,
  inPowerups: readonly PowerUp[],
  rng: () => number,
): { newDynamicWalls: readonly ExtraWall[]; boardPowerups: readonly PowerUp[]; newCountdown: number } {
  let boardPowerups = inPowerups;
  const maxOnBoard = state.level.powerupMaxOnBoard ?? POWERUP_MAX_ON_BOARD;
  const spawnMin = state.level.powerupSpawnMin ?? POWERUP_SPAWN_MIN;
  const spawnMax = state.level.powerupSpawnMax ?? POWERUP_SPAWN_MAX;

  let newCountdown = state.powerupSpawnCountdown - 1;
  if (newCountdown <= 0 && boardPowerups.length < maxOnBoard) {
    const spawned = placePowerUp(newSnake, allWalls, boardPowerups, newFood, state.gridSize, newSnake[0], rng);
    if (spawned) boardPowerups = [...boardPowerups, spawned];
    newCountdown = spawnMin + Math.floor(rng() * (spawnMax - spawnMin + 1));
  }

  let newDynamicWalls = state.dynamicWalls;
  if (ate && state.level.wallSpawnInterval > 0 && newScore >= state.level.wallSpawnScore) {
    if ((newScore - state.level.wallSpawnScore) % state.level.wallSpawnInterval === 0) {
      const wall = spawnWall({ ...state, snake: newSnake, score: newScore }, rng);
      if (wall) newDynamicWalls = [...state.dynamicWalls, wall];
    }
  }

  return { newDynamicWalls, boardPowerups, newCountdown };
}

export function tick(state: GameState, rng: () => number = Math.random): GameState {
  if (state.phase !== 'playing') return state;

  const [direction = state.direction, ...remainingQueue] = state.directionQueue;
  const { level, gridSize } = state;
  const allWalls = [...level.extraWalls, ...state.dynamicWalls];

  const { agedEffects, agedPowerups } = ageEffectsAndPowerups(state);
  const collision = resolveCollisions(state, direction, allWalls, agedEffects, agedPowerups);
  if (collision.died) return { ...state, direction, phase: 'gameover' };

  const { newSnake, ate, activeEffects, boardPowerups: postCollisionPowerups } = collision;
  const multiplierActive = activeEffects.some(e => e.type === 'score_multiplier');
  const newScore = ate ? state.score + (multiplierActive ? 2 : 1) : state.score;
  const newInterval = ate ? Math.max(state.tickInterval - level.speedIncrement, level.minSpeed) : state.tickInterval;
  const newFood = ate ? placeFood(newSnake, allWalls, gridSize, rng) : state.food;

  const { newDynamicWalls, boardPowerups, newCountdown } = maybeSpawnPickups(
    state, newSnake, allWalls, newFood, newScore, ate, postCollisionPowerups, rng,
  );

  return {
    ...state,
    direction,
    directionQueue: remainingQueue,
    snake: newSnake,
    food: newFood,
    score: newScore,
    tickInterval: newInterval,
    dynamicWalls: newDynamicWalls,
    powerups: boardPowerups,
    activeEffects,
    powerupSpawnCountdown: newCountdown,
    ticksAlive: state.ticksAlive + 1,
    maxLength: Math.max(state.maxLength, newSnake.length),
  };
}
