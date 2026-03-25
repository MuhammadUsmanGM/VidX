# VidX 🎬

<p align="left">
  <img src="https://img.shields.io/npm/v/@mugm/vidx?color=f97316&style=flat-square" alt="npm version">
  <img src="https://img.shields.io/github/license/MuhammadUsmanGM/VidX?color=ea580c&style=flat-square" alt="license">
  <img src="https://img.shields.io/bundlephobia/min/@mugm/vidx?color=fb923c&style=flat-square" alt="install size">
  <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-f97316?style=flat-square" alt="platforms">
  <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-f97316?style=flat-square" alt="node version">
  <img src="https://img.shields.io/github/stars/MuhammadUsmanGM/VidX?style=flat-square&color=ea580c" alt="stars">
</p>

> **Video transformation for the web — without the FFmpeg pain.**

VidX is an interactive CLI tool that takes the pain out of optimizing videos for the web. Instead of memorizing cryptic FFmpeg flags, VidX walks you through a beautiful terminal UI — detect, select, configure, compress. Done.

---

## 🎬 See It In Action

![VidX Demo](./public/vidx.gif)

---

## 🚀 Why VidX?

Every web dev who works with video knows this moment:

```bash
ffmpeg -i hero.mp4 -c:v libx264 -crf 23 -preset slow -movflags +faststart -c:a aac -b:a 128k out.mp4
```

Wrong flag? Re-run. Need WebM too? Write it all again.  
Forgot `-movflags +faststart`? Your video won't stream properly.  
Need to resize? Add more flags you'll never remember.

**VidX replaces all of that with a simple interactive flow.**

---

## 📦 Installation

> Requires **Node.js 18+**

```bash
# Install globally (recommended)
npm install -g @mugm/vidx

# Or run instantly without installing
npx @mugm/vidx
```

VidX automatically detects if FFmpeg is installed on your system. If not, it silently falls back to a bundled version — **zero manual setup needed on any platform.**

---

## 📖 Usage

Navigate to any project folder and run:

```bash
vidx
```

VidX will scan for videos, walk you through your options, and handle the rest.

---

## 🧰 Commands

| Command | Description |
|---|---|
| `vidx` | Launch the interactive TUI |
| `vidx list` | List all video files and their sizes |
| `vidx init` | Generate a `.vidxrc` config file |
| `vidx doctor` | Check FFmpeg and system status |

---

## ⚙️ Options

| Flag | Values | Description |
|---|---|---|
| `--preset` | `webOptimized` `highQuality` `smallFile` | Quality preset |
| `--format` | `mp4` `webm` `both` | Output format |
| `--resolution` | `1080p` `720p` `480p` `original` | Output resolution |
| `--output` | any path | Output directory |
| `--yes, -y` | — | Skip all prompts (CI/CD mode) |
| `--dry-run` | — | Print FFmpeg commands without running |
| `--version, -v` | — | Show version |
| `--help, -h` | — | Show help |

### Non-Interactive Mode

Perfect for build scripts and CI/CD pipelines:

```bash
vidx --preset webOptimized --format both --resolution 720p --output ./dist/videos --yes
```

---

## 🎛️ Presets

| Preset | MP4 CRF | WebM CRF | Best For |
|---|---|---|---|
| **Web Optimized** ⭐ | 32 | 42 | Most websites — great balance of size and quality |
| **High Quality** | 24 | 32 | Hero videos, product showcases, landing pages |
| **Small File** | 38 | 50 | Background loops, mobile-first, maximum compression |
| **Custom** | You choose | You choose | Full manual control over CRF and bitrate |

> **What is CRF?** Constant Rate Factor controls quality. Lower = better quality, bigger file. Higher = smaller file, more compression. VidX picks the right value for each use case automatically.

---

## 💾 Config File (`.vidxrc`)

Tired of picking the same settings every time? Save them once:

```bash
vidx init
```

This generates a `.vidxrc` in your project root:

```json
{
  "preset": "webOptimized",
  "formats": ["mp4", "webm"],
  "resolution": "720p",
  "outputDir": "./optimized"
}
```

Next time you run `vidx`, it loads your config and skips straight to the confirmation step.

---

## 🌐 Output Formats

| Format | Codec | Audio | Notes |
|---|---|---|---|
| **MP4** | H.264 (libx264) | AAC | Best compatibility — works in every browser |
| **WebM** | VP9 (libvpx-vp9) | Opus | Best compression — ideal for modern browsers |

**Pro tip:** Generate both formats and let the browser pick the best one:

```html
<video autoplay muted loop playsinline>
  <source src="hero.webm" type="video/webm">
  <source src="hero.mp4"  type="video/mp4">
</video>
```

> **⚡ GIF Optimization:** VidX automatically handles `.gif` inputs by converting them into tiny, high-performance auto-playing videos. It strips the silent audio track (`-an`) to ensure the smallest possible file size with zero loss in quality.

---

## 🖥️ Platform Support

| Platform | Status |
|---|---|
| macOS | ✅ Supported |
| Windows | ✅ Supported |
| Linux | ✅ Supported |

FFmpeg is auto-detected from your system. If not found, VidX uses a bundled binary — no manual install required on any platform.

---

## 🗂️ Project Structure

```
vidx/
├── bin/
│   └── vidx.js          ← CLI entry point
└── src/
    ├── index.js         ← Main TUI flow
    ├── detect.js        ← Video file scanner
    ├── ffmpeg.js        ← FFmpeg detection + fallback
    ├── presets.js       ← Quality presets & codec config
    ├── build-cmd.js     ← FFmpeg command builder
    ├── config.js        ← .vidxrc loader
    ├── summary.js       ← Results + savings report
    └── theme.js         ← Brand colors & styles
```

---

## 🤝 Contributing

Pull requests are welcome. For major changes, open an issue first.

```bash
git clone https://github.com/MuhammadUsmanGM/VidX
cd VidX
npm install
npm link       # makes `vidx` available globally from local build
```

---

## ⚖️ License

MIT © [Muhammad Usman](https://github.com/MuhammadUsmanGM)

---

<div align="center">

**VidX** — built for web devs, by a web dev who got tired of FFmpeg flags.

`npm install -g @mugm/vidx`

⭐ If VidX saves you time, consider starring the repo — it helps others find it.

</div>