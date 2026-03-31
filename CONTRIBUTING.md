# Contributing to VidX

Thanks for your interest in contributing to VidX! Every contribution matters — whether it's a bug fix, new feature, docs improvement, or just a typo.

## Getting Started

### Prerequisites

- **Node.js 18+**
- **Git**
- **FFmpeg** (optional — VidX falls back to a bundled binary)

### Setup

```bash
git clone https://github.com/MuhammadUsmanGM/VidX.git
cd VidX
npm install
npm link    # makes `vidx` available globally from your local build
```

### Running Tests

```bash
npm test            # run all tests once
npm run test:watch  # watch mode during development
```

All 90 tests must pass before submitting a PR.

## Project Structure

```
vidx/
├── bin/
│   └── vidx.js          ← CLI entry point
├── src/
│   ├── index.js         ← Main TUI flow + CLI arg parsing
│   ├── detect.js        ← Video file scanner
│   ├── ffmpeg.js        ← FFmpeg detection + fallback
│   ├── presets.js       ← Quality presets & codec config
│   ├── build-cmd.js     ← FFmpeg command builder
│   ├── config.js        ← .vidxrc loader
│   ├── summary.js       ← Results + savings report
│   └── theme.js         ← Brand colors & styles
├── test/                ← Vitest test files
├── CHANGELOG.md
└── package.json
```

## How to Contribute

### Reporting Bugs

Open an issue at [github.com/MuhammadUsmanGM/VidX/issues](https://github.com/MuhammadUsmanGM/VidX/issues) with:

- Steps to reproduce
- Expected vs actual behavior
- Your OS, Node version, and FFmpeg version (`vidx doctor` output is helpful)

### Suggesting Features

Open an issue with the **feature request** label. Describe the use case and why it would be useful.

### Submitting a Pull Request

1. **Fork** the repo and create a branch from `main`:
   ```bash
   git checkout -b fix/your-fix-name
   ```

2. **Make your changes** — keep them focused on a single issue.

3. **Add tests** for any new functionality. Tests live in `test/` and use [Vitest](https://vitest.dev/).

4. **Run the test suite** and make sure everything passes:
   ```bash
   npm test
   ```

5. **Commit** with a clear message:
   ```bash
   git commit -m "fix: handle edge case in GIF conversion"
   ```

6. **Push** and open a PR against `main`.

### Commit Message Convention

Use short, descriptive messages with a type prefix:

- `feat:` — new feature
- `fix:` — bug fix
- `refactor:` — code change that neither fixes a bug nor adds a feature
- `test:` — adding or updating tests
- `docs:` — documentation changes
- `chore:` — maintenance (deps, CI, build)

Examples:
```
feat: add --quiet flag for silent output
fix: correct negative savings display in summary
test: add tests for config format normalization
docs: update README installation instructions
```

## Code Guidelines

- **ESM only** — use `import`/`export`, not `require`.
- **No TypeScript** — the project is plain JavaScript.
- **Keep it simple** — avoid abstractions until they're clearly needed.
- **Test what you add** — new features need tests, bug fixes need regression tests.
- **No linting changes in feature PRs** — keep PRs focused on one thing.
- **Respect the UX** — VidX is built around a clean terminal experience. Keep output readable and branded.

## Development Tips

- Use `vidx doctor` to verify your local setup.
- Use `vidx --dry-run` to test command generation without running FFmpeg.
- Use `npm link` to test the CLI globally from your local build.
- The `--yes` flag skips prompts — useful for quick testing.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
