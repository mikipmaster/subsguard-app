import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Platform, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { theme } from '../../constants/theme';

const categories = [
  { value: 'STREAMING', label: 'Streaming', icon: 'play-circle' },
  { value: 'FITNESS', label: 'Fitness', icon: 'barbell' },
  { value: 'SAAS', label: 'SaaS', icon: 'cloud' },
  { value: 'GAMING', label: 'Gaming', icon: 'game-controller' },
  { value: 'MUSIC', label: 'Muzyka', icon: 'musical-notes' },
  { value: 'CLOUD_STORAGE', label: 'Cloud', icon: 'cloud-upload' },
  { value: 'NEWS', label: 'News', icon: 'newspaper' },
  { value: 'EDUCATION', label: 'Edukacja', icon: 'school' },
  { value: 'OTHER', label: 'Inne', icon: 'apps' },
];

const billingCycles = [
  { value: 'MONTHLY', label: 'Miesięcznie' },
  { value: 'YEARLY', label: 'Rocznie' },
  { value: 'WEEKLY', label: 'Tygodniowo' },
  { value: 'QUARTERLY', label: 'Kwartalnie' },
];

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function toLocalDateInput(value: unknown): string {
  const d = value instanceof Date ? value : new Date(String(value ?? ''));
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function toLocalTimeInput(value: unknown): string {
  const d = value instanceof Date ? value : new Date(String(value ?? ''));
  if (Number.isNaN(d.getTime())) return '';
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export default function EditSubscriptionModal() {
  const { id } = useLocalSearchParams();
  const { subscriptions, updateSubscription, deleteSubscription } = useSubscriptionStore();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const subscription = subscriptions.find((s) => s._id === id);

  const [formData, setFormData] = useState({
    name: subscription?.name || '',
    category: subscription?.category || 'OTHER',
    price: subscription?.price.toString() || '',
    currency: subscription?.currency || 'PLN',
    billingCycle: subscription?.billingCycle || 'MONTHLY',
    useStartAt: !!(subscription as any)?.startAt,
    startDate: (subscription as any)?.startAt
      ? toLocalDateInput((subscription as any).startAt)
      : new Date(subscription?.startDate || new Date()).toISOString().slice(0, 10),
    startTime: (subscription as any)?.startAt
      ? toLocalTimeInput((subscription as any).startAt)
      : '09:00',
    customNotificationsDraft: Array.isArray((subscription as any)?.customNotifications)
      ? ((subscription as any).customNotifications as any[]).map((cn) => ({
          date: toLocalDateInput(cn?.notifyAt),
          time: toLocalTimeInput(cn?.notifyAt),
          note: String(cn?.note ?? ''),
        }))
      : ([] as { date: string; time: string; note: string }[]),
    notes: subscription?.notes || '',
    reminders: (subscription as any)?.reminders || [],
  });

  useEffect(() => {
    if (subscription) {
      setFormData({
        name: subscription.name,
        category: subscription.category,
        price: subscription.price.toString(),
        currency: subscription.currency,
        billingCycle: subscription.billingCycle,
        useStartAt: !!(subscription as any)?.startAt,
        startDate: (subscription as any)?.startAt
          ? toLocalDateInput((subscription as any).startAt)
          : new Date((subscription as any).startDate || new Date()).toISOString().slice(0, 10),
        startTime: (subscription as any)?.startAt
          ? toLocalTimeInput((subscription as any).startAt)
          : '09:00',
        customNotificationsDraft: Array.isArray((subscription as any)?.customNotifications)
          ? ((subscription as any).customNotifications as any[]).map((cn) => ({
              date: toLocalDateInput(cn?.notifyAt),
              time: toLocalTimeInput(cn?.notifyAt),
              note: String(cn?.note ?? ''),
            }))
          : ([] as { date: string; time: string; note: string }[]),
        notes: subscription.notes || '',
        reminders: (subscription as any)?.reminders || [],
      });
    }
  }, [subscription]);

  const toNotifyAtIso = (date: string, time: string) => {
    const d = String(date ?? '').trim();
    const t = String(time ?? '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(t)) return null;
    const dt = new Date(`${d}T${t}:00`);
    if (Number.isNaN(dt.getTime())) return null;
    return dt.toISOString();
  };

  const toStartAtIso = () => {
    const date = String((formData as any).startDate ?? '').trim();
    const time = String((formData as any).startTime ?? '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) return null;
    const d = new Date(`${date}T${time}:00`);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  };

  const handleUpdate = async () => {
    if (!formData.name || !formData.price) {
      Alert.alert('Błąd', 'Wypełnij wszystkie wymagane pola');
      return;
    }

    try {
      setLoading(true);
      const useStartAt = !!(formData as any).useStartAt;
      const startAt = useStartAt ? toStartAtIso() : null;
      if (useStartAt && !startAt) {
        throw new Error('Nieprawidłowa data startu lub godzina (YYYY-MM-DD oraz HH:MM)');
      }

      const customNotifications = Array.isArray((formData as any).customNotificationsDraft)
        ? ((formData as any).customNotificationsDraft as any[])
            .map((n) => {
              const notifyAt = toNotifyAtIso(n?.date, n?.time);
              if (!notifyAt) return null;
              const note = String(n?.note ?? '').trim();
              return { notifyAt, note: note || undefined, enabled: true };
            })
            .filter(Boolean)
        : [];

      await updateSubscription(id as string, {
        ...formData,
        ...(useStartAt ? { startAt } : { startAt: null }),
        customNotifications,
        price: parseFloat(formData.price),
        notes: formData.notes?.trim() ? formData.notes.trim() : undefined,
      });
      Alert.alert('Sukces', 'Subskrypcja zaktualizowana!');
      router.back();
    } catch (error: any) {
      Alert.alert('Błąd', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    const runDelete = async () => {
      try {
        setDeleting(true);
        await deleteSubscription(id as string);
        router.back();
      } catch (error: any) {
        if (Platform.OS === 'web') {
          window.alert(error?.message ?? 'Failed to delete subscription');
        } else {
          Alert.alert('Błąd', error.message);
        }
      } finally {
        setDeleting(false);
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Czy na pewno chcesz usunąć tę subskrypcję?');
      if (confirmed) runDelete();
      return;
    }

    Alert.alert('Usuń subskrypcję', 'Czy na pewno chcesz usunąć tę subskrypcję?', [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Usuń', style: 'destructive', onPress: runDelete },
    ]);
  };

  if (!subscription) {
    return (
      <View style={styles.container}>
        <Text>Nie znaleziono subskrypcji</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F0C29', '#302B63', '#24243E']}
        locations={[0, 0.55, 1]}
        style={styles.gradientBackground}
      />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="rgba(255,255,255,0.92)" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edytuj subskrypcję</Text>
        <TouchableOpacity onPress={handleDelete}>
          <Ionicons name="trash-outline" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Input
          label="Nazwa *"
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          placeholder="Netflix, Spotify..."
        />

        {/* Category Selector */}
        <Text style={styles.label}>Kategoria</Text>
        <View style={styles.categoryGrid}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.value}
              style={[
                styles.categoryButton,
                formData.category === cat.value && styles.categoryButtonActive,
              ]}
              onPress={() => setFormData({ ...formData, category: cat.value as any })}
            >
              <Ionicons
                name={cat.icon as any}
                size={24}
                color={formData.category === cat.value ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.70)'}
              />
              <Text
                style={[
                  styles.categoryText,
                  formData.category === cat.value && styles.categoryTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Dokładne powiadomienie</Text>
        <View style={styles.remindersBox}>
          {Array.isArray((formData as any).customNotificationsDraft) && (formData as any).customNotificationsDraft.length > 0 ? (
            (formData as any).customNotificationsDraft.map((n: any, idx: number) => (
              <View key={idx} style={styles.customRow}>
                <View style={styles.reminderInputs}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reminderMiniLabel}>Data</Text>
                    <TextInput
                      style={styles.reminderInput}
                      value={String(n?.date ?? '')}
                      onChangeText={(text) => {
                        const next = [...((formData as any).customNotificationsDraft as any[])];
                        next[idx] = { ...next[idx], date: text };
                        setFormData({ ...(formData as any), customNotificationsDraft: next } as any);
                      }}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="rgba(255,255,255,0.45)"
                      autoCapitalize="none"
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.reminderMiniLabel}>Godzina</Text>
                    <TextInput
                      style={styles.reminderInput}
                      value={String(n?.time ?? '')}
                      onChangeText={(text) => {
                        const next = [...((formData as any).customNotificationsDraft as any[])];
                        next[idx] = { ...next[idx], time: text };
                        setFormData({ ...(formData as any), customNotificationsDraft: next } as any);
                      }}
                      placeholder="09:00"
                      placeholderTextColor="rgba(255,255,255,0.45)"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={{ marginTop: 10 }}>
                  <Text style={styles.reminderMiniLabel}>Notatka</Text>
                  <TextInput
                    style={styles.reminderInput}
                    value={String(n?.note ?? '')}
                    onChangeText={(text) => {
                      const next = [...((formData as any).customNotificationsDraft as any[])];
                      next[idx] = { ...next[idx], note: text };
                      setFormData({ ...(formData as any), customNotificationsDraft: next } as any);
                    }}
                    placeholder="Treść powiadomienia…"
                    placeholderTextColor="rgba(255,255,255,0.45)"
                    autoCapitalize="sentences"
                    maxLength={500}
                  />
                </View>

                <TouchableOpacity
                  style={styles.reminderRemove}
                  onPress={() => {
                    const next = [...((formData as any).customNotificationsDraft as any[])];
                    next.splice(idx, 1);
                    setFormData({ ...(formData as any), customNotificationsDraft: next } as any);
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.remindersEmpty}>Dodaj jednorazowe powiadomienie na konkretny dzień i godzinę.</Text>
          )}

          <TouchableOpacity
            style={styles.reminderAdd}
            onPress={() => {
              const next = Array.isArray((formData as any).customNotificationsDraft)
                ? [...((formData as any).customNotificationsDraft as any[])]
                : [];
              next.push({
                date: new Date().toISOString().slice(0, 10),
                time: '09:00',
                note: '',
              });
              setFormData({ ...(formData as any), customNotificationsDraft: next } as any);
            }}
          >
            <Ionicons name="add" size={18} color="rgba(255,255,255,0.92)" />
            <Text style={styles.reminderAddText}>Dodaj powiadomienie</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.startToggleRow}
          activeOpacity={0.9}
          onPress={() => setFormData({ ...formData, useStartAt: !(formData as any).useStartAt } as any)}
        >
          <View style={styles.startToggleLeft}>
            <Text style={styles.startToggleTitle}>Ustaw datę startu</Text>
            <Text style={styles.startToggleSubtitle}>Wpłynie na odnowienia i powiadomienia</Text>
          </View>
          <Ionicons
            name={(formData as any).useStartAt ? 'toggle' : 'toggle-outline'}
            size={34}
            color={(formData as any).useStartAt ? 'rgba(191, 168, 255, 0.95)' : 'rgba(255,255,255,0.55)'}
          />
        </TouchableOpacity>

        <View
          style={[styles.row, { marginTop: 12, opacity: (formData as any).useStartAt ? 1 : 0.45 }]}
          pointerEvents={(formData as any).useStartAt ? 'auto' : 'none'}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.reminderMiniLabel}>Data startu</Text>
            <TextInput
              style={styles.reminderInput}
              value={String((formData as any).startDate ?? '')}
              onChangeText={(text) => setFormData({ ...formData, startDate: text } as any)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="rgba(255,255,255,0.45)"
              autoCapitalize="none"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.reminderMiniLabel}>Godzina</Text>
            <TextInput
              style={styles.reminderInput}
              value={String((formData as any).startTime ?? '')}
              onChangeText={(text) => setFormData({ ...formData, startTime: text } as any)}
              placeholder="HH:MM"
              placeholderTextColor="rgba(255,255,255,0.45)"
              autoCapitalize="none"
            />
          </View>
        </View>

        <Text style={styles.label}>Powiadomienia</Text>
        <View style={styles.remindersBox}>
          {Array.isArray(formData.reminders) && formData.reminders.length > 0 ? (
            formData.reminders.map((r: any, idx: number) => (
              <View key={idx} style={styles.reminderRow}>
                <View style={styles.reminderInputs}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reminderMiniLabel}>Dni przed</Text>
                    <TextInput
                      style={styles.reminderInput}
                      value={String(r?.daysBefore ?? '')}
                      onChangeText={(text) => {
                        const next = [...(formData.reminders as any[])];
                        const days = Number(String(text).replace(/[^0-9]/g, ''));
                        next[idx] = { ...next[idx], daysBefore: Number.isFinite(days) ? days : 0 };
                        setFormData({ ...formData, reminders: next });
                      }}
                      keyboardType="numeric"
                      placeholder="3"
                      placeholderTextColor="rgba(255,255,255,0.45)"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reminderMiniLabel}>Godzina</Text>
                    <TextInput
                      style={styles.reminderInput}
                      value={String(r?.time ?? '')}
                      onChangeText={(text) => {
                        const next = [...(formData.reminders as any[])];
                        next[idx] = { ...next[idx], time: text };
                        setFormData({ ...formData, reminders: next });
                      }}
                      placeholder="09:00"
                      placeholderTextColor="rgba(255,255,255,0.45)"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.reminderRemove}
                  onPress={() => {
                    const next = [...(formData.reminders as any[])];
                    next.splice(idx, 1);
                    setFormData({ ...formData, reminders: next });
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.remindersEmpty}>Brak reguł. Dodaj pierwsze powiadomienie.</Text>
          )}

          <TouchableOpacity
            style={styles.reminderAdd}
            onPress={() => {
              const next = Array.isArray(formData.reminders) ? [...(formData.reminders as any[])] : [];
              next.push({ daysBefore: 3, time: '09:00', enabled: true });
              setFormData({ ...formData, reminders: next });
            }}
          >
            <Ionicons name="add" size={18} color="rgba(255,255,255,0.92)" />
            <Text style={styles.reminderAddText}>Dodaj regułę</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <View style={{ flex: 2 }}>
            <Input
              label="Cena *"
              value={formData.price}
              onChangeText={(text) => setFormData({ ...formData, price: text })}
              placeholder="49.99"
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Input
              label="Waluta"
              value={formData.currency}
              onChangeText={(text) => setFormData({ ...formData, currency: text })}
              placeholder="PLN"
              autoCapitalize="characters"
            />
          </View>
        </View>

        {/* Billing Cycle */}
        <Text style={styles.label}>Cykl rozliczeniowy</Text>
        <View style={styles.cycleContainer}>
          {billingCycles.map((cycle) => (
            <TouchableOpacity
              key={cycle.value}
              style={[
                styles.cycleButton,
                formData.billingCycle === cycle.value && styles.cycleButtonActive,
              ]}
              onPress={() => setFormData({ ...formData, billingCycle: cycle.value as any })}
            >
              <Text
                style={[
                  styles.cycleText,
                  formData.billingCycle === cycle.value && styles.cycleTextActive,
                ]}
              >
                {cycle.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.notesHeader}>
          <Text style={styles.label}>Notatki</Text>
          <Text style={styles.notesCounter}>{(formData.notes?.length ?? 0)}/500</Text>
        </View>
        <TextInput
          style={styles.notesInput}
          value={formData.notes}
          onChangeText={(text) => setFormData({ ...formData, notes: text })}
          placeholder="Np. numer klienta, hasło do konta, data promocji…"
          placeholderTextColor="rgba(255,255,255,0.55)"
          multiline
          textAlignVertical="top"
          maxLength={500}
        />

        <Button title="Zapisz zmiany" onPress={handleUpdate} loading={loading} />
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          disabled={deleting}
        >
          <Text style={styles.deleteButtonText}>
            {deleting ? 'Usuwanie...' : 'Usuń subskrypcję'}
          </Text>
        </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.10)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.92)',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  remindersBox: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    marginBottom: 24,
    gap: 10,
  },
  remindersEmpty: {
    color: 'rgba(255,255,255,0.60)',
    fontWeight: '700',
    fontSize: 12,
    lineHeight: 18,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  customRow: {
    gap: 10,
  },
  reminderInputs: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
  },
  reminderMiniLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.65)',
    marginBottom: 8,
  },
  reminderInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    color: 'rgba(255,255,255,0.92)',
  },
  reminderRemove: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 59, 48, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderAdd: {
    marginTop: 6,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(191, 168, 255, 0.20)',
    borderWidth: 1,
    borderColor: 'rgba(191, 168, 255, 0.28)',
  },
  reminderAddText: {
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '900',
    fontSize: 12,
  },
  startToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    marginBottom: 8,
  },
  startToggleLeft: {
    flex: 1,
    paddingRight: 12,
  },
  startToggleTitle: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 15,
    fontWeight: '800',
  },
  startToggleSubtitle: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.60)',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryButton: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  categoryButtonActive: {
    backgroundColor: 'rgba(191, 168, 255, 0.28)',
    borderColor: 'rgba(191, 168, 255, 0.45)',
  },
  categoryText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.70)',
    marginTop: 4,
    textAlign: 'center',
  },
  categoryTextActive: {
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
  },
  cycleContainer: {
    gap: 8,
    marginBottom: 24,
  },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  notesCounter: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.55)',
  },
  notesInput: {
    minHeight: 120,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    color: 'rgba(255,255,255,0.92)',
    marginBottom: 24,
  },
  cycleButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  cycleButtonActive: {
    backgroundColor: 'rgba(191, 168, 255, 0.28)',
    borderColor: 'rgba(191, 168, 255, 0.45)',
  },
  cycleText: {
    color: 'rgba(255,255,255,0.80)',
    fontSize: 14,
    fontWeight: '700',
  },
  cycleTextActive: {
    color: 'rgba(255,255,255,0.95)',
  },
  deleteButton: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
});
