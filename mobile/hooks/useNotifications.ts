import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

import api from '../services/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  const projectId =
    (Constants as any)?.expoConfig?.extra?.eas?.projectId ??
    (Constants as any)?.easConfig?.projectId;

  if (!projectId || String(projectId).trim().length === 0) {
    console.warn(
      'No EAS projectId found. Will try to register Expo push token using compatibility mode (no projectId).'
    );
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  try {
    if (projectId && String(projectId).trim().length > 0) {
      const token = await Notifications.getExpoPushTokenAsync({ projectId: String(projectId) });
      return token?.data ?? null;
    }

    // Fallback dla środowisk, gdzie projectId nie jest dostępne (np. starsza konfiguracja Expo / Expo Go).
    const token = await Notifications.getExpoPushTokenAsync();
    return token?.data ?? null;
  } catch (e) {
    console.warn('Failed to get Expo push token:', (e as any)?.message ?? e);
    return null;
  }
}

export function useNotifications(enabled: boolean) {
  const registered = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (registered.current) return;

    registered.current = true;

    const run = async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        if (!token) return;

        await api.post('/users/push-token', { pushToken: token });
      } catch (e) {
        console.warn('Failed to register push token in backend:', (e as any)?.message ?? e);
      }
    };

    run();
  }, [enabled]);
}
