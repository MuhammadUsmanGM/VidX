# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.1] - 2026-04-01

### Added
- **`--quiet` / `-q` flag** — Suppresses the banner, spinners, and per-job progress bars.
  Only errors and the final summary are printed. Designed for clean CI log output.
- **Estimated output sizes** — The confirmation screen now shows a per-format size estimate
  (e.g. `MP4   142.3 MB → ~28.5 MB (~20% of original)`) based on typical CRF compression
  ratios, so users know what to expect before committing to a long encode.
- **Small-file guard** — Files under **500 KB** trigger a `⚠` warning.
  In interactive mode the user is asked to confirm before proceeding;
  in `--yes` / `--quiet` mode those files are **auto-skipped** to avoid pointless re-encodes.
- **Total time + total savings in summary** — A combined totals row is now printed at the
  bottom of every run (e.g. `Total   142.3 MB → 38.1 MB   73% smaller ✔  •  48.2s`),
  aggregating input size, output size, savings percentage, and wall-clock time across all jobs.
- **AV1 format** (`--format av1` / `--format mp4,webm,av1`) — Full SVT-AV1 encoding support
  via `libsvtav1` in CRF mode. Employs per-quality encoder presets (4-6) and `lookahead=120`
  to maximize compression efficiency. Uses `tune=0` for visual quality, `pix_fmt yuv420p`
  for browser compatibility, and `movflags +faststart` for streaming. Output is packed
  in an MP4 container as `.av1.mp4` for the broadest modern browser support.
  All three quality presets (`Web Optimized`, `High Quality`, `Small File`) now include
  tuned AV1 CRF values (38, 28, and 48 respectively).
- **`vidx <file>` direct file mode** — Pass a file path directly (e.g. `vidx hero.mp4`) to
  compress a single file without the interactive video picker.

### Fixed
- **`getUniquePath` compound-extension bug** — `path.extname('clip.av1.mp4')` returns `.mp4`,
  causing the collision counter to produce `clip.av1_1.mp4` instead of `clip_1.av1.mp4`.
  The function now splits on the *first* dot in the basename so the full compound extension
  (`.av1.mp4`) is treated as a single unit, yielding the correct `clip_1.av1.mp4`.

---

## [1.0.0] - 2026-03-21

### Added
- **Interactive TUI**: A beautiful terminal interface for selecting, configuring, and optimizing videos.
- **Web Presets**: Expertly tuned quality presets (`Web Optimized`, `High Quality`, `Small File`) for both MP4 (H.264) and WebM (VP9).
- **FFmpeg Auto-Discovery**: Automatically detects system-installed FFmpeg or falls back to a bundled `ffmpeg-static` binary for zero-config use.
- **Smart Scanning**: Recursive project-wide video detection with intelligent exclusion of `node_modules` and the `outputDir` (to avoid redundant processing).
- **CLI Command Suite**:
  - `vidx doctor`: System diagnostic check (Node version, FFmpeg presence, disk permissions).
  - `vidx list`: Fast non-interactive scan of project video assets and total space used.
  - `vidx init`: Interactive `.vidxrc` configuration generator.
- **UX Enhancements**:
  - Real-time **ETA** (Estimated Time of Arrival) tracking for all encoding processes.
  - Branded **Design System**: A cohesive orange/amber theme across ASCII art, progress bars, and success messages.
  - Professional CLI Flags: Support for `--yes`, `--dry-run`, `--help`, and `--version`.
- **Reliability & Safety**:
  - **Graceful Interrupts**: Centralized `SIGINT` (Ctrl+C) handling that kills processes and deletes partial/corrupted files.
  - **Collision Resolution**: Automatic filename versioning (`vid_1.mp4`, `vid_2.mp4`) instead of overwriting existing results.
  - **Bitrate Capping**: Implemented VBV (Video Buffering Verifier) with `-maxrate` covers to prevent oversized outputs on pre-optimized source videos.

### Fixed
- Fixed VP9 constrained quality flag order bug to ensure real compression gains.
- Optimized MP4 flag sequencing for maximum browser compatibility.
- Stripped bloated metadata from input files to save extra bytes.

---

> **VidX** — Built for web devs, by a web dev who got tired of FFmpeg flags. 🎬
