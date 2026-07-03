#!/usr/bin/env node
/**
 * translate-data.js — Direction A: embed multilingual content in all JSON data files
 *
 * Usage (Windows PowerShell):
 *   $env:ANTHROPIC_API_KEY = "sk-ant-..."
 *   node scripts/translate-data.js
 *
 * - Safe to interrupt and re-run: already-converted words are skipped.
 * - Saves progress after each word so nothing is lost on crash.
 * - Retries failed words up to 2 times automatically.
 */

const https = require('https');
const fs   = require('fs');
const path = require('path');

const API_KEY = process.env.ANTHROPIC_API_KEY;

const TARGET_DIRS = [
  path.resolve(__dirname, '../src/data/Part_Prefixes'),
  path.resolve(__dirname, '../src/data/Part_Roots'),
  path.resolve(__dirname, '../src/data/Part_Suffixes'),
];

if (!API_KEY) {
  console.error('ERROR: ANTHROPIC_API_KEY environment variable is not set.');
  console.error('  $env:ANTHROPIC_API_KEY = "sk-ant-..."   (PowerShell)');
  process.exit(1);
}

// ── Extract helpers for legacy string formats ────────────────────────────────

function extractKo(meaning) {
  if (!meaning) return '';
  if (typeof meaning === 'object') return meaning.ko ?? '';
  return meaning.replace(/\s*\([^)]+\)\s*$/, '').replace(/'/g, '').trim();
}

function extractEn(meaning) {
  if (!meaning) return '';
  if (typeof meaning === 'object') return meaning.en ?? '';
  const m = meaning.match(/\(([^)]+)\)\s*$/);
  return m ? m[1] : meaning.replace(/'/g, '').trim();
}

// ── Check whether a word already has the multilingual format ─────────────────

function isConverted(word) {
  const noteOk = !word.note  // empty string / null / undefined = no note needed
    || (typeof word.note === 'object' && !!word.note.ja);
  return (
    noteOk
    && word.translation && typeof word.translation === 'object' && word.translation.ja
    && (!word.analysis?.length || word.analysis[0].meaning?.ja)
    && (!word.meaning || (typeof word.meaning === 'object' && word.meaning.ja))
  );
}

function isRootConverted(root_info) {
  return !root_info.meaning
    || (typeof root_info.meaning === 'object' && root_info.meaning.ja);
}

// ── Robust JSON extraction — handles code fences, trailing commas ─────────────

function extractAndParseJSON(text) {
  // Strip markdown code fences
  let clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

  // Find the outermost { ... } correctly (respects nested braces and strings)
  const start = clean.indexOf('{');
  if (start === -1) throw new Error('No JSON object found in response');

  let depth = 0, end = -1, inString = false, escaped = false;
  for (let i = start; i < clean.length; i++) {
    const ch = clean[i];
    if (escaped)                        { escaped = false; continue; }
    if (ch === '\\' && inString)        { escaped = true;  continue; }
    if (ch === '"')                     { inString = !inString; continue; }
    if (inString)                       { continue; }
    if (ch === '{')                     { depth++; }
    else if (ch === '}') { if (--depth === 0) { end = i; break; } }
  }

  if (end === -1) throw new Error('Unbalanced braces in JSON response');
  let jsonStr = clean.slice(start, end + 1);

  // Attempt 1 — direct parse
  try { return JSON.parse(jsonStr); } catch (_) {}

  // Attempt 2 — fix trailing commas before } or ]
  jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');
  try { return JSON.parse(jsonStr); } catch (_) {}

  // Attempt 3 — remove literal newlines inside strings
  jsonStr = jsonStr.replace(/"([^"]*)"/g, (_, s) =>
    '"' + s.replace(/\r?\n/g, ' ').replace(/\t/g, ' ') + '"'
  );
  return JSON.parse(jsonStr);
}

// ── Anthropic API call (raw HTTPS, no SDK needed) ────────────────────────────

