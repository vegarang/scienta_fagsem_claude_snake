import type { GameState, GamePhase, Direction, LevelConfig, Vec2 } from './types';
import { nextHead, moveSnake, hasSelfCollision, hitsExtraWall, samePos } from './snake';
import { placeFood } from './food';

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
  const food = placeFood(snake, level.extraWalls, gridSize);
  return {
    phase: 'idle',
    snake,
    direction: 'RIGHT',
    pendingDirection: 'RIGHT',
    food,
    score: 0,
    tickInterval: level.initialSpeed,
    level,
    gridSize,
  };
}

export function queueDirection(state: GameState, dir: Direction): GameState {
  if (dir === OPPOSITE[state.pendingDirection]) return state;
  return { ...state, pendingDirection: dir };
}

export function setPhase(state: GameState, phase: GamePhase): GameState {
  return { ...state, phase };
}

export function tick(state: GameState, rng: () => number = Math.random): GameState {
  if (state.phase !== 'playing') return state;

  const direction = state.pendingDirection;
  const head = state.snake[0];
  const { level, gridSize } = state;

  const newHead = nextHead(head, direction, gridSize, level.wallBehavior);

  if (newHead === null || hitsExtraWall(newHead, level.extraWalls)) {
    return { ...state, direction, phase: 'gameover' };
  }

  const ate = samePos(newHead, state.food);
  const newSnake = moveSnake(state.snake, newHead, ate);

  if (hasSelfCollision(newSnake)) {
    return { ...state, direction, phase: 'gameover' };
  }

  const newScore = ate ? state.score + 1 : state.score;
  const newInterval = ate
    ? Math.max(state.tickInterval - level.speedIncrement, level.minSpeed)
    : state.tickInterval;
  const newFood = ate ? placeFood(newSnake, level.extraWalls, gridSize, rng) : state.food;

  return {
    ...state,
    direction,
    snake: newSnake,
    food: newFood,
    score: newScore,
    tickInterval: newInterval,
  };
}
