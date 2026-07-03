#!/usr/bin/env node
/**
 * fix-english-fields.js
 * Translates Korean text found in .en fields back to English.
 *
 * Usage:
 *   $env:ANTHROPIC_API_KEY = "sk-ant-..."
 *   node scripts/fix-english-fields.js             # process all files
 *   node scripts/fix-english-fields.js --test      # process only first file (debug)
 *   node scripts/fix-english-fields.js --limit 10  # process first 10 files
 */

const https = require('https');
const fs   = require('fs');
const path = require('path');

const API_KEY = process.env.ANTHROPIC_API_KEY;
const KOREAN  = /[가-힣]/;

const args = process.argv.slice(2);
const TEST_MODE  = args.includes('--test');
const LIMIT_IDX  = args.indexOf('--limit');
const FILE_LIMIT = LIMIT_IDX >= 0 ? parseInt(args[LIMIT_IDX + 1], 10) : Infinity;

const TARGET_DIRS = [
  path.resolve(__dirname, '../src/data/Part_Origin'),
  path.resolve(__dirname, '../src/data/Part_Prefixes'),
  path.resolve(__dirname, '../src/data/Part_Roots'),
  path.resolve(__dirname, '../src/data/Part_Suffixes'),
];

if (!API_KEY) {
  console.error('ERROR: ANTHROPIC_API_KEY is not set.');
  console.error('  Run: $env:ANTHROPIC_API_KEY = "sk-ant-..."');
  process.exit(1);
}

// ── Korean detector ────────────────────────────────────────────────────────────

function wordNeedsFixing(word) {
  if (word.meaning?.en && KOREAN.test(word.meaning.en)) return true;
  for (const a of (word.analysis ?? [])) {
    if (a.meaning?.en && KOREAN.test(a.meaning.en)) return true;
  }
  return false;
}

// ── Build prompt ───────────────────────────────────────────────────────────────

function buildPrompt(word) {
  const needsWord = word.meaning?.en && KOREAN.test(word.meaning.en);
  const badAnalysis = (word.analysis ?? [])
    .map((a, i) => ({ i, morpheme: a.morpheme, ko: a.meaning?.ko ?? '', en: a.meaning?.en ?? '' }))
    .filter(a => KOREAN.test(a.en));

  const lines = [];
  if (needsWord) {
    lines.push(`word_meaning  ko="${word.meaning.ko ?? ''}"  bad_en="${word.meaning.en}"`);
  }
  for (const a of badAnalysis) {
    lines.push(`analysis[${a.i}]  morpheme="${a.morpheme}"  ko="${a.ko}"  bad_en="${a.en}"`);
  }

  return `You are fixing an English etymology dataset.
Each "bad_en" field contains Korean text placed accidentally in the English slot.
Translate each bad_en to concise English based on its Korean meaning (ko field).

Rules:
- Morpheme/analysis meanings: 1-4 English words
- Word meanings: 2-6 English words
- Do NOT include quote characters or Korean in output values
- Return ONLY a raw JSON object (no markdown, no explanation)

Word: "${word.word}"

Fields needing translation:
${lines.join('\n')}

Respond with ONLY this JSON (no other text):
{"wordMeaning":"<english or empty string if not needed>","analysisMeanings":{"<index>":"<english>"}}

Example response: {"wordMeaning":"to wrap inside","analysisMeanings":{"1":"to fold"}}
If wordMeaning not needed, use empty string: {"wordMeaning":"","analysisMeanings":{"0":"unit of data"}}`;
}

// ── Apply fix ──────────────────────────────────────────────────────────────────

function applyFix(word, result) {
  if (result.wordMeaning && word.meaning?.en) {
    word.meaning.en = result.wordMeaning;
  }
  const analyses = word.analysis ?? [];
  for (const [idxStr, enVal] of Object.entries(result.analysisMeanings ?? {})) {
    const i = parseInt(idxStr, 10);
    if (enVal && analyses[i]?.meaning) {
      analyses[i].meaning.en = enVal;
    }
  }
  return word;
}

// ── JSON extraction ────────────────────────────────────────────────────────────

function extractJSON(text) {
  let clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const start = clean.indexOf('{');
  if (start === -1) throw new Error(`No JSON object found in response. Raw: ${clean.slice(0, 200)}`);
  let depth = 0, end = -1, inStr = false, esc = false;
  for (let i = start; i < clean.length; i++) {
    const c = clean[i];
    if (esc)              { esc = false; continue; }
    if (c === '\\' && inStr) { esc = true; continue; }
    if (c === '"')        { inStr = !inStr; continue; }
    if (inStr)            { continue; }
    if (c === '{')        { depth++; }
    else if (c === '}')   { if (--depth === 0) { end = i; break; } }
  }
  if (end === -1) throw new Error(`Unbalanced braces in response. Raw: ${clean.slice(0, 200)}`);
  let s = clean.slice(start, end + 1);
  try { return JSON.parse(s); } catch (_) {}
  s = s.replace(/,(\s*[}\]])/g, '$1');
  try { return JSON.parse(s); } catch (_) {}
  s = s.replace(/"([^"]*)"/g, (_, v) => '"' + v.replace(/\r?\n/g, ' ').replace(/\t/g, ' ') + '"');
  return JSON.parse(s);
}

