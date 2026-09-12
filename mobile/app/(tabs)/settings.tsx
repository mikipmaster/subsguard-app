import { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import GlassCard from '../../components/ui/GlassCard';
import { theme } from '../../constants/theme';

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const { defaultCurrency, themePreference, loadSettings } = useSettingsStore();

  useEffect(() => {
    loadSettings();
  }, []);

  const handleLogout = () => {
    const runLogout = async () => {
      try {
        await logout();
        router.replace('/(auth)/login');
      } catch (e: any) {
        const msg = e?.message || 'Nie udało się wylogować';
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('Błąd', msg);
      }
    };

    if (Platform.OS === 'web') {
      const ok = window.confirm('Czy na pewno chcesz się wylogować?');
      if (ok) runLogout();
      return;
    }

    Alert.alert('Wyloguj', 'Czy na pewno chcesz się wylogować?', [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Wyloguj',
        style: 'destructive',
        onPress: runLogout,
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F0C29', '#302B63', '#24243E']}
        locations={[0, 0.55, 1]}
        style={styles.gradientBackground}
      />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Ustawienia</Text>
        </View>

      {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profil</Text>
          <GlassCard style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              <View style={styles.tierBadge}>
                <Text style={styles.tierText}>{user?.tier} PLAN</Text>
              </View>
            </View>
          </GlassCard>
        </View>

      {/* Settings Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ogólne</Text>

          <GlassCard style={styles.listCard}>
            <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/settings/notifications')}>
              <View style={styles.settingLeft}>
                <Ionicons name="notifications-outline" size={20} color="rgba(191, 168, 255, 0.95)" />
                <Text style={styles.settingText}>Powiadomienia</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.55)" />
            </TouchableOpacity>

            <View style={styles.itemDivider} />

            <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/settings/currency')}>
              <View style={styles.settingLeft}>
                <Ionicons name="cash-outline" size={20} color="rgba(191, 168, 255, 0.95)" />
                <Text style={styles.settingText}>Waluta domyślna</Text>
              </View>
              <View style={styles.settingRight}>
                <Text style={styles.settingValue}>{defaultCurrency}</Text>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.55)" />
              </View>
            </TouchableOpacity>

            <View style={styles.itemDivider} />

            <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/settings/theme')}>
              <View style={styles.settingLeft}>
                <Ionicons name="color-palette-outline" size={20} color="rgba(191, 168, 255, 0.95)" />
                <Text style={styles.settingText}>Motyw</Text>
              </View>
              <View style={styles.settingRight}>
                <Text style={styles.settingValue}>{themePreference === 'SYSTEM' ? 'System' : themePreference === 'LIGHT' ? 'Jasny' : 'Ciemny'}</Text>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.55)" />
              </View>
            </TouchableOpacity>
          </GlassCard>
        </View>

      {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Konto</Text>

          <GlassCard style={styles.listCard}>
            <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/settings/premium')}>
              <View style={styles.settingLeft}>
                <Ionicons name="card-outline" size={20} color="rgba(191, 168, 255, 0.95)" />
                <Text style={styles.settingText}>Premium</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.55)" />
            </TouchableOpacity>

            <View style={styles.itemDivider} />

            <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/settings/privacy')}>
              <View style={styles.settingLeft}>
                <Ionicons name="shield-checkmark-outline" size={20} color="rgba(191, 168, 255, 0.95)" />
                <Text style={styles.settingText}>Prywatność</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.55)" />
            </TouchableOpacity>

            <View style={styles.itemDivider} />

            <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/settings/support')}>
              <View style={styles.settingLeft}>
                <Ionicons name="help-circle-outline" size={20} color="rgba(191, 168, 255, 0.95)" />
                <Text style={styles.settingText}>Pomoc i wsparcie</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.55)" />
            </TouchableOpacity>
          </GlassCard>
        </View>

      {/* Logout */}
        <View style={styles.section}>
          <GlassCard style={styles.logoutCard}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
              <Text style={styles.logoutText}>Wyloguj się</Text>
            </TouchableOpacity>
          </GlassCard>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>SubsGuard v1.0.0</Text>
          <Text style={styles.footerText}>Made with ❤️</Text>
        </View>

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
  scroll: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.95)',
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.55)',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  listCard: {
    padding: 0,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 18,
  },
  itemDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.10)',
    marginLeft: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.14)',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(191, 168, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.92)',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    marginBottom: 8,
  },
  tierBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  tierText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '600',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '700',
  },
  logoutCard: {
    padding: 0,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.14)',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    marginBottom: 4,
  },
});
