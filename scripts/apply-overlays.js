#!/usr/bin/env node
/**
 * apply-overlays.js
 * Applies i18n/overlay_en/ja/zh/fr translations to Part_Prefixes, Part_Roots, Part_Suffixes.
 * (Part_Origin was already handled by translate-data.js)
 *
 * For each unconverted word:
 *   - note      → {ko, en, ja, zh, fr} from overlays
 *   - translation → {ko, ja, zh, fr} from overlays
 *   - analysis[].meaning → {ko, en}  (ja/zh/fr fall back to en at runtime)
 *   - root_info.meaning  → {ko, en}  (ja/zh/fr fall back to en at runtime)
 *   - word.meaning field → {ko, en}  (ja/zh/fr fall back to en at runtime)
 *
 * Usage: node scripts/apply-overlays.js
 */

const fs   = require('fs');
const path = require('path');

const SRC    = path.resolve(__dirname, '../src/data');
const I18N   = path.resolve(SRC, 'i18n');
const LANGS  = ['en', 'ja', 'zh', 'fr'];
const DIRS   = ['Part_Prefixes', 'Part_Roots', 'Part_Suffixes'];

// ── Load overlay files ────────────────────────────────────────────────────────

const overlays = {};
for (const lang of LANGS) {
  const file = path.join(I18N, `overlay_${lang}.json`);
  overlays[lang] = JSON.parse(fs.readFileSync(file, 'utf8'));
}
console.log(`Loaded overlays: ${LANGS.map((l) => `${l}(${Object.keys(overlays[l]).length})`).join(', ')}\n`);

// ── Korean character detection ────────────────────────────────────────────────

function isKorean(text) {
  return /[가-힣]/.test(text);
}

// Smart extract: handles both "English (Korean)" and "Korean (English)"
function smartExtractKo(text) {
  if (!text) return '';
  const m = text.match(/\(([^)]+)\)\s*$/);
  if (!m) return text;
  const outside = text.replace(/\s*\([^)]+\)\s*$/, '').trim();
  return isKorean(outside) ? outside : m[1];
}

function smartExtractEn(text) {
  if (!text) return text ?? '';
  const m = text.match(/\(([^)]+)\)\s*$/);
  if (!m) return text;
  const outside = text.replace(/\s*\([^)]+\)\s*$/, '').trim();
  return isKorean(outside) ? m[1] : outside;
}

// ── Conversion checks ─────────────────────────────────────────────────────────

function meaningIsConverted(m) {
  return m == null || typeof m === 'object';
}

function wordIsConverted(word) {
  return (
    (word.note == null || typeof word.note === 'object')
    && (word.translation == null || typeof word.translation === 'object')
    && (!word.analysis?.length || meaningIsConverted(word.analysis[0].meaning))
  );
}

// ── Apply to a single JSON file ───────────────────────────────────────────────

function processFile(filePath) {
  const data    = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let changed   = false;

  // root_info.meaning
  if (data.root_info && !meaningIsConverted(data.root_info.meaning)) {
    const ko = smartExtractKo(data.root_info.meaning);
    const en = smartExtractEn(data.root_info.meaning);
    data.root_info.meaning = { ko, en };
    changed = true;
  }

  for (const word of (data.words ?? [])) {
    if (wordIsConverted(word)) continue;

    const ov = {};
    for (const lang of LANGS) {
      ov[lang] = overlays[lang][word.word] ?? null;
    }

    // analysis[].meaning → {ko, en}
    if (word.analysis) {
      for (const a of word.analysis) {
        if (!meaningIsConverted(a.meaning)) {
          a.meaning = {
            ko: smartExtractKo(a.meaning),
            en: smartExtractEn(a.meaning),
          };
        }
      }
    }

    // word-level meaning field → {ko, en}  (e.g. "to stick (들러붙다)")
    if (word.meaning && typeof word.meaning === 'string') {
      word.meaning = {
        ko: smartExtractKo(word.meaning),
        en: smartExtractEn(word.meaning),
      };
    }

    // note
    if (word.note && typeof word.note === 'string') {
      word.note = {
        ko: word.note,
        en: ov.en?.note ?? '',
        ja: ov.ja?.note ?? '',
        zh: ov.zh?.note ?? '',
        fr: ov.fr?.note ?? '',
      };
    }

    // translation
    if (word.translation && typeof word.translation === 'string') {
      const koTr = word.translation;
      word.translation = {
        ko: koTr,
        ja: ov.ja?.translation ?? '',
        zh: ov.zh?.translation ?? '',
        fr: ov.fr?.translation ?? '',
      };
    }

    changed = true;
    process.stdout.write(`  ${word.word} ✓\n`);
  }

  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf8');
  }
  return changed;
}

// ── Walk directories ──────────────────────────────────────────────────────────

function collectFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) results.push(...collectFiles(full));
    else if (entry.endsWith('.json'))     results.push(full);
  }
  return results;
}

// ── Main ─────────────────────────────────────────────────────────────────────

let totalFiles = 0, changedFiles = 0;

for (const dirName of DIRS) {
  const dirPath = path.join(SRC, dirName);
  if (!fs.existsSync(dirPath)) { console.log(`Skipping ${dirName} (not found)`); continue; }

  const files = collectFiles(dirPath);
  console.log(`\n[${dirName}] ${files.length} files`);

  for (const file of files) {
    const rel = path.relative(SRC, file);
    process.stdout.write(`${rel}\n`);
    const changed = processFile(file);
    if (changed) changedFiles++;
    totalFiles++;
  }
}

console.log(`\nDone. ${changedFiles}/${totalFiles} files updated.`);
console.log('Now run: node scripts/build-etymology-data.js');