// ── Claude API ─────────────────────────────────────────────────────────────────

function callClaude(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });
    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length':    Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            return reject(new Error(`API error ${parsed.error.type}: ${parsed.error.message}`));
          }
          const text = parsed.content?.[0]?.text ?? '';
          if (!text) return reject(new Error(`Empty API response. HTTP ${res.statusCode}`));
          resolve(text);
        } catch (e) {
          reject(new Error(`Failed to parse API response: ${e.message}. Raw: ${data.slice(0,200)}`));
        }
      });
    });
    req.on('error', e => reject(new Error(`Network error: ${e.message}`)));
    req.write(body);
    req.end();
  });
}

// ── Preflight check ────────────────────────────────────────────────────────────

async function preflightCheck() {
  console.log('Checking API connectivity...');
  try {
    const text = await callClaude('Reply with exactly: {"ok":true}');
    const result = extractJSON(text);
    if (result.ok) {
      console.log('API connectivity: OK\n');
      return true;
    }
    throw new Error(`Unexpected response: ${text.slice(0, 100)}`);
  } catch (e) {
    console.error(`API connectivity FAILED: ${e.message}`);
    console.error('Check your ANTHROPIC_API_KEY and network connection.');
    return false;
  }
}

// ── Fix one word ───────────────────────────────────────────────────────────────

async function fixWord(word, maxRetries = 2) {
  let lastErr;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) await delay(1500 * attempt);
      const text = await callClaude(buildPrompt(word));
      return extractJSON(text);
    } catch (e) {
      lastErr = e;
      if (attempt < maxRetries) {
        process.stdout.write(` [retry ${attempt+1}]`);
      }
    }
  }
  throw lastErr;
}

// ── File processor ─────────────────────────────────────────────────────────────

async function processFile(filePath) {
  const raw  = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(raw);
  const words = data.words ?? [];
  let changed = false;
  let ok = 0, fail = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (!wordNeedsFixing(word)) continue;

    process.stdout.write(`    [${i+1}/${words.length}] ${word.word}... `);
    try {
      const result = await fixWord(word);
      words[i] = applyFix(word, result);
      changed = true;
      ok++;
      process.stdout.write(`✓\n`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf8');
    } catch (e) {
      fail++;
      process.stdout.write(`✗ ${e.message}\n`);
    }
    await delay(300);
  }

  return { ok, fail };
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function collectFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) out.push(...collectFiles(full));
    else if (entry.endsWith('.json')) out.push(full);
  }
  return out;
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  const ok = await preflightCheck();
  if (!ok) process.exit(1);

  // Collect files with issues
  let totalIssueWords = 0;
  const allFiles = [];
  for (const dir of TARGET_DIRS) {
    for (const f of collectFiles(dir)) {
      const data = JSON.parse(fs.readFileSync(f, 'utf8'));
      let hasIssue = false;
      for (const w of (data.words ?? [])) {
        if (wordNeedsFixing(w)) { totalIssueWords++; hasIssue = true; }
      }
      if (hasIssue) allFiles.push({ dir, file: f });
    }
  }

  const limit = TEST_MODE ? 1 : FILE_LIMIT;
  const filesToProcess = allFiles.slice(0, limit);

  console.log(`Found ${totalIssueWords} words with Korean in .en fields across ${allFiles.length} files.`);
  if (TEST_MODE) console.log('TEST MODE: processing only first file.');
  else if (limit < Infinity) console.log(`LIMIT MODE: processing first ${limit} files.`);
  console.log('');

  let totalOk = 0, totalFail = 0, fileDone = 0;
  for (const { dir, file } of filesToProcess) {
    const rel = path.relative(dir, file);
    process.stdout.write(`[${++fileDone}/${filesToProcess.length}] ${rel}\n`);
    try {
      const { ok, fail } = await processFile(file);
      totalOk += ok; totalFail += fail;
    } catch (e) {
      console.error(`  FILE ERROR: ${e.message}`);
    }
  }

  console.log(`\nDone: ${totalOk} fixed, ${totalFail} failed.`);
  if (totalFail > 0) console.log('Re-run the script to retry failed words (already-fixed words are skipped).');
  if (filesToProcess.length < allFiles.length) {
    console.log(`Remaining files: ${allFiles.length - filesToProcess.length} not yet processed.`);
  } else {
    console.log('Run: node scripts/build-etymology-data.js');
  }
}

main().catch(e => { console.error(e); process.exit(1); });
