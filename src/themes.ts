export type ThemeId = 'classic' | 'ocean' | 'sunset' | 'forest' | 'minimal';
export type ColorMode = 'dark' | 'light';

export interface CanvasColors {
  background: string;
  snakeHead: string;
  snakeBody: string;
  food: string;
  foodStem: string;
  foodLeaf: string;
  wall: string;
  text: string;
  overlay: string;
}

export interface CssVars {
  '--bg': string;
  '--surface': string;
  '--surface2': string;
  '--border': string;
  '--text': string;
  '--text-muted': string;
  '--accent': string;
  '--accent-hover': string;
  '--swatch': string;
}

export interface ThemeVariant {
  canvas: CanvasColors;
  css: CssVars;
}

export interface Theme {
  id: ThemeId;
  label: string;
  dark: ThemeVariant;
  light: ThemeVariant;
}

const classic: Theme = {
  id: 'classic',
  label: 'Classic',
  dark: {
    canvas: {
      background: '#000000', snakeHead: '#00ff88', snakeBody: '#00cc66',
      food: '#e63030', foodStem: '#7a4000', foodLeaf: '#3aaa3a',
      wall: '#888888', text: '#ffffff', overlay: 'rgba(0,0,0,0.6)',
    },
    css: {
      '--bg': '#111111', '--surface': '#1e1e1e', '--surface2': '#2a2a2a',
      '--border': '#333333', '--text': '#ffffff', '--text-muted': '#888888',
      '--accent': '#00ff88', '--accent-hover': '#00cc66', '--swatch': '#00ff88',
    },
  },
  light: {
    canvas: {
      background: '#e8ffe8', snakeHead: '#007744', snakeBody: '#009955',
      food: '#cc2222', foodStem: '#5a2a00', foodLeaf: '#228822',
      wall: '#666666', text: '#111111', overlay: 'rgba(255,255,255,0.6)',
    },
    css: {
      '--bg': '#f0fff4', '--surface': '#ffffff', '--surface2': '#e8f5e8',
      '--border': '#ccddcc', '--text': '#111111', '--text-muted': '#557755',
      '--accent': '#007744', '--accent-hover': '#005533', '--swatch': '#007744',
    },
  },
};

const ocean: Theme = {
  id: 'ocean',
  label: 'Ocean',
  dark: {
    canvas: {
      background: '#050d1a', snakeHead: '#00e5ff', snakeBody: '#0099bb',
      food: '#ff6b35', foodStem: '#7a4000', foodLeaf: '#3aaa3a',
      wall: '#3a5a7a', text: '#e0f4ff', overlay: 'rgba(5,13,26,0.7)',
    },
    css: {
      '--bg': '#07111f', '--surface': '#0d1f33', '--surface2': '#122840',
      '--border': '#1e3a55', '--text': '#e0f4ff', '--text-muted': '#5588aa',
      '--accent': '#00e5ff', '--accent-hover': '#00b8cc', '--swatch': '#00e5ff',
    },
  },
  light: {
    canvas: {
      background: '#e8f4ff', snakeHead: '#006688', snakeBody: '#0088aa',
      food: '#e05a20', foodStem: '#5a2a00', foodLeaf: '#228822',
      wall: '#7799bb', text: '#0a1a2a', overlay: 'rgba(232,244,255,0.7)',
    },
    css: {
      '--bg': '#edf6ff', '--surface': '#ffffff', '--surface2': '#ddeeff',
      '--border': '#bbccdd', '--text': '#0a1a2a', '--text-muted': '#446688',
      '--accent': '#006688', '--accent-hover': '#004466', '--swatch': '#006688',
    },
  },
};