function callClaude(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const req = https.request(
      {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type':      'application/json',
          'x-api-key':         API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Length':    Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) return reject(new Error(parsed.error.message));
            resolve(parsed.content?.[0]?.text ?? '');
          } catch (e) {
            reject(new Error('Failed to parse API response'));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Build translation prompt ──────────────────────────────────────────────────

function buildPrompt(wordData) {
  const analyses = (wordData.analysis ?? []).map((a, i) => {
    const ko = extractKo(a.meaning);
    const en = extractEn(a.meaning);
    return `  ${i + 1}. ko: ${ko} / en: ${en}`;
  });

  const wordMeaningKo = extractKo(wordData.meaning);
  const wordMeaningEn = extractEn(wordData.meaning);
  const noteKo = typeof wordData.note === 'object' ? (wordData.note?.ko ?? '') : (wordData.note ?? '');

  return `You are translating content for an English etymology learning app.
Translate to Japanese (ja), Simplified Chinese (zh), and French (fr).
Rules:
- Morpheme meanings and word meanings: 1-4 words only
- Do NOT use double-quote characters inside any string value (use single quotes if needed)
- Return ONLY a raw JSON object, no markdown, no explanation

Word: ${wordData.word}
Word meaning (ko: ${wordMeaningKo} / en: ${wordMeaningEn}) — add ja/zh/fr (1-4 words each)

Analysis morpheme meanings (already have ko and en, add ja/zh/fr):
${analyses.join('\n')}

Note (Korean): ${noteKo}

Example sentence (English): ${wordData.example ?? ''}

Return this exact JSON structure:
{
  "wordMeaning": {"ja": "...", "zh": "...", "fr": "..."},
  "analysisMeanings": [
    {"ja": "...", "zh": "...", "fr": "..."}
  ],
  "note": {"en": "...", "ja": "...", "zh": "...", "fr": "..."},
  "translation": {"ja": "...", "zh": "...", "fr": "..."}
}`;
}

function buildRootPrompt(root_info) {
  const ko = extractKo(root_info.meaning);
  const en = extractEn(root_info.meaning);
  return `Translate this etymology root meaning for an app. Do NOT use double-quote characters inside values.
en: ${en}  /  ko: ${ko}
Return ONLY this JSON: {"ja": "...", "zh": "...", "fr": "..."}`;
}

// ── Apply translations to a word object ──────────────────────────────────────

function applyToWord(wordData, tr) {
  const analysis = (wordData.analysis ?? []).map((a, i) => {
    const extra = tr.analysisMeanings?.[i] ?? {};
    return {
      ...a,
      meaning: {
        ko: extractKo(a.meaning),
        en: extractEn(a.meaning),
        ja: extra.ja ?? (a.meaning?.ja ?? ''),
        zh: extra.zh ?? (a.meaning?.zh ?? ''),
        fr: extra.fr ?? (a.meaning?.fr ?? ''),
      },
    };
  });

  const noteKo = typeof wordData.note === 'object' ? (wordData.note?.ko ?? '') : (wordData.note ?? '');
  const note = noteKo
    ? {
        ko: noteKo,
        en: tr.note?.en ?? (wordData.note?.en ?? ''),
        ja: tr.note?.ja ?? (wordData.note?.ja ?? ''),
        zh: tr.note?.zh ?? (wordData.note?.zh ?? ''),
        fr: tr.note?.fr ?? (wordData.note?.fr ?? ''),
      }
    : wordData.note;

  const koTr = typeof wordData.translation === 'string'
    ? wordData.translation
    : (wordData.translation?.ko ?? '');
  const translation = koTr
    ? {
        ko: koTr,
        ja: tr.translation?.ja ?? (wordData.translation?.ja ?? ''),
        zh: tr.translation?.zh ?? (wordData.translation?.zh ?? ''),
        fr: tr.translation?.fr ?? (wordData.translation?.fr ?? ''),
      }
    : wordData.translation;

  let meaning = wordData.meaning;
  if (meaning) {
    meaning = {
      ko: extractKo(wordData.meaning),
      en: extractEn(wordData.meaning),
      ja: tr.wordMeaning?.ja ?? (wordData.meaning?.ja ?? ''),
      zh: tr.wordMeaning?.zh ?? (wordData.meaning?.zh ?? ''),
      fr: tr.wordMeaning?.fr ?? (wordData.meaning?.fr ?? ''),
    };
  }

  return { ...wordData, meaning, analysis, note, translation };
}

// ── Translate with retry ──────────────────────────────────────────────────────

async function translateWord(wordData, maxRetries = 2) {
  let lastErr;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) await delay(1500 * attempt);
      const text = await callClaude(buildPrompt(wordData));
      return extractAndParseJSON(text);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

async function translateRoot(root_info, maxRetries = 2) {
  let lastErr;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) await delay(1500 * attempt);
      const text = await callClaude(buildRootPrompt(root_info));
      return extractAndParseJSON(text);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

// ── Process a single JSON file ───────────────────────────────────────────────

async function processFile(filePath) {
  const raw  = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(raw);
  let changed = false;

  // root_info.meaning
  if (!isRootConverted(data.root_info)) {
    try {
      const json = await translateRoot(data.root_info);
      const ko = extractKo(data.root_info.meaning);
      const en = extractEn(data.root_info.meaning);
      data.root_info = {
        ...data.root_info,
        meaning: { ko, en, ja: json.ja ?? '', zh: json.zh ?? '', fr: json.fr ?? '' },
      };
      changed = true;
    } catch (e) {
      process.stdout.write(` [root ✗: ${e.message}]\n`);
    }
    await delay(400);
  }

  const words = data.words ?? [];
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (isConverted(word)) {
      process.stdout.write(`    [${i + 1}/${words.length}] ${word.word} ✓ (skip)\n`);
      continue;
    }

    process.stdout.write(`    [${i + 1}/${words.length}] ${word.word}... `);
    try {
      const tr = await translateWord(word);
      words[i] = applyToWord(word, tr);
      changed  = true;
      process.stdout.write(`✓\n`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf8');
    } catch (e) {
      process.stdout.write(`✗ ${e.message}\n`);
    }
    await delay(400);
  }

  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf8');
  }
}

function delay(ms) { return new Promise((r) => setTimeout(r, ms)); }

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

async function main() {
  for (const dataDir of TARGET_DIRS) {
    const dirName = path.basename(dataDir);
    const files = collectFiles(dataDir);
    console.log(`\n=== ${dirName}: ${files.length} files ===\n`);

    let done = 0;
    for (const file of files) {
      const rel = path.relative(dataDir, file);
      process.stdout.write(`[${++done}/${files.length}] ${rel}\n`);
      try {
        await processFile(file);
      } catch (e) {
        console.error(`  FILE ERROR: ${e.message}`);
      }
    }
  }

  console.log('\nAll done. Run: node scripts/build-etymology-data.js');
}

main().catch((e) => { console.error(e); process.exit(1); });
