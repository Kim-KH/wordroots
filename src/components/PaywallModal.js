import React, { memo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

const FEATURES = ['paywallFeature1', 'paywallFeature2', 'paywallFeature3'];

const PaywallModal = memo(function PaywallModal({
  visible,
  onClose,
  onPurchase,
  onRestore,
  loading,
  t,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>

          <Text style={styles.icon}>🔓</Text>
          <Text style={styles.title}>{t('paywallTitle')}</Text>
          <Text style={styles.subtitle}>{t('paywallSubtitle')}</Text>

          <View style={styles.divider} />

          <View style={styles.features}>
            {FEATURES.map((key) => (
              <View key={key} style={styles.featureRow}>
                <Text style={styles.check}>✓</Text>
                <Text style={styles.featureText}>{t(key)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          <TouchableOpacity
            style={[styles.buyBtn, loading && styles.buyBtnDisabled]}
            onPress={onPurchase}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buyBtnText}>{t('paywallBuyBtn')}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.restoreBtn}
            onPress={onRestore}
            disabled={loading}
          >
            <Text style={styles.restoreBtnText}>{t('paywallRestoreBtn')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
});

export default PaywallModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 18,
  },
  closeBtnText: {
    fontSize: 18,
    color: '#adb5bd',
    fontWeight: '600',
  },
  icon: {
    fontSize: 40,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 16,
  },
  features: {
    width: '100%',
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  check: {
    fontSize: 15,
    color: '#2b5be0',
    fontWeight: '700',
    lineHeight: 21,
  },
  featureText: {
    fontSize: 14,
    color: '#343a40',
    flex: 1,
    lineHeight: 21,
  },
  buyBtn: {
    width: '100%',
    backgroundColor: '#2b5be0',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 12,
  },
  buyBtnDisabled: {
    opacity: 0.6,
  },
  buyBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  restoreBtn: {
    paddingVertical: 6,
  },
  restoreBtnText: {
    fontSize: 13,
    color: '#868e96',
    textDecorationLine: 'underline',
  },
});
