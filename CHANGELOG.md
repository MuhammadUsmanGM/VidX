# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
