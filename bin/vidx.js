#!/usr/bin/env node

import { run } from '../src/index.js';

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
