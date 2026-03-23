import { describe, it, expect } from 'vitest';
import { brand, brandDeep, brandDim, brandDeepDim, logo } from '../src/theme.js';

describe('theme', () => {
  it('brand should return a string', () => {
    const result = brand('VidX');
    expect(result).toBeTypeOf('string');
    expect(result).toContain('VidX');
  });

  it('brandDeep should return a string', () => {
    const result = brandDeep('VidX');
    expect(result).toBeTypeOf('string');
    expect(result).toContain('VidX');
  });

  it('brandDim should return a string', () => {
    const result = brandDim('test');
    expect(result).toBeTypeOf('string');
    expect(result).toContain('test');
  });

  it('brandDeepDim should return a string', () => {
    const result = brandDeepDim('test');
    expect(result).toBeTypeOf('string');
    expect(result).toContain('test');
  });

  it('logo.v and logo.x should return strings', () => {
    expect(logo.v('V')).toBeTypeOf('string');
    expect(logo.x('X')).toBeTypeOf('string');
    expect(logo.v('V')).toContain('V');
    expect(logo.x('X')).toContain('X');
  });

  it('all theme functions should handle empty string', () => {
    expect(() => brand('')).not.toThrow();
    expect(() => brandDeep('')).not.toThrow();
    expect(() => brandDim('')).not.toThrow();
    expect(() => brandDeepDim('')).not.toThrow();
    expect(() => logo.v('')).not.toThrow();
    expect(() => logo.x('')).not.toThrow();
  });
});
