import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import GlassCard from '../../components/ui/GlassCard';
import { theme } from '../../constants/theme';
import api from '../../services/api';

export default function NotificationsSettingsScreen() {
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const [loading, setLoading] = useState(false);

  const refreshStatus = async () => {
    if (Platform.OS === 'web') {
      setPermissionStatus('not_supported');
      return;
    }

    const { status } = await Notifications.getPermissionsAsync();
    setPermissionStatus(status);
  };

  const sendTest = async () => {
    if (Platform.OS === 'web') {
      window.alert('Test push jest dostępny na urządzeniu mobilnym.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/notifications/test');
      Alert.alert('Powiadomienia', 'Wysłano testowe powiadomienie.');
    } catch (e: any) {
      Alert.alert('Powiadomienia', e?.message || 'Nie udało się wysłać testowego push.' );
    } finally {
      setLoading(false);
    }
  };

  const registerToken = async () => {
    if (Platform.OS === 'web') return;

    setLoading(true);
    try {
      const projectId =
        (Constants as any)?.expoConfig?.extra?.eas?.projectId ??
        (Constants as any)?.easConfig?.projectId;

      const hasProjectId = !!projectId && String(projectId).trim().length > 0;
      if (!hasProjectId) {
        Alert.alert(
          'Powiadomienia',
          'Nie wykryto projectId (EAS). Spróbuję zarejestrować token w trybie kompatybilnym. Jeśli to nie zadziała, uzupełnij expo.extra.eas.projectId w mobile/app.json.'
        );
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      setPermissionStatus(finalStatus);
      if (finalStatus !== 'granted') return;

      let pushToken: string | null = null;
      try {
        if (hasProjectId) {
          const token = await Notifications.getExpoPushTokenAsync({ projectId: String(projectId) });
          pushToken = token?.data ?? null;
        } else {
          const token = await Notifications.getExpoPushTokenAsync();
          pushToken = token?.data ?? null;
        }
      } catch (e: any) {
        const msg = e?.message || 'Nie udało się pobrać tokenu push.';
        Alert.alert('Powiadomienia', msg);
        return;
      }

      if (!pushToken) {
        Alert.alert('Powiadomienia', 'Nie udało się pobrać tokenu push (token jest pusty).');
        return;
      }

      await api.post('/users/push-token', { pushToken });
      Alert.alert('Powiadomienia', 'Zarejestrowano token push w backendzie.');
    } catch (e: any) {
      const msg = e?.message || 'Nie udało się zarejestrować tokenu push.';
      Alert.alert('Powiadomienia', msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  const statusLabel =
    permissionStatus === 'granted'
      ? 'Włączone'
      : permissionStatus === 'denied'
        ? 'Wyłączone'
        : permissionStatus === 'not_supported'
          ? 'Niedostępne na WEB'
          : 'Nieznane';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F0C29', '#302B63', '#24243E']}
        locations={[0, 0.55, 1]}
        style={styles.gradientBackground}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.92)" />
        </TouchableOpacity>
        <Text style={styles.title}>Powiadomienia</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <GlassCard style={styles.card}>
          <Text style={styles.placeholderTitle}>Powiadomienia push</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Status:</Text>
            <Text style={styles.statusValue}>{statusLabel}</Text>
          </View>

          <Text style={styles.placeholderText}>
            Powiadomienia ustawiasz per subskrypcja (dowolna liczba reguł: ile dni przed i o której godzinie).
          </Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, loading && { opacity: 0.65 }]}
              disabled={loading}
              onPress={registerToken}
              activeOpacity={0.9}
            >
              <Ionicons name="notifications" size={18} color="rgba(255,255,255,0.92)" />
              <Text style={styles.actionButtonText}>{loading ? 'Rejestrowanie…' : 'Zarejestruj token'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButtonAlt} onPress={refreshStatus} activeOpacity={0.9}>
              <Ionicons name="refresh" size={18} color="rgba(255,255,255,0.92)" />
              <Text style={styles.actionButtonText}>Odśwież</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.testButton, loading && { opacity: 0.65 }]}
            disabled={loading}
            onPress={sendTest}
            activeOpacity={0.9}
          >
            <Ionicons name="paper-plane" size={18} color="rgba(255,255,255,0.92)" />
            <Text style={styles.actionButtonText}>Wyślij testowe powiadomienie</Text>
          </TouchableOpacity>
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={styles.placeholderTitle}>Konfiguracja reguł</Text>
          <Text style={styles.placeholderText}>
            Wejdź w subskrypcję i dodaj reguły w sekcji „Powiadomienia”.
          </Text>

          <TouchableOpacity
            style={styles.ctaRow}
            activeOpacity={0.9}
            onPress={() => router.push('/(tabs)/subscriptions')}
          >
            <View style={styles.ctaLeft}>
              <Ionicons name="list" size={18} color="rgba(191, 168, 255, 0.95)" />
              <Text style={styles.ctaText}>Przejdź do subskrypcji</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.55)" />
          </TouchableOpacity>
        </GlassCard>

        <View style={{ height: 140 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.92)',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.14)',
  },
  placeholderTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.92)',
  },
  placeholderText: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.65)',
  },
  statusRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.70)',
  },
  statusValue: {
    fontSize: 13,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.92)',
  },
  actionsRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(191, 168, 255, 0.24)',
    borderWidth: 1,
    borderColor: 'rgba(191, 168, 255, 0.30)',
  },
  actionButtonAlt: {
    width: 120,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.92)',
  },
  testButton: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(34, 197, 94, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.22)',
  },
  ctaRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  ctaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.92)',
  },
});