const sunset: Theme = {
  id: 'sunset',
  label: 'Sunset',
  dark: {
    canvas: {
      background: '#1a0a00', snakeHead: '#ff7733', snakeBody: '#cc5500',
      food: '#ffdd00', foodStem: '#7a4000', foodLeaf: '#3aaa3a',
      wall: '#7a4422', text: '#ffe8cc', overlay: 'rgba(26,10,0,0.7)',
    },
    css: {
      '--bg': '#1e0d00', '--surface': '#2d1500', '--surface2': '#3d1e00',
      '--border': '#553300', '--text': '#ffe8cc', '--text-muted': '#aa6633',
      '--accent': '#ff7733', '--accent-hover': '#dd5511', '--swatch': '#ff7733',
    },
  },
  light: {
    canvas: {
      background: '#fff4ee', snakeHead: '#cc4400', snakeBody: '#e05500',
      food: '#cc9900', foodStem: '#5a2a00', foodLeaf: '#228822',
      wall: '#bb8866', text: '#2a1000', overlay: 'rgba(255,244,238,0.7)',
    },
    css: {
      '--bg': '#fff6f0', '--surface': '#ffffff', '--surface2': '#ffeedc',
      '--border': '#ddbbaa', '--text': '#2a1000', '--text-muted': '#885533',
      '--accent': '#cc4400', '--accent-hover': '#aa3300', '--swatch': '#cc4400',
    },
  },
};

const forest: Theme = {
  id: 'forest',
  label: 'Forest',
  dark: {
    canvas: {
      background: '#0a1200', snakeHead: '#88cc44', snakeBody: '#558822',
      food: '#ff4422', foodStem: '#7a4000', foodLeaf: '#3aaa3a',
      wall: '#4a5a2a', text: '#d8eebb', overlay: 'rgba(10,18,0,0.7)',
    },
    css: {
      '--bg': '#0d1600', '--surface': '#182200', '--surface2': '#203000',
      '--border': '#334400', '--text': '#d8eebb', '--text-muted': '#6a8844',
      '--accent': '#88cc44', '--accent-hover': '#66aa22', '--swatch': '#88cc44',
    },
  },
  light: {
    canvas: {
      background: '#f0f5e8', snakeHead: '#337700', snakeBody: '#448800',
      food: '#cc3311', foodStem: '#5a2a00', foodLeaf: '#228822',
      wall: '#8a9a66', text: '#1a2a00', overlay: 'rgba(240,245,232,0.7)',
    },
    css: {
      '--bg': '#f2f6eb', '--surface': '#ffffff', '--surface2': '#e4ecd4',
      '--border': '#ccddaa', '--text': '#1a2a00', '--text-muted': '#5a7733',
      '--accent': '#337700', '--accent-hover': '#225500', '--swatch': '#337700',
    },
  },
};

const minimal: Theme = {
  id: 'minimal',
  label: 'Minimal',
  dark: {
    canvas: {
      background: '#0a0a0a', snakeHead: '#e0e0e0', snakeBody: '#999999',
      food: '#e85555', foodStem: '#7a4000', foodLeaf: '#3aaa3a',
      wall: '#555555', text: '#ffffff', overlay: 'rgba(10,10,10,0.7)',
    },
    css: {
      '--bg': '#111111', '--surface': '#1c1c1c', '--surface2': '#262626',
      '--border': '#333333', '--text': '#ffffff', '--text-muted': '#777777',
      '--accent': '#e0e0e0', '--accent-hover': '#bbbbbb', '--swatch': '#aaaaaa',
    },
  },
  light: {
    canvas: {
      background: '#f5f5f5', snakeHead: '#222222', snakeBody: '#555555',
      food: '#cc2222', foodStem: '#5a2a00', foodLeaf: '#228822',
      wall: '#bbbbbb', text: '#111111', overlay: 'rgba(245,245,245,0.7)',
    },
    css: {
      '--bg': '#f7f7f7', '--surface': '#ffffff', '--surface2': '#eeeeee',
      '--border': '#dddddd', '--text': '#111111', '--text-muted': '#777777',
      '--accent': '#222222', '--accent-hover': '#000000', '--swatch': '#888888',
    },
  },
};

export const THEMES: Record<ThemeId, Theme> = { classic, ocean, sunset, forest, minimal };
export const DEFAULT_THEME_ID: ThemeId = 'classic';
export const DEFAULT_MODE: ColorMode = 'dark';

export function getThemeVariant(id: ThemeId, mode: ColorMode): ThemeVariant {
  return THEMES[id][mode];
}
