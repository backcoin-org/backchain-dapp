#!/usr/bin/env node

// create-backchain-app — Interactive CLI scaffolder
// Usage: npx create-backchain-app [project-name]

import { run } from '../src/index.js';

run(process.argv.slice(2)).catch((err) => {
    console.error('\n\x1b[31mError:\x1b[0m', err.message);
    process.exit(1);
});
