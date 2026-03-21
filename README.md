# VidX 🎬

> **Video transformation for the web — without the FFmpeg pain.**

VidX is an interactive CLI tool that takes the pain out of optimizing videos for the web. Instead of memorizing cryptic FFmpeg flags, VidX walks you through a beautiful terminal UI — detect, select, configure, compress. Done.

---

## 🚀 Why VidX?

If you build websites, you know the pain of FFmpeg:
- Wrong flag order? Re-run.
- Forgot `-movflags +faststart`? Video won't stream.
- Need WebM too? Write it all again.
- Browser compatibility? CRF? Bitrates? **VidX handles it all.**

---

## 📦 Installation

```bash
# Install globally
npm install -g vidx

# Or run instantly with npx
npx vidx
```

VidX automatically detects if FFmpeg is installed. If not, it uses a bundled version — **zero extra setup needed.**

---

## 🛠 Features

- **Auto-Detection**: Scans your current project for video files.
- **Interactive TUI**: Easy selection and configuration.
- **Web Optimized Presets**: Expertly tuned for size vs quality.
- **Format Support**: Generate MP4, WebM, or both simultaneously.
- **Learn as you go**: Shows you the exact FFmpeg commands used.
- **Configurable**: Save settings to `.vidxrc` for one-click processing.
- **CI/CD Ready**: Supports non-interactive flags for pipelines.

---

## 📖 Usage

Just run `vidx` in any project folder:

```bash
vidx
```

### Config File (`.vidxrc`)
Tired of picking the same settings? Generate a config:
```bash
vidx init
```

### Non-Interactive Mode
Skip the TUI for scripts:
```bash
vidx --preset webOptimized --format both --resolution 720p --yes
```

---

## ⚖️ License

MIT © [Muhammad Usman](https://github.com/MuhammadUsmanGM)

---

> Built for web devs, by a web dev who got tired of FFmpeg flags.
