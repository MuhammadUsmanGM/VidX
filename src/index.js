import chalk from 'chalk';
import ora from 'ora';
import { checkbox, select, input, confirm, number } from '@inquirer/prompts';
import { SingleBar, Presets } from 'cli-progress';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

import { detectVideos } from './detect.js';
import { detectFfmpeg } from './ffmpeg.js';
import { PRESETS, RESOLUTIONS, FORMATS, VALID_FORMATS } from './presets.js';
import { buildJobs } from './build-cmd.js';
import { printSummary } from './summary.js';
import { loadConfig } from './config.js';
import { formatBytes } from './utils.js';
import * as theme from './theme.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');
const VERSION = pkg.version;

let activeProcess = null;
let currentJob = null;

// ─── Single Global Interrupt Handler ─────────────────────────────────────────

process.on('SIGINT', () => {
  if (activeProcess) {
    activeProcess.kill('SIGKILL');
    activeProcess = null;
  }
  // Cleanup partial file for current active job
  if (currentJob && fs.existsSync(currentJob.outputPath)) {
    try { fs.unlinkSync(currentJob.outputPath); } catch {}
  }
  console.log(chalk.yellow('\n\n  ⚠ Interrupted. Process killed and partial files cleaned up.'));
  process.exit(0);
});


// ─── Banner ───────────────────────────────────────────────────────────────────

function printBanner() {
  console.log('');
  console.log(theme.brand('  ██╗   ██╗██╗██████╗ ██╗  ██╗'));
  console.log(theme.brandDeep('  ██║   ██║██║██╔══██╗╚██╗██╔╝'));
  console.log(theme.brand('  ██║   ██║██║██║  ██║ ╚███╔╝ '));
  console.log(theme.brandDeep('  ╚██╗ ██╔╝██║██║  ██║ ██╔██╗ '));
  console.log(theme.brand('   ╚████╔╝ ██║██████╔╝██╔╝ ██╗'));
  console.log(theme.brandDeep('    ╚═══╝  ╚═╝╚═════╝ ╚═╝  ╚═╝'));
  console.log('');
  console.log(chalk.dim('  Video transformation for the web — without the FFmpeg pain.'));
  console.log('');
}

// ─── Main Entry ───────────────────────────────────────────────────────────────

