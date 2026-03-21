import path from 'path';
import { PRESETS, RESOLUTIONS } from './presets.js';

/**
 * Build FFmpeg command arguments for a single input → output conversion.
 *
 * @param {object} opts
 * @param {string} opts.ffmpegPath - path to ffmpeg binary
 * @param {string} opts.inputPath  - absolute path to input file
 * @param {string} opts.outputPath - absolute path to output file
 * @param {'mp4'|'webm'} opts.format
 * @param {string} opts.presetKey  - key in PRESETS
 * @param {string} opts.resolutionKey - key in RESOLUTIONS
 * @param {object} [opts.custom]   - custom CRF/bitrate if presetKey === 'custom'
 * @returns {{ cmd: string, args: string[] }}
 */
export function buildCommand({ ffmpegPath, inputPath, outputPath, format, presetKey, resolutionKey, custom }) {
  const resolution = RESOLUTIONS[resolutionKey];
  const preset = PRESETS[presetKey];

  const args = ['-i', inputPath, '-y'];

  if (format === 'mp4') {
    const cfg = presetKey === 'custom' ? custom.mp4 : preset.mp4;
    args.push('-c:v', 'libx264');
    args.push('-crf', String(cfg.crf));
    args.push('-preset', cfg.preset || 'slow');
    if (resolution.scale) args.push('-vf', resolution.scale);
    args.push('-movflags', '+faststart');
    args.push('-c:a', 'aac');
    args.push('-b:a', cfg.audioBitrate || '128k');
  } else if (format === 'webm') {
    const cfg = presetKey === 'custom' ? custom.webm : preset.webm;
    args.push('-c:v', 'libvpx-vp9');
    args.push('-crf', String(cfg.crf));
    args.push('-b:v', '0');
    if (resolution.scale) args.push('-vf', resolution.scale);
    args.push('-c:a', 'libopus');
    args.push('-b:a', cfg.audioBitrate || '96k');
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
