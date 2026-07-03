import React, { useState, useRef, useCallback, useEffect, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import * as Speech from 'expo-speech';
import { getTypeLabel, getTtsLang } from '../utils/contentLang';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const WORD_LANG = 'en-US';

// ── synchronous helpers — support both new object format and legacy string format ──

function getMeaning(field, lang) {
  if (field && typeof field === 'object') {
    return (field[lang] ?? field.en ?? field.ko ?? '').replace(/^'+|'+$/g, '').trim();
  }
  // legacy: "'한국어' (English)"
  if (lang === 'ko') {
    return field?.replace(/\s*\([^)]+\)\s*$/, '').replace(/'/g, '').trim() ?? '';
  }
  const match = field?.match(/\(([^)]+)\)\s*$/);
  return match ? match[1] : (field?.replace(/'/g, '').trim() ?? '');
}

function getNote(field, lang) {
  if (!field) return null;
  if (typeof field === 'object') {
    const val = field[lang];
    if (val) return val;
    if (lang === 'ko') return null;
    return field.en || null;
  }
  return lang === 'ko' ? field : null;
}

function isLikelySentence(text) {
  if (!text || !text.trim()) return false;
  if (/[.!?。！？]/.test(text)) return true;
  // CJK scripts have no spaces between words — use character count instead
  if (/[一-鿿぀-ヿ]/.test(text)) return text.trim().length >= 10;
  return text.trim().split(/\s+/).length >= 6;
}

function getTranslation(field, lang) {
  if (!field) return null;
  if (typeof field === 'object') {
    if (lang === 'en') return null;
    const val = field[lang] ?? null;
    if (val && !isLikelySentence(val)) return null;
    return val;
  }
  return lang === 'ko' ? field : null;
}

// ─────────────────────────────────────────────────────────────────────────────

function WordCard({ wordData, t, lang, onScrollToView }) {
  const [open, setOpen] = useState(false);
  const [displayData, setDisplayData] = useState(null);
  const chevronRotate = useRef(new Animated.Value(0)).current;
  const cardRef = useRef(null);

  useEffect(() => {
    setOpen(false);
    setDisplayData(null);
    chevronRotate.setValue(0);
  }, [wordData, lang, chevronRotate]);

  useEffect(() => {
    return () => { Speech.stop(); };
  }, []);

  const meaningLang = getTtsLang(lang);

  const toggle = useCallback(() => {
    const opening = !open;

    Speech.stop();
    setTimeout(() => Speech.speak(wordData.word, { language: WORD_LANG, rate: 1.0 }), 50);

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    Animated.timing(chevronRotate, {
      toValue: opening ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();

    // Compute displayData synchronously so both state updates batch into one render.
    // If displayData were set in a separate useEffect, LayoutAnimation would animate
    // to the wrong (too small) height before the note/translation content arrives.
    setDisplayData(opening ? {
      analysisMeanings: wordData.analysis?.map((a) => getMeaning(a.meaning, lang)) ?? [],
      note: getNote(wordData.note, lang),
      translation: getTranslation(wordData.translation, lang),
    } : null);
    setOpen(opening);

    if (opening && onScrollToView) {
      setTimeout(() => onScrollToView(cardRef), 100);
    }
  }, [open, wordData, lang, onScrollToView, chevronRotate]);

  const playText = useCallback((text, language) => {
    if (text) {
      Speech.stop();
      setTimeout(() => Speech.speak(text, { language, rate: 1.0 }), 50);
    }
  }, []);

  const chevronStyle = {
    transform: [
      {
        rotate: chevronRotate.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '180deg'],
        }),
      },
    ],
  };

  return (
    <View ref={cardRef} style={styles.card}>
      <TouchableOpacity style={styles.header} onPress={toggle} activeOpacity={0.75}>
        <Text style={styles.word} numberOfLines={2}>
          {wordData.word}
          {wordData.part_of_speech ? (
            <Text style={styles.pos}> {wordData.part_of_speech}</Text>
          ) : null}
        </Text>
        <Animated.Text style={[styles.chevron, chevronStyle]}>▾</Animated.Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.details}>
          {(wordData.origin || wordData.meaning) && (
            <View style={styles.wordOriginSection}>
              {wordData.origin ? (
                <Text style={styles.infoText}>
                  <Text style={styles.label}>{t('etymologyLabel')}: </Text>
                  {wordData.origin}
                </Text>
              ) : null}
              {wordData.meaning ? (
                <Text style={styles.infoText}>
                  <Text style={styles.label}>{t('meaningLabel')}: </Text>
                  {getMeaning(wordData.meaning, lang)}
                </Text>
              ) : null}
            </View>
          )}

          {wordData.analysis?.length > 0 && (
            <View style={styles.table}>
              {wordData.analysis.map((item, i) => (
                <View key={i} style={[styles.tableRow, i > 0 && styles.tableRowBorder]}>
                  <View style={styles.tableThCell}>
                    <Text style={styles.tableThText}>
                      {getTypeLabel(item.type, lang, t)}
                    </Text>
                  </View>
                  <View style={styles.tableTdCell}>
                    <Text style={styles.tableTdText}>
                      <Text style={styles.morpheme}>{item.morpheme}</Text>
                      {': '}
                      {displayData?.analysisMeanings?.[i] ?? ''}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {displayData?.note ? (
            <View style={styles.note}>
              <Text style={styles.noteText}>
                <Text style={styles.label}>{t('noteLabel')}: </Text>
                {displayData.note}
              </Text>
            </View>
          ) : null}

          {wordData.example ? (
            <View style={styles.exampleBlock}>
              <TouchableOpacity onPress={() => playText(wordData.example, WORD_LANG)}>
                <Text style={styles.exampleText}>{wordData.example}</Text>
              </TouchableOpacity>
              {displayData?.translation ? (
                <TouchableOpacity
                  onPress={() => playText(displayData.translation, meaningLang)}
                >
                  <Text style={styles.translationText}>{displayData.translation}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

export default memo(WordCard);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#dee2e6',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  word: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    flex: 1,
    marginRight: 8,
  },
  pos: { fontSize: 13, fontWeight: '400', color: '#6c757d' },
  chevron: { fontSize: 22, color: '#6c757d', lineHeight: 24 },
  details: {
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
    padding: 14,
  },
  wordOriginSection: {
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  infoText: { fontSize: 13, color: '#495057', marginTop: 2, lineHeight: 19 },
  label: { fontWeight: '600' },
  table: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  tableRow: { flexDirection: 'row', backgroundColor: '#ffffe0' },
  tableRowBorder: { borderTopWidth: 1, borderTopColor: '#dee2e6' },
  tableThCell: {
    width: 95,
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: '#dee2e6',
    justifyContent: 'center',
  },
  tableThText: { fontSize: 12, fontWeight: '500', color: '#212529' },
  tableTdCell: { flex: 1, padding: 8, justifyContent: 'center' },
  tableTdText: { fontSize: 12, color: '#212529', lineHeight: 18 },
  morpheme: { fontWeight: '700' },
  note: {
    backgroundColor: '#e9f7fd',
    borderLeftWidth: 4,
    borderLeftColor: '#1c7ed6',
    padding: 10,
    marginBottom: 12,
    borderRadius: 2,
  },
  noteText: { fontSize: 13, color: '#212529', lineHeight: 19 },
  exampleBlock: { marginTop: 4 },
  exampleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212529',
    marginBottom: 4,
    lineHeight: 21,
  },
  translationText: {
    fontSize: 13,
    color: '#6c757d',
    paddingLeft: 10,
    lineHeight: 20,
  },
});
