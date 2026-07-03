import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  initConnection,
  endConnection,
  purchaseUpdatedListener,
  purchaseErrorListener,
  requestPurchase,
  finishTransaction,
  getAvailablePurchases,
} from 'react-native-iap';

export const PRODUCT_ID = 'unlock_full';
const PURCHASE_KEY = 'etym_purchased';

export function usePurchase() {
  const [isPurchased, setIsPurchased] = useState(false);
  const [loading, setLoading] = useState(false);
  const purchaseListenerRef = useRef(null);
  const errorListenerRef = useRef(null);

  useEffect(() => {
    AsyncStorage.getItem(PURCHASE_KEY).then((val) => {
      if (val === 'true') setIsPurchased(true);
    });

    initConnection().catch(() => {});

    purchaseListenerRef.current = purchaseUpdatedListener(async (purchase) => {
      if (purchase?.productId === PRODUCT_ID) {
        try {
          await finishTransaction({ purchase, isConsumable: false });
          await AsyncStorage.setItem(PURCHASE_KEY, 'true');
          setIsPurchased(true);
        } catch (_) {}
        setLoading(false);
      }
    });

    errorListenerRef.current = purchaseErrorListener(() => {
      setLoading(false);
    });

    return () => {
      purchaseListenerRef.current?.remove();
      errorListenerRef.current?.remove();
      endConnection().catch(() => {});
    };
  }, []);

  const purchase = useCallback(async () => {
    setLoading(true);
    try {
      await requestPurchase({ sku: PRODUCT_ID });
    } catch (_) {
      setLoading(false);
    }
  }, []);

  const restore = useCallback(async () => {
    setLoading(true);
    try {
      const purchases = await getAvailablePurchases();
      const found = purchases.some((p) => p.productId === PRODUCT_ID);
      if (found) {
        await AsyncStorage.setItem(PURCHASE_KEY, 'true');
        setIsPurchased(true);
      }
    } catch (_) {}
    setLoading(false);
  }, []);

  const devUnlock = useCallback(async () => {
    await AsyncStorage.setItem(PURCHASE_KEY, 'true');
    setIsPurchased(true);
  }, []);

  return { isPurchased, loading, purchase, restore, devUnlock };
}
