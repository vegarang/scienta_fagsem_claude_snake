import { describe, it, expect } from 'vitest';
import { THEMES, getThemeVariant, type ThemeId, type ColorMode } from './themes';

const HEX_PATTERN = /^#[0-9a-fA-F]{3,6}$/;
const MODES: ColorMode[] = ['light', 'dark'];
const THEME_IDS = Object.keys(THEMES) as ThemeId[];

describe('getThemeVariant', () => {
  it.each(THEME_IDS)('returns a ThemeVariant for %s in dark mode', (id) => {
    const variant = getThemeVariant(id, 'dark');
    expect(variant).toBeDefined();
    expect(variant.canvas).toBeDefined();
    expect(variant.css).toBeDefined();
  });

  it.each(THEME_IDS)('returns a ThemeVariant for %s in light mode', (id) => {
    const variant = getThemeVariant(id, 'light');
    expect(variant).toBeDefined();
    expect(variant.canvas).toBeDefined();
    expect(variant.css).toBeDefined();
  });

  it('returns different variants for light and dark modes', () => {
    for (const id of THEME_IDS) {
      const dark = getThemeVariant(id, 'dark');
      const light = getThemeVariant(id, 'light');
      expect(dark).not.toBe(light);
    }
  });

  it('all canvas hex color values match hex format', () => {
    for (const id of THEME_IDS) {
      for (const mode of MODES) {
        const { canvas } = getThemeVariant(id, mode);
        const hexKeys = ['background', 'snakeHead', 'snakeBody', 'food', 'foodStem', 'foodLeaf', 'wall', 'text'] as const;
        for (const key of hexKeys) {
          expect(canvas[key], `${id}.${mode}.canvas.${key}`).toMatch(HEX_PATTERN);
        }
      }
    }
  });

  it('all CSS variable color values match hex format', () => {
    for (const id of THEME_IDS) {
      for (const mode of MODES) {
        const { css } = getThemeVariant(id, mode);
        for (const [key, value] of Object.entries(css)) {
          expect(value, `${id}.${mode}.css.${key}`).toMatch(HEX_PATTERN);
        }
      }
    }
  });
});
