import chalk from 'chalk';
import ora from 'ora';
import { checkbox, select, input, confirm, number } from '@inquirer/prompts';
import { SingleBar, Presets } from 'cli-progress';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

import { detectVideos } from './detect.js';
import { detectFfmpeg } from './ffmpeg.js';
import { PRESETS, RESOLUTIONS, FORMATS } from './presets.js';
import { buildJobs } from './build-cmd.js';
import { printSummary } from './summary.js';
import { loadConfig } from './config.js';

// ─── Banner ───────────────────────────────────────────────────────────────────

function printBanner() {
  console.log('');
  console.log(chalk.bold.hex('#a78bfa')('  ██╗   ██╗██╗██████╗ ██╗  ██╗'));
  console.log(chalk.bold.hex('#7c3aed')('  ██║   ██║██║██╔══██╗╚██╗██╔╝'));
  console.log(chalk.bold.hex('#a78bfa')('  ██║   ██║██║██║  ██║ ╚███╔╝ '));
  console.log(chalk.bold.hex('#7c3aed')('  ╚██╗ ██╔╝██║██║  ██║ ██╔██╗ '));
  console.log(chalk.bold.hex('#a78bfa')('   ╚████╔╝ ██║██████╔╝██╔╝ ██╗'));
  console.log(chalk.bold.hex('#7c3aed')('    ╚═══╝  ╚═╝╚═════╝ ╚═╝  ╚═╝'));
  console.log('');
  console.log(chalk.dim('  Video transformation for the web — without the FFmpeg pain.'));
  console.log('');
}

// ─── Main Entry ───────────────────────────────────────────────────────────────

