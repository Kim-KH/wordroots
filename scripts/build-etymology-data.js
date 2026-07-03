#!/usr/bin/env node
// Regenerates src/data/etymologyData.json from individual Part_Origin JSON files.
// Run after translate-data.js completes.
// Usage: node scripts/build-etymology-data.js

const fs   = require('fs');
const path = require('path');

const SRC_DIR   = path.resolve(__dirname, '../src/data');
const OUT_FILE  = path.resolve(__dirname, '../src/data/etymologyData.json');

function collectFiles(dir, base) {
  const results = [];
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const rel  = base ? `${base}/${entry}` : entry;
    if (fs.statSync(full).isDirectory()) {
      results.push(...collectFiles(full, rel));
    } else if (entry.endsWith('.json')) {
      results.push({ full, rel });
    }
  }
  return results;
}

// Collect from all Part_* directories
const partDirs = fs.readdirSync(SRC_DIR).filter(
  (name) => name.startsWith('Part_') && fs.statSync(path.join(SRC_DIR, name)).isDirectory()
);
const files = partDirs.flatMap((dir) => collectFiles(path.join(SRC_DIR, dir), dir));
console.log(`Building etymologyData.json from ${files.length} files (${partDirs.join(', ')})...`);

const output = {};
for (const { full, rel } of files) {
  output[rel] = JSON.parse(fs.readFileSync(full, 'utf8'));
}

fs.writeFileSync(OUT_FILE, JSON.stringify(output), 'utf8');

const sizeMB = (fs.statSync(OUT_FILE).size / 1024 / 1024).toFixed(2);
console.log(`Done. ${OUT_FILE} (${sizeMB} MB)`);
