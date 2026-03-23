import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig } from '../src/config.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('loadConfig', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vidx-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should return null when no .vidxrc exists', () => {
    const result = loadConfig(tmpDir);
    expect(result).toBeNull();
  });

  it('should parse valid .vidxrc JSON', () => {
    const config = {
      preset: 'webOptimized',
      formats: ['mp4', 'webm'],
      resolution: '720p',
      outputDir: './optimized',
    };
    fs.writeFileSync(path.join(tmpDir, '.vidxrc'), JSON.stringify(config));

    const result = loadConfig(tmpDir);
    expect(result).toEqual(config);
  });

  it('should return null for invalid JSON and warn', () => {
    fs.writeFileSync(path.join(tmpDir, '.vidxrc'), 'not valid json {{{');

    const warnSpy = [];
    const origWarn = console.warn;
    console.warn = (...args) => warnSpy.push(args.join(' '));

    const result = loadConfig(tmpDir);

    console.warn = origWarn;

    expect(result).toBeNull();
    expect(warnSpy.length).toBe(1);
    expect(warnSpy[0]).toContain('Could not parse .vidxrc');
  });

  it('should handle empty .vidxrc file', () => {
    fs.writeFileSync(path.join(tmpDir, '.vidxrc'), '');

    const result = loadConfig(tmpDir);
    expect(result).toBeNull();
  });

  it('should parse minimal config', () => {
    fs.writeFileSync(path.join(tmpDir, '.vidxrc'), JSON.stringify({ preset: 'smallFile' }));

    const result = loadConfig(tmpDir);
    expect(result).toEqual({ preset: 'smallFile' });
  });
});
