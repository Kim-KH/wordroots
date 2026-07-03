// Map analysis type string to the current language label.
// typeStr examples: "접두사 (Prefix)", "어근 (Root)", "접미사 (Suffix)"
export function getTypeLabel(typeStr, lang, t) {
  if (!typeStr) return typeStr;
  if (lang === 'ko') {
    return typeStr.replace(/\s*\([^)]+\)\s*$/, '').trim();
  }
  const lower = typeStr.toLowerCase();
  if (lower.includes('prefix') || lower.includes('접두')) return t('typePrefix');
  if (lower.includes('suffix') || lower.includes('접미')) return t('typeSuffix');
  if (lower.includes('root') || lower.includes('어근')) return t('typeRoot');
  const match = typeStr.match(/\(([^)]+)\)/);
  return match ? match[1] : typeStr;
}

// TTS language tag for the selected UI language.
// zh and fr use base codes only: Android's Locale(String) constructor does not
// split on hyphens, so Locale("zh-CN") creates language="zh-cn" which the TTS
// engine cannot match. Locale("zh") / Locale("fr") are valid and reliably found.
export function getTtsLang(lang) {
  const map = { ko: 'ko-KR', en: 'en-US', ja: 'ja-JP', zh: 'zh', fr: 'fr' };
  return map[lang] ?? 'en-US';
}
