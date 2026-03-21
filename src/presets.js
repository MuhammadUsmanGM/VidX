/**
 * Quality presets — CRF values, codec settings, best-use descriptions.
 */
export const PRESETS = {
  webOptimized: {
    label: 'Web Optimized',
    description: 'Best balance of size and quality (recommended)',
    mp4: { crf: 23, preset: 'slow', audioBitrate: '128k' },
    webm: { crf: 33, audioBitrate: '96k' },
  },
  highQuality: {
    label: 'High Quality',
    description: 'Larger file, sharper image — hero videos, showcase pages',
    mp4: { crf: 18, preset: 'slow', audioBitrate: '192k' },
    webm: { crf: 24, audioBitrate: '128k' },
  },
  smallFile: {
    label: 'Small File',
    description: 'Maximum compression — background loops, mobile-first',
    mp4: { crf: 28, preset: 'slow', audioBitrate: '96k' },
    webm: { crf: 40, audioBitrate: '64k' },
  },
  custom: {
    label: 'Custom',
    description: 'Set CRF, bitrate, and codec manually',
    mp4: null,
    webm: null,
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
  both: { label: 'Both  — generate MP4 + WebM versions' },
};
