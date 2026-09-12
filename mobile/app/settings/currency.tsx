import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable, TextInput } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import GlassCard from '../../components/ui/GlassCard';
import { theme } from '../../constants/theme';
import { useSettingsStore } from '../../store/settingsStore';

export default function CurrencySettingsScreen() {
  const { defaultCurrency, setDefaultCurrency } = useSettingsStore();
  const [open, setOpen] = useState(true);
  const [query, setQuery] = useState('');

  const currencies = useMemo(
    () => [
      { code: 'PLN', name: 'Polski złoty' },
      { code: 'EUR', name: 'Euro' },
      { code: 'USD', name: 'US Dollar' },
      { code: 'GBP', name: 'British Pound' },
      { code: 'CHF', name: 'Swiss Franc' },
      { code: 'SEK', name: 'Swedish Krona' },
      { code: 'NOK', name: 'Norwegian Krone' },
      { code: 'DKK', name: 'Danish Krone' },
      { code: 'CZK', name: 'Czech Koruna' },
    ],
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return currencies;
    return currencies.filter((c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
  }, [currencies, query]);

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
        <Text style={styles.title}>Waluta</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <GlassCard style={styles.card}>
          <Text style={styles.placeholderTitle}>Domyślna waluta</Text>
          <Text style={styles.placeholderText}>
            Aktualnie: {defaultCurrency}
          </Text>

          <TouchableOpacity style={styles.openPicker} activeOpacity={0.85} onPress={() => setOpen(true)}>
            <Ionicons name="chevron-up" size={18} color="rgba(255,255,255,0.75)" />
            <Text style={styles.openPickerText}>Wybierz walutę</Text>
          </TouchableOpacity>
        </GlassCard>

        <View style={{ height: 140 }} />
      </ScrollView>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeaderRow}>
            <Text style={styles.sheetTitle}>Wybierz walutę</Text>
            <TouchableOpacity onPress={close} style={styles.sheetClose}>
              <Ionicons name="close" size={18} color="rgba(255,255,255,0.85)" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchWrap}>
            <Ionicons name="search" size={16} color="rgba(255,255,255,0.55)" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Szukaj (PLN, Euro…)"
              placeholderTextColor="rgba(255,255,255,0.45)"
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
            {filtered.map((c) => {
              const active = c.code === defaultCurrency;
              return (
                <TouchableOpacity
                  key={c.code}
                  style={[styles.row, active && styles.rowActive]}
                  activeOpacity={0.85}
                  onPress={async () => {
                    await setDefaultCurrency(c.code);
                    close();
                  }}
                >
                  <View style={styles.rowLeft}>
                    <View style={[styles.codePill, active && styles.codePillActive]}>
                      <Text style={[styles.codeText, active && styles.codeTextActive]}>{c.code}</Text>
                    </View>
                    <Text style={styles.rowName}>{c.name}</Text>
                  </View>
                  {active ? (
                    <Ionicons name="checkmark-circle" size={18} color="rgba(108, 99, 255, 0.95)" />
                  ) : (
                    <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.35)" />
                  )}
                </TouchableOpacity>
              );
            })}
            <View style={{ height: 22 }} />
          </ScrollView>
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
  searchWrap: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  searchInput: {
    flex: 1,
    color: 'rgba(255,255,255,0.88)',
    fontWeight: '700',
    fontSize: 14,
  },
  listContent: {
    paddingTop: 12,
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
  codePill: {
    minWidth: 54,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
  },
  codePillActive: {
    backgroundColor: 'rgba(108, 99, 255, 0.20)',
    borderColor: 'rgba(108, 99, 255, 0.35)',
  },
  codeText: {
    color: 'rgba(255,255,255,0.78)',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.6,
  },
  codeTextActive: {
    color: 'rgba(255,255,255,0.92)',
  },
  rowName: {
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '800',
    fontSize: 13,
    flex: 1,
  },
});
