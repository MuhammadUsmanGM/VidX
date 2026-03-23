import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildCommand, buildJobs } from '../src/build-cmd.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

// ─── buildCommand ─────────────────────────────────────────────────────────────

describe('buildCommand', () => {
  const baseOpts = {
    ffmpegPath: 'ffmpeg',
    inputPath: '/videos/test.mp4',
    outputPath: '/out/test.mp4',
    format: 'mp4',
    presetKey: 'webOptimized',
    resolutionKey: 'original',
  };

  // ── MP4 format tests ──

  it('should build valid mp4 command with webOptimized preset', () => {
    const { cmd, args } = buildCommand(baseOpts);

    expect(args).toContain('-i');
    expect(args).toContain('/videos/test.mp4');
    expect(args).toContain('-c:v');
    expect(args).toContain('libx264');
    expect(args).toContain('-crf');
    expect(args).toContain('32');
    expect(args).toContain('-preset');
    expect(args).toContain('slow');
    expect(args).toContain('-pix_fmt');
    expect(args).toContain('yuv420p');
    expect(args).toContain('-movflags');
    expect(args).toContain('+faststart');
    expect(args).toContain('-c:a');
    expect(args).toContain('aac');
  });

  it('should include metadata stripping', () => {
    const { args } = buildCommand(baseOpts);
    expect(args).toContain('-map_metadata');
    expect(args).toContain('-1');
  });

  it('should include overwrite flag', () => {
    const { args } = buildCommand(baseOpts);
    expect(args).toContain('-y');
  });

  it('should include VBV bitrate capping for mp4', () => {
    const { args } = buildCommand(baseOpts);
    expect(args).toContain('-maxrate');
    expect(args).toContain('-bufsize');
  });

  it('should place output path as last argument', () => {
    const { args } = buildCommand(baseOpts);
    expect(args[args.length - 1]).toBe('/out/test.mp4');
  });

  // ── WebM format tests ──

  it('should build valid webm command', () => {
    const { args } = buildCommand({ ...baseOpts, format: 'webm', outputPath: '/out/test.webm' });

    expect(args).toContain('-c:v');
    expect(args).toContain('libvpx-vp9');
    expect(args).toContain('-b:v');
    expect(args).toContain('0');
    expect(args).toContain('-deadline');
    expect(args).toContain('good');
    expect(args).toContain('-row-mt');
    expect(args).toContain('1');
    expect(args).toContain('-c:a');
    expect(args).toContain('libopus');
  });

  it('should place -b:v 0 before -crf for VP9 constrained quality', () => {
    const { args } = buildCommand({ ...baseOpts, format: 'webm', outputPath: '/out/test.webm' });
    const bvIdx = args.indexOf('-b:v');
    const crfIdx = args.indexOf('-crf');
    expect(bvIdx).toBeLessThan(crfIdx);
  });

  // ── Resolution tests ──

  it('should not add -vf when resolution is original', () => {
    const { args } = buildCommand(baseOpts);
    expect(args).not.toContain('-vf');
  });

  it('should add scale filter for 720p', () => {
    const { args } = buildCommand({ ...baseOpts, resolutionKey: '720p' });
    expect(args).toContain('-vf');
    expect(args).toContain('scale=-2:720');
  });

  it('should add scale filter for 480p', () => {
    const { args } = buildCommand({ ...baseOpts, resolutionKey: '480p' });
    expect(args).toContain('-vf');
    expect(args).toContain('scale=-2:480');
  });

  it('should add scale filter for 1080p', () => {
    const { args } = buildCommand({ ...baseOpts, resolutionKey: '1080p' });
    expect(args).toContain('-vf');
    expect(args).toContain('scale=-2:1080');
  });

  // ── Preset tests ──

  it('should use highQuality CRF values', () => {
    const { args } = buildCommand({ ...baseOpts, presetKey: 'highQuality' });
    expect(args).toContain('24'); // highQuality mp4 CRF
  });

  it('should use smallFile CRF values', () => {
    const { args } = buildCommand({ ...baseOpts, presetKey: 'smallFile' });
    expect(args).toContain('38'); // smallFile mp4 CRF
  });

  // ── Custom preset tests ──

  it('should throw when custom preset has no config', () => {
    expect(() =>
      buildCommand({ ...baseOpts, presetKey: 'custom' })
    ).toThrow('Custom preset selected but no custom config provided.');
  });

  it('should use custom mp4 config', () => {
    const custom = {
      mp4: { crf: 20, preset: 'slow', audioBitrate: '192k' },
      webm: { crf: 30, audioBitrate: '128k' },
    };
    const { args } = buildCommand({ ...baseOpts, presetKey: 'custom', custom });
    expect(args).toContain('20');
    expect(args).toContain('192k');
  });

  it('should use custom webm config', () => {
    const custom = {
      mp4: { crf: 20, preset: 'slow', audioBitrate: '192k' },
      webm: { crf: 30, audioBitrate: '128k' },
    };
    const { args } = buildCommand({
      ...baseOpts,
      format: 'webm',
      outputPath: '/out/test.webm',
      presetKey: 'custom',
      custom,
    });
    expect(args).toContain('30');
    expect(args).toContain('128k');
  });

  // ── GIF handling tests ──

  it('should strip audio and add -an for GIF input (mp4)', () => {
    const { args } = buildCommand({
      ...baseOpts,
      inputPath: '/videos/animation.gif',
      outputPath: '/out/animation.mp4',
    });
    expect(args).toContain('-an');
    expect(args).not.toContain('-c:a');
    expect(args).not.toContain('aac');
  });

  it('should strip audio and add -an for GIF input (webm)', () => {
    const { args } = buildCommand({
      ...baseOpts,
      inputPath: '/videos/animation.gif',
      outputPath: '/out/animation.webm',
      format: 'webm',
    });
    expect(args).toContain('-an');
    expect(args).not.toContain('-c:a');
    expect(args).not.toContain('libopus');
  });

  it('should handle uppercase .GIF extension', () => {
    const { args } = buildCommand({
      ...baseOpts,
      inputPath: '/videos/ANIMATION.GIF',
      outputPath: '/out/animation.mp4',
    });
    expect(args).toContain('-an');
    expect(args).not.toContain('-c:a');
  });

  // ── cmd string tests ──

  it('should produce a human-readable command string', () => {
    const { cmd } = buildCommand(baseOpts);
    expect(cmd).toBeTypeOf('string');
    expect(cmd).toContain('ffmpeg');
    expect(cmd).toContain('/videos/test.mp4');
  });

  it('should quote paths with spaces in cmd string', () => {
    const { cmd } = buildCommand({
      ...baseOpts,
      inputPath: '/my videos/test file.mp4',
      outputPath: '/my output/test file.mp4',
    });
    expect(cmd).toContain('"');
  });
});

