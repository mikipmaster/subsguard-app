import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

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
  });

  useEffect(() => {
    if (subscription) {
      setFormData({
        name: subscription.name,
        category: subscription.category,
        price: subscription.price.toString(),
        currency: subscription.currency,
        billingCycle: subscription.billingCycle,
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
    Alert.alert(
      'Usuń subskrypcję',
      'Czy na pewno chcesz usunąć tę subskrypcję?',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await deleteSubscription(id as string);
              router.back();
            } catch (error: any) {
              Alert.alert('Błąd', error.message);
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edytuj subskrypcję</Text>
        <TouchableOpacity onPress={handleDelete}>
          <Ionicons name="trash-outline" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
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
                color={formData.category === cat.value ? '#007AFF' : '#666'}
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
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
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
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#E8F4FF',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  categoryText: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  categoryTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
  },
  cycleContainer: {
    gap: 8,
    marginBottom: 24,
  },
  cycleButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cycleButtonActive: {
    backgroundColor: '#E8F4FF',
    borderColor: '#007AFF',
  },
  cycleText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  cycleTextActive: {
    color: '#007AFF',
    fontWeight: '600',
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
