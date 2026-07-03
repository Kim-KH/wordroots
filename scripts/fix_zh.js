const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/i18n/overlay_zh.json');
const raw = fs.readFileSync(filePath, 'utf8');
const lines = raw.split('\n');

const fixed = lines.map(line => {
  // Match: "note": "VALUE", "translation": "VALUE" }
  return line.replace(
    /("note":\s*")(.*?)(",\s*"translation":\s*")(.*?)("\s*\})/,
    (match, p1, note, p3, trans, p5) => {
      const fixNote = note.replace(/"/g, '\\"');
      const fixTrans = trans.replace(/"/g, '\\"');
      return p1 + fixNote + p3 + fixTrans + p5;
    }
  );
});

const result = fixed.join('\n');

try {
  JSON.parse(result);
  fs.writeFileSync(filePath, result, 'utf8');
  console.log('Fixed and saved successfully. Entries:', Object.keys(JSON.parse(result)).length);
} catch(e) {
  console.error('Still invalid JSON:', e.message);
  // Show context around error
  const pos = parseInt(e.message.match(/position (\d+)/)?.[1] || '0');
  console.log('Context:', result.substring(Math.max(0, pos - 30), pos + 30));
}
