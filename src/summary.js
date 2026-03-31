import fs from 'fs';
import chalk from 'chalk';
import { formatBytes } from './utils.js';

/**
 * Print the final summary after all jobs complete.
 *
 * @param {boolean} isInteractive
 */
export function printSummary(results, isInteractive = false) {
  const totalMs = results.reduce((acc, r) => acc + (r.durationMs || 0), 0);
  const totalSec = (totalMs / 1000).toFixed(1);

  const successCount = results.filter((r) => r.success).length;

  console.log('');
  console.log(chalk.green.bold(`🎉 Done! ${successCount} of ${results.length} outputs processed in ${totalSec}s`));
  console.log('');

  // Group by input file
  const byInput = new Map();
  for (const r of results) {
    const key = r.job.inputFile.name;
    if (!byInput.has(key)) byInput.set(key, []);
    byInput.get(key).push(r);
  }

  for (const [inputName, fileResults] of byInput) {
    console.log(chalk.cyan.bold(`  ${inputName}`));
    for (const r of fileResults) {
      if (!r.success) {
        console.log(chalk.red(`    → ${r.job.outputPath}  ${chalk.dim('FAILED:')} ${r.error}`));
        continue;
      }

      const inputSize = r.job.inputFile.size;
      const outputSize = getFileSize(r.job.outputPath);
      const saved = inputSize - outputSize;
      const savedPct = inputSize > 0 ? Math.round((saved / inputSize) * 100) : 0;

      const outputName = r.job.outputPath.split(/[\\/]/).pop();
      const inFmt = formatBytes(inputSize);
      const outFmt = formatBytes(outputSize);

      const sizeLabel = saved >= 0
        ? chalk.yellow(`(${savedPct}% smaller) ✔`)
        : chalk.red(`(${Math.abs(savedPct)}% larger) ⚠`);

      console.log(
        `    ${chalk.dim('→')} ${chalk.white(outputName.padEnd(36))}` +
        `${chalk.dim(inFmt.padStart(10))}  ${chalk.dim('→')}  ` +
        `${chalk.green(outFmt.padStart(10))}  ` +
        sizeLabel
      );
    }
    console.log('');
  }

  // FFmpeg commands footer
  const successful = results.filter((r) => r.success);
  if (successful.length > 0) {
    console.log(chalk.dim('─'.repeat(60)));
    console.log(chalk.dim('  FFmpeg commands used:'));
    console.log('');
    for (const r of successful) {
      console.log(chalk.dim(`  ${wordWrapCmd(r.job.cmd, 80)}`));
      console.log('');
    }
    console.log(chalk.dim('─'.repeat(60)));
  }

  // CTA Footer for humans
  if (isInteractive) {
    console.log('');
    console.log(chalk.dim('  ⭐ Like VidX? Star the repo  →  github.com/MuhammadUsmanGM/VidX'));
    console.log(chalk.dim('  🐛 Bug or idea? Open an issue →  github.com/MuhammadUsmanGM/VidX/issues'));
    console.log('');
  }
}

function getFileSize(filePath) {
  try {
    return fs.statSync(filePath).size;
  } catch {
    return 0;
  }
}

function wordWrapCmd(cmd, maxLen) {
  if (cmd.length <= maxLen) return cmd;
  const parts = cmd.split(' ');
  const lines = [];
  let current = '';
  for (const part of parts) {
    if ((current + ' ' + part).length > maxLen && current.length > 0) {
      lines.push(current + ' \\');
      current = '    ' + part;
    } else {
      current = current ? current + ' ' + part : part;
    }
  }
  if (current) lines.push(current);
  return lines.join('\n  ');
}
