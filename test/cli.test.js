import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';

const BIN = path.resolve('bin/vidx.js');

function runCli(args = '') {
  try {
    return execSync(`node "${BIN}" ${args}`, {
      encoding: 'utf-8',
      timeout: 15000,
      env: { ...process.env, FORCE_COLOR: '0' },
    });
  } catch (err) {
    return err.stdout || err.stderr || err.message;
  }
}

describe('CLI', () => {
  // ── --version ──

  it('should print version with --version', () => {
    const output = runCli('--version');
    expect(output.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('should print version with -v', () => {
    const output = runCli('-v');
    expect(output.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  // ── --help ──

  it('should print help with --help', () => {
    const output = runCli('--help');
    expect(output).toContain('Usage');
    expect(output).toContain('vidx');
    expect(output).toContain('Options');
    expect(output).toContain('--preset');
    expect(output).toContain('--format');
    expect(output).toContain('--resolution');
    expect(output).toContain('--output');
    expect(output).toContain('--yes');
    expect(output).toContain('--dry-run');
  });

  it('should print help with -h', () => {
    const output = runCli('-h');
    expect(output).toContain('Usage');
  });

  // ── Commands ──

  it('should show the banner with VidX ASCII art', () => {
    const output = runCli('--help');
    expect(output).toContain('██');
  });

  it('should run "doctor" command without error', () => {
    const output = runCli('doctor');
    expect(output).toContain('System Check');
    expect(output).toContain('VidX version');
    expect(output).toContain('Node.js version');
    expect(output).toContain('FFmpeg status');
  });

  it('should run "list" command without error', () => {
    const output = runCli('list');
    // Should either find videos or say none found
    expect(output).toMatch(/Found \d+ video|No video files found/);
  });

  // ── Unknown command handling ──

  it('should reject unknown commands', () => {
    const output = runCli('foobar');
    expect(output).toContain('Unknown command');
    expect(output).toContain('foobar');
  });

  it('should suggest --help for unknown commands', () => {
    const output = runCli('notacommand');
    expect(output).toContain('--help');
  });

  // ── Invalid flag values ──

  it('should reject invalid --format values', () => {
    const output = runCli('--yes --format avi');
    expect(output).toContain('Invalid format');
  });

  it('should reject invalid --preset values', () => {
    const output = runCli('--yes --format mp4 --preset ultraHD');
    expect(output).toContain('Invalid preset');
  });

  it('should reject invalid --resolution values', () => {
    const output = runCli('--yes --format mp4 --preset webOptimized --resolution 4k');
    expect(output).toContain('Invalid resolution');
  });
});
