import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar, BackHandler, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import structure from './src/data/structure.json';
import etymologyData from './src/data/etymologyData.json';
import TopBar from './src/components/TopBar';
import Sidebar from './src/components/Sidebar';
import EtymologyView from './src/components/EtymologyView';

const LANG_FILES = {
  ko: require('./src/lang/ko.json'),
  en: require('./src/lang/en.json'),
  ja: require('./src/lang/ja.json'),
  zh: require('./src/lang/zh.json'),
  fr: require('./src/lang/fr.json'),
};

const SUPPORTED_LANGUAGES = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
  zh: '中文',
  fr: 'Français',
};

const LANG_KEY = 'etymologyAppLanguage';

export default function App() {
  const [lang, setLang] = useState('ko');
  const [translations, setTranslations] = useState(LANG_FILES.ko);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentFolderPath, setCurrentFolderPath] = useState(null);
  const [currentWords, setCurrentWords] = useState(null);

  const t = useCallback((key) => translations[key] || key, [translations]);

  const sidebarOpenRef = useRef(sidebarOpen);
  useEffect(() => { sidebarOpenRef.current = sidebarOpen; }, [sidebarOpen]);

  const translationsRef = useRef(translations);
  useEffect(() => { translationsRef.current = translations; }, [translations]);

  const applyLang = useCallback((code) => {
    const validCode = SUPPORTED_LANGUAGES[code] ? code : 'ko';
    setLang(validCode);
    setTranslations(LANG_FILES[validCode] ?? LANG_FILES.en);
    AsyncStorage.setItem(LANG_KEY, validCode).catch(() => {});
  }, []);

  useEffect(() => {
    // 앱 설정 로드
    AsyncStorage.getItem(LANG_KEY).then((saved) => {
      if (saved && LANG_FILES[saved]) applyLang(saved);
    });

    // 초기 폴더 선택
    const first = structure?.[0]?.subCategories?.[0]?.folders?.[0];
    if (first) {
      setCurrentFolderPath(first.path);
      setCurrentWords(etymologyData[first.dataPath] ?? null);
    }

    if (Platform.OS !== 'android') return () => {};

    const onBackPress = () => {
      if (sidebarOpenRef.current) {
        setSidebarOpen(false);
        return true;
      }
      const tr = translationsRef.current;
      Alert.alert(
        tr.exitTitle,
        tr.exitMessage,
        [
          { text: tr.exitCancel, style: 'cancel' },
          { text: tr.exitConfirm, style: 'destructive', onPress: () => BackHandler.exitApp() },
        ]
      );
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [applyLang]);

  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const selectFolder = useCallback((folderPath, dataPath) => {
    if (!folderPath || !dataPath) return;
    setCurrentFolderPath(folderPath);
    setSidebarOpen(false);
    setCurrentWords(etymologyData[dataPath] ?? null);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <TopBar
        t={t}
        lang={lang}
        supportedLanguages={SUPPORTED_LANGUAGES}
        onToggleSidebar={toggleSidebar}
        onChangeLang={applyLang}
      />
      <View style={styles.content}>
        <EtymologyView
          data={currentWords}
          lang={lang}
          t={t}
          folderPath={currentFolderPath}
        />

        <Sidebar
          folders={structure}
          t={t}
          lang={lang}
          isOpen={sidebarOpen}
          selectedPath={currentFolderPath}
          onSelect={selectFolder}
          onClose={closeSidebar}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ffffff' },
  content: { flex: 1, flexDirection: 'row' },
});
