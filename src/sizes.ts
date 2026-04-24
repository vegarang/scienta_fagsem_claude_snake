export interface SizeConfig {
  readonly id: string;
  readonly name: string;
  readonly grid: { readonly x: number; readonly y: number };
}

export const SIZES: Record<string, SizeConfig> = {
  small:  { id: 'small',  name: 'Small',  grid: { x: 20, y: 20 } },
  medium: { id: 'medium', name: 'Medium', grid: { x: 39, y: 22 } },
  large:  { id: 'large',  name: 'Large',  grid: { x: 53, y: 30 } },
};

export function getSize(id: string): SizeConfig {
  return SIZES[id] ?? SIZES.small;
}
