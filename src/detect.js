import fg from 'fast-glob';
import path from 'path';
import fs from 'fs';

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
export async function detectVideos(cwd = process.cwd()) {
  const matches = await fg(VIDEO_EXTENSIONS, {
    cwd,
    absolute: true,
    ignore: IGNORE_DIRS,
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

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
