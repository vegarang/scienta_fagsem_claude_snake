export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type WallBehavior = 'wrap' | 'die';

export type PowerUpType = 'speed_boost' | 'slow_down' | 'score_multiplier' | 'shrink' | 'ghost_mode';

export interface PowerUp {
  readonly type: PowerUpType;
  readonly pos: Vec2;
  readonly expiresInTicks: number;
}

export interface ActiveEffect {
  readonly type: PowerUpType;
  readonly remainingTicks: number;
}

export type GamePhase = 'idle' | 'countdown' | 'playing' | 'paused' | 'gameover';

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
  readonly wallSpawnScore: number;
  readonly wallSpawnInterval: number;
  readonly wallSpawnMaxLength: number;
  readonly powerupMaxOnBoard?: number;
  readonly powerupSpawnMin?: number;
  readonly powerupSpawnMax?: number;
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
  readonly dynamicWalls: readonly ExtraWall[];
  readonly powerups: readonly PowerUp[];
  readonly activeEffects: readonly ActiveEffect[];
  readonly powerupSpawnCountdown: number;
  readonly ticksAlive: number;
  readonly maxLength: number;
}
