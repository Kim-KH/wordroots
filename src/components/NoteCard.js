import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const NOTE_PREFIX = 'etym_note_';
const HIT_SLOP_SM = { top: 8, bottom: 8, left: 8, right: 8 };

function loadMemos(raw) {
  if (!raw) return [''];
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr.length > 0 ? arr : [''];
  } catch (_) {}
  return [raw]; // migrate plain string → first memo
}

function MemoItem({ index, total, text, onChange, onDelete, placeholder, savedLabel }) {
  return (
    <View style={[styles.memoItem, index > 0 && styles.memoItemBorder]}>
      <View style={styles.memoItemHeader}>
        <Text style={styles.memoLabel}>메모 {index + 1}</Text>
        {total > 1 && (
          <TouchableOpacity onPress={onDelete} hitSlop={HIT_SLOP_SM}>
            <Text style={styles.deleteBtn}>×</Text>
          </TouchableOpacity>
        )}
      </View>
      <TextInput
        style={styles.input}
        multiline
        value={text}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#adb5bd"
        textAlignVertical="top"
      />
      {text.length > 0 && (
        <Text style={styles.savedLabel}>{savedLabel}</Text>
      )}
    </View>
  );
}

const NoteCard = memo(function NoteCard({ folderPath, t }) {
  const [open, setOpen] = useState(false);
  const [memos, setMemos] = useState(['']);
  const chevronRotate = useRef(new Animated.Value(0)).current;
  const saveTimer = useRef(null);

  useEffect(() => {
    setOpen(false);
    setMemos(['']);
    chevronRotate.setValue(0);
    AsyncStorage.getItem(NOTE_PREFIX + folderPath)
      .then((saved) => setMemos(loadMemos(saved)))
      .catch(() => {});
  }, [folderPath, chevronRotate]);

  useEffect(() => {
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, []);

  const saveMemos = useCallback((newMemos) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      AsyncStorage.setItem(NOTE_PREFIX + folderPath, JSON.stringify(newMemos)).catch(() => {});
    }, 600);
  }, [folderPath]);

  const handleChange = useCallback((idx, text) => {
    setMemos((prev) => {
      const next = [...prev];
      next[idx] = text;
      saveMemos(next);
      return next;
    });
  }, [saveMemos]);

  const handleDelete = useCallback((idx) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMemos((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      const result = next.length > 0 ? next : [''];
      saveMemos(result);
      return result;
    });
  }, [saveMemos]);

  const addMemo = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMemos((prev) => {
      const next = [...prev, ''];
      saveMemos(next);
      return next;
    });
  }, [saveMemos]);

  const toggle = useCallback(() => {
    const opening = !open;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Animated.timing(chevronRotate, {
      toValue: opening ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
    setOpen(opening);
  }, [open, chevronRotate]);

  const chevronStyle = {
    transform: [{
      rotate: chevronRotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
      }),
    }],
  };

  const preview = memos.find((m) => m.trim())?.trim().split('\n')[0] ?? null;

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.header} onPress={toggle} activeOpacity={0.75}>
        <View style={styles.left}>
          <Text style={styles.pencil}>✏</Text>
          <View style={styles.labelWrap}>
            <Text style={styles.title}>{t('memoTitle')}</Text>
            {!open && preview ? (
              <Text style={styles.preview} numberOfLines={1}>{preview}</Text>
            ) : null}
          </View>
        </View>
        <Animated.Text style={[styles.chevron, chevronStyle]}>▾</Animated.Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.body}>
          {memos.map((text, idx) => (
            <MemoItem
              key={idx}
              index={idx}
              total={memos.length}
              text={text}
              onChange={(val) => handleChange(idx, val)}
              onDelete={() => handleDelete(idx)}
              placeholder={t('memoPlaceholder')}
              savedLabel={t('memoSaved')}
            />
          ))}
          <TouchableOpacity style={styles.addBtn} onPress={addMemo}>
            <Text style={styles.addBtnText}>+ {t('memoAdd')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

export default NoteCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fffcf0',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f0e0a0',
    borderLeftWidth: 4,
    borderLeftColor: '#e8a020',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  pencil: {
    fontSize: 15,
    marginRight: 10,
    color: '#e8a020',
  },
  labelWrap: { flex: 1 },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#b07800',
  },
  preview: {
    fontSize: 12,
    color: '#c8a050',
    marginTop: 2,
  },
  chevron: {
    fontSize: 22,
    color: '#e8a020',
    lineHeight: 24,
  },
  body: {
    borderTopWidth: 1,
    borderTopColor: '#f0e0a0',
    backgroundColor: '#fffef8',
  },
  memoItem: {
    padding: 14,
  },
  memoItemBorder: {
    borderTopWidth: 1,
    borderTopColor: '#f0e0a0',
  },
  memoItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  memoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#e8a020',
    letterSpacing: 0.3,
  },
  deleteBtn: {
    fontSize: 18,
    color: '#c8a050',
    lineHeight: 20,
  },
  input: {
    fontSize: 14,
    color: '#212529',
    lineHeight: 22,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  savedLabel: {
    fontSize: 11,
    color: '#c8a050',
    textAlign: 'right',
    marginTop: 8,
  },
  addBtn: {
    borderTopWidth: 1,
    borderTopColor: '#f0e0a0',
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  addBtnText: {
    fontSize: 13,
    color: '#e8a020',
    fontWeight: '600',
  },
});