export async function run() {
  printBanner();

  // Parse CLI args for non-interactive mode
  const args = process.argv.slice(2);
  const isNonInteractive = args.includes('--yes') || args.includes('-y');
  const isDryRun = args.includes('--dry-run');

  // Handle `vidx init`
  if (args[0] === 'init') {
    await runInit();
    return;
  }

  // ── Step 1: FFmpeg check ────────────────────────────────────────────────────
  const spinner = ora('Checking for FFmpeg...').start();
  let ffmpeg;
  try {
    ffmpeg = detectFfmpeg();
    if (ffmpeg.isSystem) {
      spinner.succeed(chalk.green(`FFmpeg detected on your system (v${ffmpeg.version})`));
    } else {
      spinner.info(chalk.yellow('FFmpeg not found on system. Using bundled version...'));
    }
  } catch (err) {
    spinner.fail(chalk.red(err.message));
    process.exit(1);
  }

  // ── Load .vidxrc config if present ─────────────────────────────────────────
  const config = loadConfig();
  if (config) {
    console.log(chalk.dim(`  Config loaded from .vidxrc`));
  }

  // ── Step 2: Detect videos ──────────────────────────────────────────────────
  const scanSpinner = ora('Scanning project for video files...').start();
  let videos;
  try {
    videos = await detectVideos(process.cwd());
    scanSpinner.stop();
  } catch (err) {
    scanSpinner.fail('Failed to scan for videos: ' + err.message);
    process.exit(1);
  }

  if (videos.length === 0) {
    console.log(chalk.yellow('\n  No video files found in this directory.\n'));
    process.exit(0);
  }

  console.log(chalk.bold(`\n  📁 Found ${videos.length} video${videos.length > 1 ? 's' : ''} in this project:\n`));

  // ── Step 3: Select videos ──────────────────────────────────────────────────
  let selectedVideos;
  if (isNonInteractive) {
    selectedVideos = videos;
  } else {
    const chosen = await checkbox({
      message: 'Select videos to process',
      choices: videos.map((v) => ({
        name: `${v.relativePath.padEnd(42)} ${chalk.dim(v.sizeFormatted)}`,
        value: v,
        checked: true,
      })),
      pageSize: 12,
      instructions: chalk.dim('  Space to toggle · A to select all · Enter to continue'),
    });

    if (!chosen || chosen.length === 0) {
      console.log(chalk.yellow('\n  No videos selected. Exiting.\n'));
      process.exit(0);
    }
    selectedVideos = chosen;
  }

  // ── Step 4: Output format ──────────────────────────────────────────────────
  let format = getArg(args, '--format') || config?.formats?.join('+') || null;

  if (!format) {
    format = await select({
      message: '🎯 Output format?',
      choices: [
        { name: FORMATS.mp4.label, value: 'mp4' },
        { name: FORMATS.webm.label, value: 'webm' },
        { name: FORMATS.both.label, value: 'both' },
      ],
    });
  }

  // Normalize config format array (["mp4","webm"] → "both")
  if (Array.isArray(format)) {
    format = format.length === 2 ? 'both' : format[0];
  }

  // ── Step 5: Quality preset ─────────────────────────────────────────────────
  let presetKey = getArg(args, '--preset') || config?.preset || null;
  let customCfg = null;

  if (!presetKey) {
    presetKey = await select({
      message: '⚙️  Quality preset?',
      choices: Object.entries(PRESETS).map(([key, p]) => ({
        name: `${p.label.padEnd(18)} ${chalk.dim('— ' + p.description)}`,
        value: key,
      })),
    });
  }

  if (presetKey === 'custom') {
    const mp4Crf = await number({ message: 'MP4 CRF (0–51, lower = better quality):', default: 23 });
    const mp4Bitrate = await input({ message: 'MP4 audio bitrate:', default: '128k' });
    const webmCrf = await number({ message: 'WebM CRF (0–63, lower = better quality):', default: 33 });
    const webmBitrate = await input({ message: 'WebM audio bitrate:', default: '96k' });
    customCfg = {
      mp4: { crf: mp4Crf, preset: 'slow', audioBitrate: mp4Bitrate },
      webm: { crf: webmCrf, audioBitrate: webmBitrate },
    };
  }

  // ── Step 6: Resolution ─────────────────────────────────────────────────────
  let resolutionKey = getArg(args, '--resolution') || config?.resolution || null;

  if (!resolutionKey) {
    resolutionKey = await select({
      message: '📐 Resize?',
      choices: Object.entries(RESOLUTIONS).map(([key, r]) => ({
        name: r.label,
        value: key,
      })),
    });
  }

  // ── Step 7: Output directory ───────────────────────────────────────────────
  let outputDir = getArg(args, '--output') || config?.outputDir || null;

  if (!outputDir) {
    outputDir = await input({
      message: '📂 Save outputs to:',
      default: './optimized',
    });
  }

  outputDir = path.resolve(process.cwd(), outputDir);

  // ── Step 8: Confirmation ───────────────────────────────────────────────────
  if (!isNonInteractive) {
    console.log('');
    console.log(chalk.bold('  ✅ Ready to process ' + selectedVideos.length + ' video' + (selectedVideos.length > 1 ? 's' : '')));
    console.log('');
    console.log(`     ${chalk.dim('Format     :')} ${format}`);
    console.log(`     ${chalk.dim('Preset     :')} ${PRESETS[presetKey]?.label || 'Custom'}`);
    console.log(`     ${chalk.dim('Resolution :')} ${RESOLUTIONS[resolutionKey]?.label || resolutionKey}`);
    console.log(`     ${chalk.dim('Output     :')} ${path.relative(process.cwd(), outputDir)}/`);
    console.log('');

    if (isDryRun) {
      console.log(chalk.yellow('  --dry-run enabled. Printing commands but NOT running them.\n'));
    }

    const go = await confirm({ message: 'Go?', default: true });
    if (!go) {
      console.log(chalk.dim('\n  Cancelled.\n'));
      process.exit(0);
    }
  }

  // ── Create output dir ──────────────────────────────────────────────────────
  if (!isDryRun) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // ── Build jobs ──────────────────────────────────────────────────────────────
  const jobs = buildJobs({
    files: selectedVideos,
    format,
    outputDir,
    presetKey,
    resolutionKey,
    custom: customCfg,
    ffmpegPath: ffmpeg.path,
  });

  if (isDryRun) {
    console.log(chalk.cyan('\n  Commands that would run:\n'));
    for (const job of jobs) {
      console.log(chalk.dim('  ' + job.cmd));
      console.log('');
    }
    process.exit(0);
  }

  // ── Step 9: Process ────────────────────────────────────────────────────────
  console.log('');
  const results = [];

  for (const job of jobs) {
    const label = `  Processing ${job.inputFile.name} → ${path.basename(job.outputPath)}`;
    console.log(chalk.bold(label));

    const bar = new SingleBar(
      {
        format: `  ${chalk.hex('#7c3aed')('{bar}')} {percentage}%  —  {status}`,
        barCompleteChar: '█',
        barIncompleteChar: '░',
        hideCursor: true,
        clearOnComplete: false,
      },
      Presets.shades_classic
    );

    bar.start(100, 0, { status: 'starting...' });
    const start = Date.now();

    try {
      await runFfmpeg(job, bar);
      bar.update(100, { status: chalk.green('done ✔') });
      bar.stop();
      results.push({ job, success: true, durationMs: Date.now() - start });
    } catch (err) {
      bar.stop();
      console.log(chalk.red(`  ✖ Failed: ${err.message}`));
      results.push({ job, success: false, durationMs: Date.now() - start, error: err.message });
    }

    console.log('');
  }

  // ── Step 10: Summary ───────────────────────────────────────────────────────
  printSummary(results);
}

