import { execSync } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';

let resolvedFfmpegPath = null;

/**
 * Detect FFmpeg on the system. Falls back to bundled static binary.
 * Returns { path, version, isSystem }
 */
export function detectFfmpeg() {
  if (resolvedFfmpegPath) return resolvedFfmpegPath;

  // Try system FFmpeg first
  try {
    const versionOutput = execSync('ffmpeg -version', { stdio: 'pipe' }).toString();
    const versionMatch = versionOutput.match(/ffmpeg version ([^\s]+)/);
    const version = versionMatch ? versionMatch[1] : 'unknown';
    resolvedFfmpegPath = { path: 'ffmpeg', version, isSystem: true };
    return resolvedFfmpegPath;
  } catch {
    // System FFmpeg not found — use static bundle
  }

  if (!ffmpegStatic) {
    throw new Error(
      'FFmpeg not found on your system and bundled version failed to load.\n' +
      'Please install FFmpeg manually: https://ffmpeg.org/download.html'
    );
  }

  resolvedFfmpegPath = { path: ffmpegStatic, version: 'bundled', isSystem: false };
  return resolvedFfmpegPath;
}

/**
 * Reset the cached FFmpeg path. Useful for testing.
 */
export function resetFfmpegCache() {
  resolvedFfmpegPath = null;
}