// ─── buildJobs ────────────────────────────────────────────────────────────────

describe('buildJobs', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vidx-jobs-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const makeFile = (name) => ({
    name,
    fullPath: `/videos/${name}`,
    relativePath: name,
    size: 1024000,
    sizeFormatted: '1000 KB',
  });

  it('should create one job per file for a single format', () => {
    const jobs = buildJobs({
      files: [makeFile('video1.mp4'), makeFile('video2.mov')],
      format: 'mp4',
      outputDir: tmpDir,
      presetKey: 'webOptimized',
      resolutionKey: 'original',
      ffmpegPath: 'ffmpeg',
    });

    expect(jobs).toHaveLength(2);
    expect(jobs[0].format).toBe('mp4');
    expect(jobs[1].format).toBe('mp4');
  });

  it('should create two jobs per file when format is "both"', () => {
    const jobs = buildJobs({
      files: [makeFile('video1.mp4')],
      format: 'both',
      outputDir: tmpDir,
      presetKey: 'webOptimized',
      resolutionKey: 'original',
      ffmpegPath: 'ffmpeg',
    });

    expect(jobs).toHaveLength(2);
    expect(jobs[0].format).toBe('mp4');
    expect(jobs[1].format).toBe('webm');
  });

  it('should use correct output file extensions', () => {
    const jobs = buildJobs({
      files: [makeFile('clip.mov')],
      format: 'both',
      outputDir: tmpDir,
      presetKey: 'webOptimized',
      resolutionKey: 'original',
      ffmpegPath: 'ffmpeg',
    });

    expect(jobs[0].outputPath).toMatch(/clip\.mp4$/);
    expect(jobs[1].outputPath).toMatch(/clip\.webm$/);
  });

  it('should generate unique paths when output already exists', () => {
    // Create a file that would conflict
    fs.writeFileSync(path.join(tmpDir, 'video1.mp4'), 'existing');

    const jobs = buildJobs({
      files: [makeFile('video1.mp4')],
      format: 'mp4',
      outputDir: tmpDir,
      presetKey: 'webOptimized',
      resolutionKey: 'original',
      ffmpegPath: 'ffmpeg',
    });

    expect(jobs[0].outputPath).toMatch(/video1_1\.mp4$/);
  });

  it('should increment counter for multiple conflicts', () => {
    fs.writeFileSync(path.join(tmpDir, 'video1.mp4'), 'existing');
    fs.writeFileSync(path.join(tmpDir, 'video1_1.mp4'), 'existing');
    fs.writeFileSync(path.join(tmpDir, 'video1_2.mp4'), 'existing');

    const jobs = buildJobs({
      files: [makeFile('video1.mp4')],
      format: 'mp4',
      outputDir: tmpDir,
      presetKey: 'webOptimized',
      resolutionKey: 'original',
      ffmpegPath: 'ffmpeg',
    });

    expect(jobs[0].outputPath).toMatch(/video1_3\.mp4$/);
  });

  it('should include cmd and args in each job', () => {
    const jobs = buildJobs({
      files: [makeFile('video1.mp4')],
      format: 'mp4',
      outputDir: tmpDir,
      presetKey: 'webOptimized',
      resolutionKey: 'original',
      ffmpegPath: 'ffmpeg',
    });

    expect(jobs[0].cmd).toBeTypeOf('string');
    expect(jobs[0].args).toBeInstanceOf(Array);
    expect(jobs[0].ffmpegPath).toBe('ffmpeg');
    expect(jobs[0].inputFile).toBeDefined();
  });

  it('should handle empty files array', () => {
    const jobs = buildJobs({
      files: [],
      format: 'mp4',
      outputDir: tmpDir,
      presetKey: 'webOptimized',
      resolutionKey: 'original',
      ffmpegPath: 'ffmpeg',
    });

    expect(jobs).toHaveLength(0);
  });
});
