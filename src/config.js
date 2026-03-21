import fs from 'fs';
import path from 'path';

/**
 * Load .vidxrc from the current working directory.
 * Returns parsed config object or null if not found.
 */
export function loadConfig(cwd = process.cwd()) {
  const configPath = path.join(cwd, '.vidxrc');
  if (!fs.existsSync(configPath)) return null;

  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    console.warn('  ⚠ Could not parse .vidxrc — using defaults.');
    return null;
  }
}
