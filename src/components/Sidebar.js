import React, { useState, useRef, useEffect, memo, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  FlatList,
  InteractionManager,
} from 'react-native';

const SIDEBAR_WIDTH = 280;

// 카테고리별 테마 색상 정의 (너무 요란하지 않은 파스텔 톤)
const CATEGORY_THEMES = [
  { id: 'origin', primary: '#5a8fb3', bg: '#eef6fb' },   // 블루 계열
  { id: 'prefixes', primary: '#b36a5a', bg: '#fbeeee' }, // 레드/브라운 계열
  { id: 'roots', primary: '#5ab37d', bg: '#eefbf2' },    // 그린 계열
  { id: 'suffixes', primary: '#a35ab3', bg: '#f9eefb' }, // 퍼플 계열
];

const Sidebar = memo(function Sidebar({ folders, t, lang, isOpen, selectedPath, onSelect, onClose }) {
  const translateX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  
  const [activeCategoryIdx, setActiveCategoryIdx] = useState(0);
  const [selectedSubIdx, setSelectedSubIdx] = useState(0); // 추가된 상태: 알파벳 그리드 선택 인덱스
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: isOpen ? 0 : -SIDEBAR_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: isOpen ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isOpen]);

  // 상위 카테고리(탭) 변경 시 하위 선택 초기화
  useEffect(() => {
    setSelectedSubIdx(0);
  }, [activeCategoryIdx]);

  const handleTabPress = useCallback((idx) => {
    if (activeCategoryIdx === idx) return;
    setActiveCategoryIdx(idx);
    setIsTransitioning(true);
    InteractionManager.runAfterInteractions(() => {
      setIsTransitioning(false);
    });
  }, [activeCategoryIdx]);

  const activeCategory = folders[activeCategoryIdx];
  const currentTheme = CATEGORY_THEMES[activeCategoryIdx % CATEGORY_THEMES.length];
  const activeSubCategory = activeCategory?.subCategories?.[selectedSubIdx];

  const getFolderLabel = useCallback((item) => {
    const translated = t(item.nameKey);
    return translated !== item.nameKey ? translated : item.name;
  }, [t]);

  // 폴더 리스트 정렬
  const sortedFolders = useMemo(() => {
    if (!activeSubCategory?.folders) return [];
    return [...activeSubCategory.folders].sort((a, b) =>
      getFolderLabel(a).localeCompare(getFolderLabel(b), lang)
    );
  }, [activeSubCategory, getFolderLabel, lang]);

  const renderFolderItem = useCallback(({ item, index }) => {
    const selected = selectedPath === item.path;
    return (
      <TouchableOpacity
        style={[
          styles.folderItem, 
          index === 0 && styles.folderItemFirst, 
          selected && { backgroundColor: currentTheme.primary }
        ]}
        onPress={() => onSelect(item.path, item.dataPath)}
        activeOpacity={0.7}
      >
        <Text style={[styles.folderName, selected && styles.folderNameSelected]} numberOfLines={2}>
          {getFolderLabel(item)}
        </Text>
      </TouchableOpacity>
    );
  }, [t, selectedPath, onSelect, currentTheme]);

  const keyExtractor = useCallback((item) => item.path, []);

  return (
    <>
      <Animated.View
        pointerEvents={isOpen ? 'auto' : 'none'}
        style={[styles.overlay, { opacity: overlayOpacity }]}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.sidebar, { transform: [{ translateX }] }]}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>{t('sidebarTitle')}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{top:10, bottom:10, left:10, right:10}}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* 메인 카테고리 탭 (Origin, Prefix, Root, Suffix) */}
        <View style={styles.tabBar}>
          {folders.map((cat, idx) => {
            const theme = CATEGORY_THEMES[idx % CATEGORY_THEMES.length];
            const isActive = activeCategoryIdx === idx;
            const translatedLabel = t(cat.categoryNameKey);
            const tabLabel = (translatedLabel !== cat.categoryNameKey) 
              ? translatedLabel 
              : cat.categoryName.replace('Part ', '');

            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.tab, 
                  isActive && { backgroundColor: '#ffffff', borderBottomWidth: 2, borderBottomColor: theme.primary }
                ]}
                onPress={() => handleTabPress(idx)}
              >
                <Text 
                  style={[styles.tabText, isActive && { color: theme.primary, fontWeight: '700' }]}
                  numberOfLines={1}
                >
                  {tabLabel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {!isTransitioning ? (
          <View style={{ flex: 1 }}>
            {/* 알파벳 그리드 내비게이션 (A, B, C...) */}
            <View style={styles.gridContainer}>
              {activeCategory?.subCategories?.map((sub, idx) => {
                const isActive = selectedSubIdx === idx;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.gridItem,
                      { borderColor: currentTheme.primary + '33' },
                      isActive && { backgroundColor: currentTheme.primary, borderColor: currentTheme.primary }
                    ]}
                    onPress={() => setSelectedSubIdx(idx)}
                  >
                    <Text style={[styles.gridText, isActive && styles.gridTextActive]}>
                      {sub.subCategoryName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 선택된 알파벳의 폴더 리스트 */}
            <FlatList
              data={sortedFolders}
              renderItem={renderFolderItem}
              keyExtractor={keyExtractor}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.folderListContainer}
              initialNumToRender={15}
              removeClippedSubviews={Platform.OS === 'android'}
              ListEmptyComponent={<View style={{ height: 100 }} />}
            />
          </View>
        ) : (
          <View style={{ flex: 1, backgroundColor: currentTheme.bg }} />
        )}
      </Animated.View>
    </>
  );
});

export default Sidebar;

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 20,
  },
  sidebar: {
    position: 'absolute',
    top: 0, left: 0, bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: '#fcfaf6',
    borderRightWidth: 1,
    borderRightColor: '#eaddc7',
    zIndex: 30,
    paddingTop: Platform.OS === 'ios' ? 44 : 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 2, height: 0 },
    elevation: 10,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eaddc7',
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8c7851',
  },
  closeBtn: {
    fontSize: 20,
    color: '#a89a82',
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#f5efe6',
    padding: 4,
    marginHorizontal: 10,
    marginTop: 10,
    marginBottom: 6,
    borderRadius: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#a89a82',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 2, // 최소한의 여백만 남김
    backgroundColor: '#fffefb',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  gridItem: {
    width: '18%', 
    // aspectRatio 제거하여 세로 길이를 압축
    paddingVertical: 6, 
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: '1%',
    marginBottom: 6,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: '#fcfaf6',
  },
  gridText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7d6b50',
  },
  gridTextActive: {
    color: '#ffffff',
  },
  folderListContainer: {
    paddingBottom: 32,
    backgroundColor: '#ffffff',
  },
  folderItem: {
    paddingVertical: 12, // 가독성을 위해 적절히 복구
    paddingLeft: 20,
    paddingRight: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  folderItemFirst: { 
    borderTopWidth: 0,
    paddingTop: 2, // 그리드 바로 아래에 붙도록 최소화
  },
  folderName: { fontSize: 13, color: '#495057' },
  folderNameSelected: { color: '#fffefb', fontWeight: '600' },
});
