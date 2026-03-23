import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { printSummary } from '../src/summary.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('printSummary', () => {
  let tmpDir;
  let logs;
  let origLog;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vidx-summary-'));
    logs = [];
    origLog = console.log;
    console.log = (...args) => logs.push(args.join(' '));
  });

  afterEach(() => {
    console.log = origLog;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function makeResult({ inputName = 'video.mp4', outputName = 'video.mp4', inputSize = 10000, outputSize = 5000, success = true, durationMs = 1500 } = {}) {
    const outputPath = path.join(tmpDir, outputName);
    if (success && outputSize > 0) {
      fs.writeFileSync(outputPath, Buffer.alloc(outputSize));
    }
    return {
      job: {
        inputFile: { name: inputName, size: inputSize },
        outputPath,
        cmd: 'ffmpeg -i input.mp4 output.mp4',
      },
      success,
      durationMs,
      error: success ? undefined : 'encoding failed',
    };
  }

  it('should print summary without crashing', () => {
    const results = [makeResult()];
    expect(() => printSummary(results)).not.toThrow();
  });

  it('should show success count and total time', () => {
    printSummary([makeResult({ durationMs: 2000 }), makeResult({ durationMs: 3000 })]);

    const output = logs.join('\n');
    expect(output).toContain('2 of 2');
    expect(output).toContain('5.0s');
  });

  it('should show percentage reduction', () => {
    printSummary([makeResult({ inputSize: 10000, outputSize: 5000 })]);

    const output = logs.join('\n');
    expect(output).toContain('50% smaller');
  });

  it('should show FAILED for unsuccessful results', () => {
    printSummary([makeResult({ success: false })]);

    const output = logs.join('\n');
    expect(output).toContain('FAILED');
  });

  it('should show FFmpeg commands for successful results', () => {
    printSummary([makeResult()]);

    const output = logs.join('\n');
    expect(output).toContain('FFmpeg commands used');
    expect(output).toContain('ffmpeg -i input.mp4 output.mp4');
  });

  it('should show star/issue CTA when interactive', () => {
    printSummary([makeResult()], true);

    const output = logs.join('\n');
    expect(output).toContain('Star the repo');
    expect(output).toContain('Bug or idea');
  });

  it('should NOT show CTA when non-interactive', () => {
    printSummary([makeResult()], false);

    const output = logs.join('\n');
    expect(output).not.toContain('Star the repo');
  });

  it('should group results by input file', () => {
    printSummary([
      makeResult({ inputName: 'hero.mp4', outputName: 'hero.mp4' }),
      makeResult({ inputName: 'hero.mp4', outputName: 'hero.webm' }),
      makeResult({ inputName: 'intro.mov', outputName: 'intro.mp4' }),
    ]);

    const output = logs.join('\n');
    expect(output).toContain('hero.mp4');
    expect(output).toContain('intro.mov');
  });

  it('should handle zero-size input gracefully', () => {
    expect(() =>
      printSummary([makeResult({ inputSize: 0, outputSize: 0 })])
    ).not.toThrow();
  });

  it('should handle mixed success/failure results', () => {
    printSummary([
      makeResult({ success: true }),
      makeResult({ success: false, outputName: 'failed.mp4' }),
    ]);

    const output = logs.join('\n');
    expect(output).toContain('1 of 2');
  });
});
