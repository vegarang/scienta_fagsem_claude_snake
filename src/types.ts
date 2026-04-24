export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type WallBehavior = 'wrap' | 'die';

export type GamePhase = 'idle' | 'playing' | 'paused' | 'gameover';

export interface ExtraWall {
  readonly from: Vec2;
  readonly to: Vec2;
}

export interface LevelConfig {
  readonly id: string;
  readonly name: string;
  readonly wallBehavior: WallBehavior;
  readonly extraWalls: readonly ExtraWall[];
  readonly initialSpeed: number;
  readonly speedIncrement: number;
  readonly minSpeed: number;
}

export interface GameState {
  readonly phase: GamePhase;
  readonly snake: readonly Vec2[];
  readonly direction: Direction;
  readonly directionQueue: readonly Direction[];
  readonly food: Vec2;
  readonly score: number;
  readonly tickInterval: number;
  readonly level: LevelConfig;
  readonly gridSize: Vec2;
}
