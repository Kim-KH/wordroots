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

const NoteCard = memo(function NoteCard({ folderPath, t }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const chevronRotate = useRef(new Animated.Value(0)).current;
  const saveTimer = useRef(null);

  useEffect(() => {
    setOpen(false);
    setNote('');
    chevronRotate.setValue(0);
    AsyncStorage.getItem(NOTE_PREFIX + folderPath)
      .then((saved) => { if (saved) setNote(saved); })
      .catch(() => {});
  }, [folderPath, chevronRotate]);

  useEffect(() => {
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, []);

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

  const onChangeText = useCallback((text) => {
    setNote(text);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      AsyncStorage.setItem(NOTE_PREFIX + folderPath, text).catch(() => {});
    }, 600);
  }, [folderPath]);

  const chevronStyle = {
    transform: [{
      rotate: chevronRotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
      }),
    }],
  };

  const preview = note.trim() ? note.trim().split('\n')[0] : null;

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
          <TextInput
            style={styles.input}
            multiline
            value={note}
            onChangeText={onChangeText}
            placeholder={t('memoPlaceholder')}
            placeholderTextColor="#adb5bd"
            textAlignVertical="top"
            autoFocus
          />
          {note.length > 0 && (
            <Text style={styles.savedLabel}>{t('memoSaved')}</Text>
          )}
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
    padding: 14,
    backgroundColor: '#fffef8',
  },
  input: {
    fontSize: 14,
    color: '#212529',
    lineHeight: 22,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  savedLabel: {
    fontSize: 11,
    color: '#c8a050',
    textAlign: 'right',
    marginTop: 8,
  },
});
