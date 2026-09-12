import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../../components/ui/GlassCard';
import { theme } from '../../constants/theme';
import { ThemePreference, useSettingsStore } from '../../store/settingsStore';

export default function ThemeSettingsScreen() {
  const { themePreference, setThemePreference } = useSettingsStore();
  const [open, setOpen] = useState(true);

  const items = useMemo(
    () =>
      [
        {
          value: 'SYSTEM' as ThemePreference,
          title: 'System',
          subtitle: 'Dopasuj do ustawień telefonu / przeglądarki',
          icon: 'phone-portrait-outline' as const,
        },
        {
          value: 'DARK' as ThemePreference,
          title: 'Ciemny',
          subtitle: 'Najlepszy do nocnego użycia',
          icon: 'moon-outline' as const,
        },
        {
          value: 'LIGHT' as ThemePreference,
          title: 'Jasny',
          subtitle: 'Klasyczny jasny wygląd',
          icon: 'sunny-outline' as const,
        },
      ] as const,
    []
  );

  const close = () => {
    setOpen(false);
    router.back();
  };

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
        <Text style={styles.title}>Motyw</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <GlassCard style={styles.card}>
          <Text style={styles.placeholderTitle}>Preferencja</Text>
          <Text style={styles.placeholderText}>
            Aktualnie: {themePreference === 'SYSTEM' ? 'System' : themePreference === 'LIGHT' ? 'Jasny' : 'Ciemny'}
          </Text>

          <TouchableOpacity style={styles.openPicker} activeOpacity={0.85} onPress={() => setOpen(true)}>
            <Ionicons name="chevron-up" size={18} color="rgba(255,255,255,0.75)" />
            <Text style={styles.openPickerText}>Wybierz motyw</Text>
          </TouchableOpacity>
        </GlassCard>

        <View style={{ height: 140 }} />
      </ScrollView>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeaderRow}>
            <Text style={styles.sheetTitle}>Wybierz motyw</Text>
            <TouchableOpacity onPress={close} style={styles.sheetClose}>
              <Ionicons name="close" size={18} color="rgba(255,255,255,0.85)" />
            </TouchableOpacity>
          </View>

          <View style={styles.list}>
            {items.map((it) => {
              const active = it.value === themePreference;
              return (
                <TouchableOpacity
                  key={it.value}
                  style={[styles.row, active && styles.rowActive]}
                  activeOpacity={0.85}
                  onPress={async () => {
                    await setThemePreference(it.value);
                    close();
                  }}
                >
                  <View style={styles.rowLeft}>
                    <View style={[styles.iconCircle, active && styles.iconCircleActive]}>
                      <Ionicons
                        name={it.icon}
                        size={18}
                        color={active ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.70)'}
                      />
                    </View>
                    <View style={styles.rowText}>
                      <Text style={styles.rowTitle}>{it.title}</Text>
                      <Text style={styles.rowSubtitle}>{it.subtitle}</Text>
                    </View>
                  </View>

                  {active ? (
                    <Ionicons name="checkmark-circle" size={18} color="rgba(108, 99, 255, 0.95)" />
                  ) : (
                    <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.35)" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>
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
  openPicker: {
    marginTop: 16,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  openPickerText: {
    color: 'rgba(255,255,255,0.88)',
    fontWeight: '800',
    fontSize: 12,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 18,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: 'rgba(20, 18, 45, 0.98)',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 52,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginBottom: 10,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.92)',
  },
  sheetClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    marginTop: 12,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  rowActive: {
    backgroundColor: 'rgba(191, 168, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(191, 168, 255, 0.18)',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleActive: {
    backgroundColor: 'rgba(108, 99, 255, 0.20)',
    borderColor: 'rgba(108, 99, 255, 0.35)',
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    color: 'rgba(255,255,255,0.90)',
    fontWeight: '900',
    fontSize: 13,
  },
  rowSubtitle: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.60)',
    fontWeight: '700',
    fontSize: 11,
    lineHeight: 16,
  },
});
