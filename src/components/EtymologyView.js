import React, { useRef, useCallback, memo, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, Dimensions, Platform } from 'react-native';
import WordCard from './WordCard';
import NoteCard from './NoteCard';

// Extract helpers for legacy root_info.meaning format: "English (한국어)"
function extractKoreanRoot(text) {
  if (!text) return '';
  const match = text.match(/\(([^)]+)\)\s*$/);
  return match ? match[1] : text;
}

function extractEnglishRoot(text) {
  if (!text) return text;
  return text.replace(/\s*\([^)]+\)\s*$/, '').trim();
}

function getRootMeaning(field, lang) {
  if (!field) return '';
  if (typeof field === 'object') return field[lang] ?? field.en ?? field.ko ?? '';
  // legacy string: "English (한국어)"
  if (lang === 'ko') return extractKoreanRoot(field);
  return extractEnglishRoot(field);
}

const Header = memo(function Header({ root_info, lang, t }) {
  const displayMeaning = useMemo(
    () => getRootMeaning(root_info.meaning, lang),
    [root_info.meaning, lang]
  );

  return (
    <View style={styles.header}>
      <Text style={styles.headerRoots}>{root_info.roots}</Text>
      {root_info.origin ? (
        <Text style={styles.headerInfo}>
          <Text style={styles.label}>{t('etymologyLabel')}: </Text>
          {root_info.origin}
        </Text>
      ) : null}
      {displayMeaning ? (
        <Text style={styles.headerInfo}>
          <Text style={styles.label}>{t('meaningLabel')}: </Text>
          {displayMeaning}
        </Text>
      ) : null}
    </View>
  );
});

function EtymologyView({ data, lang, t, folderPath }) {
  const flatListRef = useRef(null);
  const currentScrollY = useRef(0);

  const scrollToCard = useCallback((cardRef) => {
    if (!cardRef?.current || !flatListRef?.current) return;
    setTimeout(() => {
      cardRef.current?.measure((x, y, width, height, pageX, pageY) => {
        const { height: windowHeight } = Dimensions.get('window');
        const cardBottom = pageY + height;
        const visibleBottom = windowHeight - 40;
        if (cardBottom > visibleBottom) {
          flatListRef.current?.scrollToOffset({
            offset: currentScrollY.current + (cardBottom - visibleBottom),
            animated: true,
          });
        }
      });
    }, 300);
  }, []);

  const renderItem = useCallback(
    ({ item }) => (
      <WordCard wordData={item} t={t} lang={lang} onScrollToView={scrollToCard} />
    ),
    [t, lang, scrollToCard]
  );

  const keyExtractor = useCallback((item, index) => `${item.word}-${index}`, []);

  const onScroll = useCallback((e) => {
    currentScrollY.current = e.nativeEvent.contentOffset.y;
  }, []);

  if (!data?.root_info) {
    return (
      <View style={styles.welcome}>
        <Text style={styles.welcomeTitle}>{t('welcomeTitle')}</Text>
        <Text style={styles.welcomeMsg}>{t('welcomeMessage')}</Text>
      </View>
    );
  }

  const { root_info, words } = data;

  return (
    <FlatList
      ref={flatListRef}
      style={styles.list}
      contentContainerStyle={styles.content}
      data={words ?? []}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListHeaderComponent={<Header root_info={root_info} lang={lang} t={t} />}
      ListFooterComponent={
        <View>
          <NoteCard folderPath={folderPath} t={t} />
          <View style={{ height: 30 }} />
        </View>
      }
      onScroll={onScroll}
      scrollEventThrottle={16}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={10}
      removeClippedSubviews={Platform.OS === 'android'}
      updateCellsBatchingPeriod={50}
    />
  );
}

export default memo(EtymologyView);

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { padding: 16 },
  welcome: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#f8f9fa',
  },
  welcomeTitle: { fontSize: 22, fontWeight: '700', color: '#212529', marginBottom: 10 },
  welcomeMsg: { fontSize: 15, color: '#6c757d', textAlign: 'center', lineHeight: 22 },
  header: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  headerRoots: { fontSize: 24, fontWeight: '800', color: '#1c7ed6', marginBottom: 8 },
  headerInfo: { fontSize: 14, color: '#495057', marginBottom: 4 },
  label: { fontWeight: '600', color: '#212529' },
});
