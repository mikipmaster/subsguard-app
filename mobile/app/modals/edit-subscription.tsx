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
    notes: subscription?.notes || '',
  });

  useEffect(() => {
    if (subscription) {
      setFormData({
        name: subscription.name,
        category: subscription.category,
        price: subscription.price.toString(),
        currency: subscription.currency,
        billingCycle: subscription.billingCycle,
        notes: subscription.notes || '',
      });
    }
  }, [subscription]);

  const handleUpdate = async () => {
    if (!formData.name || !formData.price) {
      Alert.alert('Błąd', 'Wypełnij wszystkie wymagane pola');
      return;
    }

    try {
      setLoading(true);
      await updateSubscription(id as string, {
        ...formData,
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
