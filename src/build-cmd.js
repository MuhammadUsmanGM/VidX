import path from 'path';
import { PRESETS, RESOLUTIONS } from './presets.js';

/**
 * Build FFmpeg command arguments for a single input → output conversion.
 *
 * MP4 (H.264):
 *   - libx264, CRF-based quality, slow preset for better compression
 *   - pix_fmt yuv420p → required for browser playback + better compression efficiency
 *   - movflags +faststart → enables streaming before full download
 *   - map_metadata -1 → strips bloated embedded metadata
 *
 * WebM (VP9):
 *   - libvpx-vp9 in Constrained Quality mode (-b:v 0 -crf N)
 *   - IMPORTANT: -b:v 0 MUST come before -crf for VP9 constrained quality mode
 *   - deadline good + cpu-used 2 → critical for real compression (default is lossless-quality)
 *   - row-mt 1 → enables row-based multithreading for speed
 *   - map_metadata -1 → strips metadata
 */
export function buildCommand({ ffmpegPath, inputPath, outputPath, format, presetKey, resolutionKey, custom }) {
  if (presetKey === 'custom' && !custom) {
    throw new Error('Custom preset selected but no custom config provided.');
  }

  const resolution = RESOLUTIONS[resolutionKey];
  const preset = PRESETS[presetKey];

  // Base args
  const args = ['-i', inputPath, '-y', '-map_metadata', '-1'];

  if (format === 'mp4') {
    const cfg = presetKey === 'custom' ? custom.mp4 : preset.mp4;

    args.push('-c:v', 'libx264');
    args.push('-crf', String(cfg.crf));
    args.push('-preset', cfg.preset || 'slow');
    args.push('-pix_fmt', 'yuv420p');
    args.push('-maxrate', cfg.maxrate || '2M');     // caps bitrate ceiling
    args.push('-bufsize', cfg.bufsize || '4M');     // must pair with maxrate
    if (resolution.scale) args.push('-vf', resolution.scale);
    args.push('-c:a', 'aac');
    args.push('-b:a', cfg.audioBitrate || '96k');
    args.push('-movflags', '+faststart');      // stream before full download

  } else if (format === 'webm') {
    const cfg = presetKey === 'custom' ? custom.webm : preset.webm;

    args.push('-c:v', 'libvpx-vp9');
    args.push('-b:v', '0');                   // MUST be before -crf for constrained quality mode
    args.push('-crf', String(cfg.crf));       // constrained quality target
    args.push('-deadline', 'good');           // enables real compression (vs 'realtime')
    args.push('-cpu-used', '2');              // 0=best quality/slowest, 5=fastest/worst
    args.push('-row-mt', '1');               // row-based multithreading
    args.push('-threads', '4');              // prevent single-thread slowness
    if (resolution.scale) args.push('-vf', resolution.scale);
    args.push('-c:a', 'libopus');
    args.push('-b:a', cfg.audioBitrate || '80k');
  }

  args.push(outputPath);

  // Human-readable command string for display
  const cmd = [ffmpegPath, ...args]
    .map((a) => (a.includes(' ') ? `"${a}"` : a))
    .join(' ');

  return { cmd, args };
}

/**
 * Given a config object, produce all { inputPath, outputPath, format } jobs.
 */
export function buildJobs({ files, format, outputDir, presetKey, resolutionKey, custom, ffmpegPath }) {
  const jobs = [];

  const formats = format === 'both' ? ['mp4', 'webm'] : [format];

  for (const file of files) {
    const baseName = path.basename(file.name, path.extname(file.name));
    for (const fmt of formats) {
      const outputPath = path.join(outputDir, `${baseName}.${fmt}`);
      const { cmd, args } = buildCommand({
        ffmpegPath,
        inputPath: file.fullPath,
        outputPath,
        format: fmt,
        presetKey,
        resolutionKey,
        custom,
      });
      jobs.push({
        inputFile: file,
        outputPath,
        format: fmt,
        cmd,
        args,
        ffmpegPath,
      });
    }
  }

  return jobs;
}
