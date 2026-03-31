import { describe, it, expect, beforeEach } from 'vitest';
import { detectFfmpeg, resetFfmpegCache } from '../src/ffmpeg.js';

describe('detectFfmpeg', () => {
  beforeEach(() => {
    resetFfmpegCache();
  });

  it('should return an object with path, version, and isSystem', () => {
    const result = detectFfmpeg();

    expect(result).toHaveProperty('path');
    expect(result).toHaveProperty('version');
    expect(result).toHaveProperty('isSystem');
    expect(result.path).toBeTypeOf('string');
    expect(result.version).toBeTypeOf('string');
    expect(typeof result.isSystem).toBe('boolean');
  });

  it('should return cached result on second call', () => {
    const first = detectFfmpeg();
    const second = detectFfmpeg();
    expect(first).toBe(second); // same reference (cached)
  });

  it('should detect system ffmpeg or fallback to bundled', () => {
    const result = detectFfmpeg();

    if (result.isSystem) {
      expect(result.path).toBe('ffmpeg');
      expect(result.version).not.toBe('bundled');
    } else {
      expect(result.version).toBe('bundled');
      expect(result.path).toBeTypeOf('string');
      expect(result.path.length).toBeGreaterThan(0);
    }
  });

  it('should return fresh result after cache reset', () => {
    const first = detectFfmpeg();
    resetFfmpegCache();
    const second = detectFfmpeg();
    // Both should have same values but be different object references
    expect(first).not.toBe(second);
    expect(first.path).toBe(second.path);
  });
});