// ─── FFmpeg runner ─────────────────────────────────────────────────────────────

function runFfmpeg(job, bar) {
  return new Promise((resolve, reject) => {
    const proc = spawn(job.ffmpegPath, job.args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let duration = null;
    let stderrBuf = '';

    proc.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      stderrBuf += text;

      // Parse total duration
      if (!duration) {
        const m = stderrBuf.match(/Duration:\s*(\d+):(\d+):(\d+)\.(\d+)/);
        if (m) {
          duration =
            parseInt(m[1]) * 3600 +
            parseInt(m[2]) * 60 +
            parseInt(m[3]) +
            parseInt(m[4]) / 100;
        }
      }

      // Parse current time → progress
      const timeMatch = text.match(/time=(\d+):(\d+):(\d+)\.(\d+)/);
      if (timeMatch && duration) {
        const current =
          parseInt(timeMatch[1]) * 3600 +
          parseInt(timeMatch[2]) * 60 +
          parseInt(timeMatch[3]) +
          parseInt(timeMatch[4]) / 100;
        const pct = Math.min(Math.round((current / duration) * 100), 99);
        bar.update(pct, { status: `${pct}%` });
      }
    });

    proc.on('close', (code) => {
      if (code === 0) resolve();
      else {
        const errLine = stderrBuf.split('\n').filter(Boolean).slice(-3).join(' | ');
        reject(new Error(`FFmpeg exited with code ${code}: ${errLine}`));
      }
    });

    proc.on('error', reject);
  });
}

// ─── vidx init ─────────────────────────────────────────────────────────────────

async function runInit() {
  console.log(chalk.bold.hex('#a78bfa')('  Generating .vidxrc config file...\n'));

  const preset = await select({
    message: 'Default preset?',
    choices: Object.entries(PRESETS)
      .filter(([k]) => k !== 'custom')
      .map(([key, p]) => ({ name: p.label, value: key })),
  });

  const formats = await select({
    message: 'Default output format?',
    choices: [
      { name: 'Both (MP4 + WebM)', value: ['mp4', 'webm'] },
      { name: 'MP4 only', value: ['mp4'] },
      { name: 'WebM only', value: ['webm'] },
    ],
  });

  const resolution = await select({
    message: 'Default resolution?',
    choices: Object.entries(RESOLUTIONS).map(([key, r]) => ({ name: r.label, value: key })),
  });

  const outputDir = await input({ message: 'Default output directory:', default: './optimized' });

  const cfg = { preset, formats, resolution, outputDir };
  fs.writeFileSync(path.join(process.cwd(), '.vidxrc'), JSON.stringify(cfg, null, 2));
  console.log(chalk.green('\n  ✔ .vidxrc created successfully!\n'));
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getArg(args, flag) {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : null;
}
