import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { detectVideos } from '../src/detect.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('detectVideos', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vidx-detect-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function createFile(relativePath, sizeBytes = 1024) {
    const fullPath = path.join(tmpDir, relativePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, Buffer.alloc(sizeBytes));
  }

  it('should find mp4 files', async () => {
    createFile('video.mp4', 2048);
    const files = await detectVideos(tmpDir);
    expect(files).toHaveLength(1);
    expect(files[0].name).toBe('video.mp4');
  });

  it('should find multiple video formats', async () => {
    createFile('a.mp4', 1000);
    createFile('b.mov', 2000);
    createFile('c.avi', 3000);
    createFile('d.mkv', 4000);
    createFile('e.webm', 5000);
    createFile('f.wmv', 6000);
    createFile('g.flv', 7000);
    createFile('h.m4v', 8000);
    createFile('i.gif', 9000);
    createFile('j.ts', 10000);
    createFile('k.mts', 11000);
    createFile('l.3gp', 12000);
    createFile('m.ogv', 13000);

    const files = await detectVideos(tmpDir);
    expect(files).toHaveLength(13);
  });

  it('should detect ts, mts, 3gp, and ogv formats', async () => {
    createFile('screen.ts', 1000);
    createFile('camera.mts', 2000);
    createFile('mobile.3gp', 3000);
    createFile('open.ogv', 4000);

    const files = await detectVideos(tmpDir);
    expect(files).toHaveLength(4);
    const names = files.map((f) => f.name);
    expect(names).toContain('screen.ts');
    expect(names).toContain('camera.mts');
    expect(names).toContain('mobile.3gp');
    expect(names).toContain('open.ogv');
  });

  it('should ignore non-video files', async () => {
    createFile('video.mp4', 1024);
    createFile('readme.md', 512);
    createFile('style.css', 256);
    createFile('script.js', 128);
    createFile('photo.png', 64);

    const files = await detectVideos(tmpDir);
    expect(files).toHaveLength(1);
    expect(files[0].name).toBe('video.mp4');
  });

  it('should ignore node_modules directory', async () => {
    createFile('video.mp4', 2048);
    createFile('node_modules/dep/intro.mp4', 1024);

    const files = await detectVideos(tmpDir);
    expect(files).toHaveLength(1);
    expect(files[0].name).toBe('video.mp4');
  });

  it('should ignore .git directory', async () => {
    createFile('video.mp4', 2048);
    createFile('.git/objects/clip.mp4', 1024);

    const files = await detectVideos(tmpDir);
    expect(files).toHaveLength(1);
  });

  it('should ignore dist and build directories', async () => {
    createFile('video.mp4', 2048);
    createFile('dist/video.mp4', 1024);
    createFile('build/video.mp4', 512);

    const files = await detectVideos(tmpDir);
    expect(files).toHaveLength(1);
  });

  it('should return empty array when no videos found', async () => {
    createFile('readme.md', 512);
    const files = await detectVideos(tmpDir);
    expect(files).toHaveLength(0);
  });

  it('should sort by size descending (largest first)', async () => {
    createFile('small.mp4', 100);
    createFile('medium.mp4', 500);
    createFile('large.mp4', 1000);

    const files = await detectVideos(tmpDir);
    expect(files[0].name).toBe('large.mp4');
    expect(files[1].name).toBe('medium.mp4');
    expect(files[2].name).toBe('small.mp4');
  });

  it('should return correct file properties', async () => {
    createFile('clip.mp4', 2048);

    const files = await detectVideos(tmpDir);
    expect(files[0]).toMatchObject({
      name: 'clip.mp4',
      relativePath: 'clip.mp4',
      size: 2048,
    });
    expect(files[0].fullPath).toContain('clip.mp4');
    expect(files[0].sizeFormatted).toBe('2 KB');
  });

  it('should find videos in subdirectories', async () => {
    createFile('src/assets/hero.mp4', 1024);
    createFile('public/intro.webm', 2048);

    const files = await detectVideos(tmpDir);
    expect(files).toHaveLength(2);
  });

  it('should respect custom ignore patterns', async () => {
    createFile('video.mp4', 2048);
    createFile('optimized/video.mp4', 1024);

    const files = await detectVideos(tmpDir, ['**/optimized/**']);
    expect(files).toHaveLength(1);
    expect(files[0].name).toBe('video.mp4');
  });

  it('should format bytes correctly', async () => {
    createFile('tiny.mp4', 500);         // 500 B
    createFile('medium.mp4', 1536000);   // ~1.5 MB

    const files = await detectVideos(tmpDir);
    const tiny = files.find((f) => f.name === 'tiny.mp4');
    const medium = files.find((f) => f.name === 'medium.mp4');

    expect(tiny.sizeFormatted).toBe('500 B');
    expect(medium.sizeFormatted).toBe('1.5 MB');
  });
});
