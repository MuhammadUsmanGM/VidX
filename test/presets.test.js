import { describe, it, expect } from 'vitest';
import { PRESETS, RESOLUTIONS, FORMATS } from '../src/presets.js';

describe('PRESETS', () => {
  it('should export all four preset keys', () => {
    expect(Object.keys(PRESETS)).toEqual(['webOptimized', 'highQuality', 'smallFile', 'custom']);
  });

  it('each preset should have label and description', () => {
    for (const [key, preset] of Object.entries(PRESETS)) {
      expect(preset.label).toBeTypeOf('string');
      expect(preset.description).toBeTypeOf('string');
      expect(preset.label.length).toBeGreaterThan(0);
    }
  });

  it('non-custom presets should have mp4, webm, and av1 configs', () => {
    for (const key of ['webOptimized', 'highQuality', 'smallFile']) {
      const preset = PRESETS[key];
      expect(preset.mp4).toBeDefined();
      expect(preset.webm).toBeDefined();
      expect(preset.av1).toBeDefined();
      expect(preset.mp4.crf).toBeTypeOf('number');
      expect(preset.webm.crf).toBeTypeOf('number');
      expect(preset.av1.crf).toBeTypeOf('number');
      expect(preset.mp4.audioBitrate).toBeTypeOf('string');
      expect(preset.webm.audioBitrate).toBeTypeOf('string');
      expect(preset.av1.audioBitrate).toBeTypeOf('string');
    }
  });

  it('custom preset should have null mp4, webm, and av1', () => {
    expect(PRESETS.custom.mp4).toBeNull();
    expect(PRESETS.custom.webm).toBeNull();
    expect(PRESETS.custom.av1).toBeNull();
  });

  it('mp4 CRF values should be in valid H.264 range (0-51)', () => {
    for (const key of ['webOptimized', 'highQuality', 'smallFile']) {
      const crf = PRESETS[key].mp4.crf;
      expect(crf).toBeGreaterThanOrEqual(0);
      expect(crf).toBeLessThanOrEqual(51);
    }
  });

  it('webm CRF values should be in valid VP9 range (0-63)', () => {
    for (const key of ['webOptimized', 'highQuality', 'smallFile']) {
      const crf = PRESETS[key].webm.crf;
      expect(crf).toBeGreaterThanOrEqual(0);
      expect(crf).toBeLessThanOrEqual(63);
    }
  });

  it('av1 CRF values should be in valid SVT-AV1 range (0-63)', () => {
    for (const key of ['webOptimized', 'highQuality', 'smallFile']) {
      const crf = PRESETS[key].av1.crf;
      expect(crf).toBeGreaterThanOrEqual(0);
      expect(crf).toBeLessThanOrEqual(63);
    }
  });

  it('highQuality should have lower CRF than smallFile (better quality)', () => {
    expect(PRESETS.highQuality.mp4.crf).toBeLessThan(PRESETS.smallFile.mp4.crf);
    expect(PRESETS.highQuality.webm.crf).toBeLessThan(PRESETS.smallFile.webm.crf);
    expect(PRESETS.highQuality.av1.crf).toBeLessThan(PRESETS.smallFile.av1.crf);
  });

  it('mp4 presets should include VBV buffering (maxrate + bufsize)', () => {
    for (const key of ['webOptimized', 'highQuality', 'smallFile']) {
      expect(PRESETS[key].mp4.maxrate).toBeTypeOf('string');
      expect(PRESETS[key].mp4.bufsize).toBeTypeOf('string');
    }
  });
});

describe('RESOLUTIONS', () => {
  it('should export all four resolution keys', () => {
    expect(Object.keys(RESOLUTIONS)).toEqual(['original', '1080p', '720p', '480p']);
  });

  it('original should have null scale', () => {
    expect(RESOLUTIONS.original.scale).toBeNull();
  });

  it('non-original resolutions should have valid scale filters', () => {
    expect(RESOLUTIONS['1080p'].scale).toBe('scale=-2:1080');
    expect(RESOLUTIONS['720p'].scale).toBe('scale=-2:720');
    expect(RESOLUTIONS['480p'].scale).toBe('scale=-2:480');
  });

  it('each resolution should have a label', () => {
    for (const res of Object.values(RESOLUTIONS)) {
      expect(res.label).toBeTypeOf('string');
      expect(res.label.length).toBeGreaterThan(0);
    }
  });
});

describe('FORMATS', () => {
  it('should export mp4, webm, av1, and both', () => {
    expect(Object.keys(FORMATS)).toEqual(['mp4', 'webm', 'av1', 'both']);
  });

  it('each format should have a label', () => {
    for (const fmt of Object.values(FORMATS)) {
      expect(fmt.label).toBeTypeOf('string');
      expect(fmt.label.length).toBeGreaterThan(0);
    }
  });
});