export async function run() {
  // Parse CLI args
  const args = process.argv.slice(2);
  const isNonInteractive = args.includes('--yes') || args.includes('-y');
  const isDryRun = args.includes('--dry-run');
  const isQuiet = args.includes('--quiet') || args.includes('-q');

  // ── Version & Help ──────────────────────────────────────────────────────────
  if (args.includes('--help') || args.includes('-h')) {
    printBanner();
    console.log(chalk.bold('  Usage:'));
    console.log(`    ${chalk.cyan('vidx')} [options]             ${chalk.dim('Run interactive TUI')}`);
    console.log(`    ${chalk.cyan('vidx <file>')}                 ${chalk.dim('Compress a specific file')}`);
    console.log(`    ${chalk.cyan('vidx list')}                   ${chalk.dim('List all videos and sizes')}`);
    console.log(`    ${chalk.cyan('vidx doctor')}                 ${chalk.dim('Check system health/FFmpeg')}`);
    console.log(`    ${chalk.cyan('vidx init')}                   ${chalk.dim('Generate .vidxrc config')}`);
    console.log('');
    console.log(chalk.bold('  Options:'));
    console.log(`    --preset <name>         webOptimized | highQuality | smallFile`);
    console.log(`    --format <type>         mp4 | webm | av1 (comma-separated for multiple)`);
    console.log(`    --resolution <res>      1080p | 720p | 480p | original`);
    console.log(`    --output <dir>          Output directory path`);
    console.log(`    --yes, -y               Skip confirmation prompts`);
    console.log(`    --dry-run               Show commands without executing`);
    console.log(`    --quiet, -q             Suppress banner/spinners; print errors + summary only`);
    console.log(`    --version, -v           Show version`);
    console.log(`    --help, -h              Show this help menu`);
    console.log('');
    return;
  }

  if (args.includes('--version') || args.includes('-v')) {
    console.log(VERSION);
    return;
  }

  // ── Handle Commands & Typos ────────────────────────────────────────────────
  const firstArg = args[0];
  const isCommand = firstArg && !firstArg.startsWith('-');
  const validCommands = ['list', 'doctor', 'init'];

  // Check if first arg is a direct file path (e.g. vidx hero.mp4)
  const isDirectFile = isCommand && !validCommands.includes(firstArg) && fs.existsSync(firstArg);

  if (isCommand && !validCommands.includes(firstArg) && !isDirectFile) {
    console.log(chalk.red(`\n  ✖ Unknown command: "${firstArg}"`));
    console.log(chalk.dim('    Check --help for a list of valid commands.\n'));
    return;
  }

  if (!isQuiet) printBanner();

  // Load config early for ignore/defaults
  const config = loadConfig();

  // Calculate dynamic ignore path
  const customOutputDir = getArg(args, '--output') || config?.outputDir || 'optimized';
  const ignorePatterns = [`**/${customOutputDir}/**`];

  // ── Handle Commands ────────────────────────────────────────────────────────
  if (args[0] === 'list') {
    const spinner = ora('Scanning videos...').start();
    const videos = await detectVideos(process.cwd(), ignorePatterns);
    spinner.stop();
    if (videos.length === 0) {
      console.log(chalk.yellow('  No video files found.'));
    } else {
      console.log(chalk.bold(`  📁 Found ${videos.length} videos:\n`));
      let total = 0;
      for (const v of videos) {
        console.log(`    ${chalk.dim('•')} ${v.relativePath.padEnd(46)} ${chalk.cyan(v.sizeFormatted)}`);
        total += v.size;
      }
      console.log(chalk.dim('  ─'.repeat(60)));
      console.log(`  ${chalk.bold(`${videos.length} videos — Total:`)} ${chalk.green(formatBytes(total))}\n`);
    }
    return;
  }

  if (args[0] === 'doctor') {
    console.log(chalk.bold('  🩺 VidX System Check:\n'));
    
    // Check VidX
    console.log(`    ${chalk.green('✔')} VidX version       : v${VERSION}`);

    // Check Node
    console.log(`    ${chalk.green('✔')} Node.js version    : ${process.version}`);

    // Check FFmpeg
    try {
      const ffmpeg = detectFfmpeg();
      const status = ffmpeg.isSystem ? chalk.green('System install') : chalk.yellow('Bundled static');
      console.log(`    ${chalk.green('✔')} FFmpeg status      : ${status} (v${ffmpeg.version})`);
    } catch (err) {
      console.log(`    ${chalk.red('✘')} FFmpeg status      : ${chalk.red('NOT FOUND')} - ${err.message}`);
    }

    // Check Permissions
    try {
      fs.accessSync(process.cwd(), fs.constants.W_OK);
      console.log(`    ${chalk.green('✔')} Write permission  : ${chalk.green('Granted')} (current directory)`);
    } catch {
      console.log(`    ${chalk.red('✘')} Write permission  : ${chalk.red('DENIED')} (current directory)`);
    }

    console.log('');
    return;
  }


  // Handle `vidx init`
  if (args[0] === 'init') {
    await runInit();
    return;
  }

  // ── Step 1: FFmpeg check ────────────────────────────────────────────────────
  const spinner = isQuiet ? null : ora('Checking for FFmpeg...').start();
  let ffmpeg;
  try {
    ffmpeg = detectFfmpeg();
    if (!isQuiet) {
      if (ffmpeg.isSystem) {
        spinner.succeed(chalk.green(`FFmpeg detected on your system (v${ffmpeg.version})`));
      } else {
        spinner.info(chalk.yellow('FFmpeg not found on system. Using bundled version...'));
      }
    }
  } catch (err) {
    if (spinner) spinner.fail(chalk.red(err.message));
    else console.error(chalk.red('  ✖ ' + err.message));
    process.exit(1);
  }

  if (config && !isQuiet) {
    console.log(chalk.dim(`  Config loaded from .vidxrc`));
  }

  // ── Step 2: Detect videos ──────────────────────────────────────────────────
  let selectedVideos;

  if (isDirectFile) {
    // Direct file mode: vidx hero.mp4
    const fullPath = path.resolve(process.cwd(), firstArg);
    const stat = fs.statSync(fullPath);
    selectedVideos = [{
      name: path.basename(fullPath),
      fullPath,
      relativePath: path.relative(process.cwd(), fullPath),
      size: stat.size,
      sizeFormatted: formatBytes(stat.size),
    }];
    if (!isQuiet) console.log(chalk.bold(`\n  📁 Direct file: ${selectedVideos[0].relativePath} (${selectedVideos[0].sizeFormatted})\n`));
  } else {
    const scanSpinner = isQuiet ? null : ora('Scanning project for video files...').start();
    let videos;
    try {
      videos = await detectVideos(process.cwd(), ignorePatterns);
      if (scanSpinner) scanSpinner.stop();
    } catch (err) {
      if (scanSpinner) scanSpinner.fail('Failed to scan for videos: ' + err.message);
      else console.error(chalk.red('  ✖ Failed to scan for videos: ' + err.message));
      process.exit(1);
    }

    if (videos.length === 0) {
      console.log(chalk.yellow('\n  No video files found in this directory.\n'));
      process.exit(0);
    }

    if (!isQuiet) console.log(chalk.bold(`\n  📁 Found ${videos.length} video${videos.length > 1 ? 's' : ''} in this project:\n`));

    // ── Step 3: Select videos ──────────────────────────────────────────────────
    if (isNonInteractive) {
      selectedVideos = videos;
    } else {
      console.log(chalk.dim('  [ Space ] select  ·  [ A ] all  ·  [ Enter ] confirm\n'));
      let chosen = [];
      while (chosen.length === 0) {
        chosen = await checkbox({
          message: 'Select videos to process',
          choices: videos.map((v) => ({
            name: `${v.relativePath.padEnd(42)} ${chalk.dim(v.sizeFormatted)}`,
            value: v,
            checked: videos.length === 1,
          })),
          pageSize: 12,
          instructions: false,   // suppress the default dim footer — our hint above is clearer
        });

        if (chosen.length === 0) {
          console.log(chalk.yellow('  ⚠  Nothing selected — press Space to select a file, then Enter.\n'));
        }
      }
      selectedVideos = chosen;
    }
  }

  // ── Small-file guard ───────────────────────────────────────────────────────
  const SMALL_FILE_THRESHOLD = 500 * 1024; // 500 KB
  const tinyFiles = selectedVideos.filter((v) => v.size < SMALL_FILE_THRESHOLD);

  if (tinyFiles.length > 0) {
    for (const v of tinyFiles) {
      console.log(
        chalk.yellow(`  ⚠ ${v.relativePath || v.name} is only ${v.sizeFormatted} — re-encoding tiny files rarely saves space.`)
      );
    }

    if (isNonInteractive || isQuiet) {
      // Auto-skip in CI / quiet mode
      selectedVideos = selectedVideos.filter((v) => v.size >= SMALL_FILE_THRESHOLD);
      if (selectedVideos.length === 0) {
        console.log(chalk.yellow('  All selected files are below 500 KB. Nothing to do.\n'));
        process.exit(0);
      }
      console.log(chalk.dim(`  Skipping ${tinyFiles.length} file(s) below 500 KB threshold.\n`));
    } else {
      const keepTiny = await confirm({
        message: `Continue processing ${tinyFiles.length > 1 ? 'these small files' : 'this small file'} anyway?`,
        default: false,
      });
      if (!keepTiny) {
        selectedVideos = selectedVideos.filter((v) => v.size >= SMALL_FILE_THRESHOLD);
        if (selectedVideos.length === 0) {
          console.log(chalk.yellow('\n  Nothing left to process. Exiting.\n'));
          process.exit(0);
        }
      }
    }
  }

  // ── Step 4: Output format ──────────────────────────────────────────────────
  let selectedFormats = null;

  // Parse --format flag (supports comma-separated: --format mp4,av1)
  const formatArg = getArg(args, '--format');
  if (formatArg) {
    selectedFormats = formatArg.split(',').map((f) => f.trim());
  }

  // Fall back to config formats array
  if (!selectedFormats && config?.formats) {
    selectedFormats = Array.isArray(config.formats) ? config.formats : [config.formats];
  }

  // Validate all format values
  if (selectedFormats) {
    const invalid = selectedFormats.find((f) => !VALID_FORMATS.includes(f));
    if (invalid) {
      console.log(chalk.red(`\n  ✖ Invalid format: "${invalid}". Expected mp4, webm, or av1.\n`));
      process.exit(1);
    }
  }

  // Interactive multi-select if no formats provided
  if (!selectedFormats) {
    selectedFormats = await checkbox({
      message: '🎯 Output format(s)?',
      choices: Object.entries(FORMATS).map(([key, f]) => ({
        name: f.label,
        value: key,
      })),
      instructions: chalk.dim('  Space to toggle · Enter to continue'),
    });

    if (!selectedFormats || selectedFormats.length === 0) {
      console.log(chalk.yellow('\n  No formats selected. Exiting.\n'));
      process.exit(0);
    }
  }

  // ── Step 5: Quality preset ─────────────────────────────────────────────────
  let presetKey = getArg(args, '--preset') || config?.preset || null;
  let customCfg = null;

  if (presetKey && !PRESETS[presetKey]) {
    console.log(chalk.red(`\n  ✖ Invalid preset: "${presetKey}". Check --help for options.\n`));
    process.exit(1);
  }

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
    const av1Crf = await number({ message: 'AV1 CRF (0–63, lower = better quality):', default: 35 });
    const av1Bitrate = await input({ message: 'AV1 audio bitrate:', default: '96k' });
    customCfg = {
      mp4: { crf: mp4Crf, preset: 'slow', audioBitrate: mp4Bitrate },
      webm: { crf: webmCrf, audioBitrate: webmBitrate },
      av1: { crf: av1Crf, audioBitrate: av1Bitrate },
    };
  }

  // ── Step 6: Resolution ─────────────────────────────────────────────────────
  let resolutionKey = getArg(args, '--resolution') || config?.resolution || null;

  if (resolutionKey && !RESOLUTIONS[resolutionKey]) {
    console.log(chalk.red(`\n  ✖ Invalid resolution: "${resolutionKey}". Check --help for options.\n`));
    process.exit(1);
  }

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
  if (!isNonInteractive && !isQuiet) {
    console.log('');
    console.log(chalk.bold('  ✅ Ready to process ' + selectedVideos.length + ' video' + (selectedVideos.length > 1 ? 's' : '')));
    console.log('');
    console.log(`     ${chalk.dim('Format     :')} ${selectedFormats.join(', ')}`);
    console.log(`     ${chalk.dim('Preset     :')} ${PRESETS[presetKey]?.label || 'Custom'}`);
    console.log(`     ${chalk.dim('Resolution :')} ${RESOLUTIONS[resolutionKey]?.label || resolutionKey}`);
    console.log(`     ${chalk.dim('Output     :')} ${path.relative(process.cwd(), outputDir)}/`);
    console.log('');

    // ── Estimated output sizes ──────────────────────────────────────────────
    // Approximate compression ratios derived from typical CRF targets per preset.
    // These are rough heuristics — actual results vary with source content.
    const EST_RATIOS = {
      webOptimized: { mp4: 0.20, webm: 0.15, av1: 0.12 },
      highQuality:  { mp4: 0.35, webm: 0.28, av1: 0.22 },
      smallFile:    { mp4: 0.12, webm: 0.09, av1: 0.07 },
      custom:       { mp4: 0.25, webm: 0.20, av1: 0.18 },
    };
    const ratios = EST_RATIOS[presetKey] || EST_RATIOS.custom;
    const totalInputBytes = selectedVideos.reduce((s, v) => s + v.size, 0);

    console.log(chalk.bold('  📊 Estimated output sizes (approximate):'));
    console.log('');
    for (const fmt of selectedFormats) {
      const ratio = ratios[fmt] ?? 0.20;
      const estBytes = Math.round(totalInputBytes * ratio);
      const estPct = Math.round(ratio * 100);
      console.log(
        `     ${chalk.dim(fmt.toUpperCase().padEnd(6))}  ${formatBytes(totalInputBytes).padStart(9)}  →  ` +
        `${chalk.cyan(formatBytes(estBytes).padStart(9))}  ${chalk.dim(`(~${estPct}% of original)`)}`
      );
    }
    console.log('');
    console.log(chalk.dim('     Estimates are based on typical CRF ratios and may vary significantly.'));
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
    formats: selectedFormats,
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

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    const counter = chalk.dim(`[${i + 1}/${jobs.length}]`);
    const label = `  ${counter} Processing ${job.inputFile.name} → ${path.basename(job.outputPath)}`;
    if (!isQuiet) console.log(chalk.bold(label));

    // In quiet mode we skip the progress bar entirely
    const bar = isQuiet ? null : new SingleBar(
      {
        format: `  ${theme.brandDim('{bar}')} {percentage}%  —  {status}  ${chalk.dim('·  eta {eta_formatted}')}`,
        barCompleteChar: '█',
        barIncompleteChar: '░',
        hideCursor: true,
        clearOnComplete: false,
      },
      Presets.shades_classic
    );

    if (bar) bar.start(100, 0, { status: 'starting...' });
    const start = Date.now();

    try {
      await runFfmpeg(job, bar);
      if (bar) { bar.update(100, { status: chalk.green('done ✔') }); bar.stop(); }
      results.push({ job, success: true, durationMs: Date.now() - start });
    } catch (err) {
      if (bar) bar.stop();
      console.error(chalk.red(`  ✖ Failed: ${err.message}`));
      results.push({ job, success: false, durationMs: Date.now() - start, error: err.message });
    }

    if (!isQuiet) console.log('');
  }

  // ── Step 10: Summary ───────────────────────────────────────────────────────
  printSummary(results, !isNonInteractive && !isQuiet, isQuiet);
}

