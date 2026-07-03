import React, { useState, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
} from 'react-native';

const TopBar = memo(function TopBar({ t, lang, supportedLanguages, onToggleSidebar, onChangeLang }) {
  const [langMenuVisible, setLangMenuVisible] = useState(false);

  return (
    <View style={styles.bar}>
      <TouchableOpacity style={styles.iconBtn} onPress={onToggleSidebar} hitSlop={HIT_SLOP}>
        <Text style={styles.hamburger}>☰</Text>
      </TouchableOpacity>

      <Text style={styles.title} numberOfLines={1}>
        {t('appName')}
      </Text>

      <TouchableOpacity style={styles.langBtn} onPress={() => setLangMenuVisible(true)}>
        <Text style={styles.langBtnText}>{t('menuLang')}</Text>
        <Text style={styles.langChevron}>▾</Text>
      </TouchableOpacity>

      <Modal
        visible={langMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLangMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setLangMenuVisible(false)}
        >
          <View style={styles.langMenu}>
            {Object.entries(supportedLanguages).map(([code, name]) => (
              <TouchableOpacity
                key={code}
                style={[styles.langItem, lang === code && styles.langItemSelected]}
                onPress={() => {
                  onChangeLang(code);
                  setLangMenuVisible(false);
                }}
              >
                <Text style={[styles.langItemText, lang === code && styles.langItemTextSelected]}>
                  {name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
});

export default TopBar;

const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'android' ? 10 : 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  iconBtn: { padding: 4 },
  hamburger: { fontSize: 24, color: '#6c757d', lineHeight: 28 },
  langChevron: { fontSize: 12, color: '#495057', marginLeft: 3 },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: '#212529',
    marginHorizontal: 8,
  },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  langBtnText: { fontSize: 13, color: '#495057' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 56,
    paddingRight: 12,
  },
  langMenu: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    minWidth: 150,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
    overflow: 'hidden',
  },
  langItem: { paddingVertical: 13, paddingHorizontal: 16 },
  langItemSelected: { backgroundColor: '#007bff' },
  langItemText: { fontSize: 14, color: '#212529' },
  langItemTextSelected: { color: '#ffffff' },
});
