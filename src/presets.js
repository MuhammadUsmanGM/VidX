/**
 * Quality presets — CRF values, codec settings, best-use descriptions.
 *
 * CRF for libx264: 0–51 (lower = better quality, bigger file). Web sweet spot: 24–28
 * CRF for libvpx-vp9: 0–63 (lower = better quality, bigger file). Web sweet spot: 33–40
 * CRF for libsvtav1: 0–63 (lower = better quality, bigger file). Web sweet spot: 30–40
 */
export const PRESETS = {
  webOptimized: {
    label: 'Web Optimized',
    description: 'Best balance of size and quality (recommended)',
    mp4: { crf: 32, preset: 'slow', audioBitrate: '96k', maxrate: '1500k', bufsize: '3000k' },
    webm: { crf: 42, audioBitrate: '80k' },
    av1: { crf: 38, audioBitrate: '96k' },
  },
  highQuality: {
    label: 'High Quality',
    description: 'Larger file, sharper image — hero videos, showcase pages',
    mp4: { crf: 24, preset: 'slow', audioBitrate: '128k', maxrate: '3000k', bufsize: '6000k' },
    webm: { crf: 32, audioBitrate: '96k' },
    av1: { crf: 28, audioBitrate: '128k' },
  },
  smallFile: {
    label: 'Small File',
    description: 'Maximum compression — background loops, mobile-first',
    mp4: { crf: 38, preset: 'slow', audioBitrate: '64k', maxrate: '800k', bufsize: '1600k' },
    webm: { crf: 50, audioBitrate: '48k' },
    av1: { crf: 48, audioBitrate: '64k' },
  },
  custom: {
    label: 'Custom',
    description: 'Set CRF, bitrate, and codec manually',
    mp4: null,
    webm: null,
    av1: null,
  },
};

export const RESOLUTIONS = {
  original: { label: 'Keep original', scale: null },
  '1080p': { label: '1080p  (1920×1080)', scale: 'scale=-2:1080' },
  '720p': { label: '720p   (1280×720)', scale: 'scale=-2:720' },
  '480p': { label: '480p   (854×480)', scale: 'scale=-2:480' },
};

export const FORMATS = {
  mp4: { label: 'MP4   — H.264, best browser compatibility' },
  webm: { label: 'WebM  — VP9, best compression for web' },
  av1: { label: 'AV1   — SVT-AV1 in MP4, next-gen compression' },
};

export const VALID_FORMATS = ['mp4', 'webm', 'av1'];