// ─── FFmpeg runner ─────────────────────────────────────────────────────────────

function runFfmpeg(job, bar) {
  return new Promise((resolve, reject) => {
    currentJob = job;
    const proc = spawn(job.ffmpegPath, job.args, { stdio: ['ignore', 'pipe', 'pipe'] });
    activeProcess = proc;

    let duration = null;
    let stderrBuf = '';

    proc.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      stderrBuf += text;

      if (!bar) return; // quiet mode — skip all progress parsing

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
      activeProcess = null;
      currentJob = null;
      if (code === 0) resolve();
      else {
        // Delete partial file on FFmpeg error
        if (job.outputPath && fs.existsSync(job.outputPath)) {
          try { fs.unlinkSync(job.outputPath); } catch {}
        }
        const errLine = stderrBuf.split('\n').filter(Boolean).slice(-3).join(' | ');
        reject(new Error(`FFmpeg exited with code ${code}: ${errLine}`));
      }
    });

    proc.on('error', (err) => {
      activeProcess = null;
      currentJob = null;
      reject(err);
    });
  });
}

// ─── vidx init ─────────────────────────────────────────────────────────────────

async function runInit() {
  const configPath = path.join(process.cwd(), '.vidxrc');
  if (fs.existsSync(configPath)) {
    const overwrite = await confirm({
      message: '  ⚠ .vidxrc already exists. Overwrite?',
      default: false,
    });
    if (!overwrite) {
      console.log(chalk.dim('\n  Cancelled.\n'));
      return;
    }
  }

  console.log(theme.brand('\n  Generating .vidxrc config file...\n'));

  const preset = await select({
    message: 'Default preset?',
    choices: Object.entries(PRESETS)
      .filter(([k]) => k !== 'custom')
      .map(([key, p]) => ({ name: p.label, value: key })),
  });

  const formats = await checkbox({
    message: 'Default output format(s)?',
    choices: Object.entries(FORMATS).map(([key, f]) => ({
      name: f.label,
      value: key,
    })),
    instructions: chalk.dim('  Space to toggle · Enter to continue'),
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

