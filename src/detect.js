import fg from 'fast-glob';
import path from 'path';
import fs from 'fs';
import { formatBytes } from './utils.js';

const VIDEO_EXTENSIONS = [
  '**/*.mp4',
  '**/*.mov',
  '**/*.avi',
  '**/*.mkv',
  '**/*.webm',
  '**/*.wmv',
  '**/*.flv',
  '**/*.m4v',
  '**/*.gif',
  '**/*.ts',
  '**/*.mts',
  '**/*.3gp',
  '**/*.ogv',
];

const IGNORE_DIRS = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/build/**',
  '**/optimized/**',
  '**/.next/**',
  '**/out/**',
];

/**
 * Scan cwd for all video files.
 * Returns array of { name, fullPath, relativePath, size, sizeFormatted }
 */
export async function detectVideos(cwd = process.cwd(), customIgnore = []) {
  const ignore = [...IGNORE_DIRS, ...customIgnore];
  const matches = await fg(VIDEO_EXTENSIONS, {
    cwd,
    absolute: true,
    ignore,
    caseSensitiveMatch: false,
  });

  const files = matches.map((fullPath) => {
    const stat = fs.statSync(fullPath);
    const relativePath = path.relative(cwd, fullPath);
    return {
      name: path.basename(fullPath),
      fullPath,
      relativePath,
      size: stat.size,
      sizeFormatted: formatBytes(stat.size),
    };
  });

  // Sort by size descending (largest first — most impactful)
  return files.sort((a, b) => b.size - a.size);
}

