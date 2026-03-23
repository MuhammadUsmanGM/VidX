import { describe, it, expect, beforeEach, vi } from 'vitest';
import { execSync } from 'child_process';

// We need to test detectFfmpeg in isolation. Since it caches the result
// in a module-level variable, we use dynamic imports to get a fresh module per test.

describe('detectFfmpeg', () => {
  it('should return an object with path, version, and isSystem', async () => {
    // Use a fresh import to avoid cache
    const mod = await import('../src/ffmpeg.js');
    // Reset the cache by re-importing (the cache is module-scoped)
    const result = mod.detectFfmpeg();

    expect(result).toHaveProperty('path');
    expect(result).toHaveProperty('version');
    expect(result).toHaveProperty('isSystem');
    expect(result.path).toBeTypeOf('string');
    expect(result.version).toBeTypeOf('string');
    expect(typeof result.isSystem).toBe('boolean');
  });

  it('should return cached result on second call', async () => {
    const mod = await import('../src/ffmpeg.js');
    const first = mod.detectFfmpeg();
    const second = mod.detectFfmpeg();
    expect(first).toBe(second); // same reference (cached)
  });

  it('should detect system ffmpeg or fallback to bundled', async () => {
    const mod = await import('../src/ffmpeg.js');
    const result = mod.detectFfmpeg();

    if (result.isSystem) {
      expect(result.path).toBe('ffmpeg');
      expect(result.version).not.toBe('bundled');
    } else {
      expect(result.version).toBe('bundled');
      expect(result.path).toBeTypeOf('string');
      expect(result.path.length).toBeGreaterThan(0);
    }
  });
});
