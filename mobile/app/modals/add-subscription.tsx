import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Animated } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import { showToast } from '../../utils/toast';
import AnimatedButton from '../../components/ui/AnimatedButton';
import GlassCard from '../../components/ui/GlassCard';
import { theme } from '../../constants/theme';

const categories = [
  { value: 'STREAMING', label: 'Streaming', icon: 'play-circle', color: '#FF6B6B', gradient: ['#FF6B6B', '#FF8E53'] },
  { value: 'FITNESS', label: 'Fitness', icon: 'barbell', color: '#4ECDC4', gradient: ['#4ECDC4', '#44A08D'] },
  { value: 'SAAS', label: 'SaaS', icon: 'cloud', color: '#5AC8FA', gradient: ['#5AC8FA', '#0A84FF'] },
  { value: 'GAMING', label: 'Gaming', icon: 'game-controller', color: '#BF5AF2', gradient: ['#BF5AF2', '#AF52DE'] },
  { value: 'MUSIC', label: 'Muzyka', icon: 'musical-notes', color: '#FF9F0A', gradient: ['#FF9F0A', '#FF9500'] },
  { value: 'CLOUD_STORAGE', label: 'Cloud', icon: 'cloud-upload', color: '#64D2FF', gradient: ['#64D2FF', '#32ADE6'] },
  { value: 'NEWS', label: 'News', icon: 'newspaper', color: '#FFD60A', gradient: ['#FFD60A', '#FF9500'] },
  { value: 'EDUCATION', label: 'Edukacja', icon: 'school', color: '#BF5AF2', gradient: ['#BF5AF2', '#DA70D6'] },
  { value: 'OTHER', label: 'Inne', icon: 'apps', color: '#8E8E93', gradient: ['#8E8E93', '#636366'] },
];

const billingCycles = [
  { value: 'WEEKLY', label: 'Tyg.', icon: 'calendar', fullLabel: 'Co tydzień' },
  { value: 'MONTHLY', label: 'Msc.', icon: 'calendar', fullLabel: 'Co miesiąc' },
  { value: 'QUARTERLY', label: 'Kw.', icon: 'calendar', fullLabel: 'Co kwartał' },
  { value: 'YEARLY', label: 'Rok', icon: 'calendar', fullLabel: 'Co rok' },
];

export default function AddSubscriptionModal() {
    const { addSubscription } = useSubscriptionStore();
    const [loading, setLoading] = useState(false);
    const [scrollY] = useState(new Animated.Value(0));

    const handleScroll = (event: any) => {
      scrollY.setValue(event?.nativeEvent?.contentOffset?.y ?? 0);
    };
  
    const [formData, setFormData] = useState({
      name: '',
      category: 'STREAMING',
      price: '',
      currency: 'PLN',
      billingCycle: 'MONTHLY',
      notes: '',
    });
  
    const handleSubmit = async () => {
      if (!formData.name || !formData.price) {
        showToast.error('Wypełnij wszystkie wymagane pola');
        return;
      }
  
      try {
        setLoading(true);

        await addSubscription({
          name: formData.name,
          category: formData.category as any,
          price: parseFloat(formData.price),
          currency: formData.currency,
          billingCycle: formData.billingCycle as any,
          notes: formData.notes?.trim() ? formData.notes.trim() : undefined,
        } as any);
        showToast.success('Subskrypcja dodana! 🎉');
        router.back();
      } catch (error: any) {
        showToast.error(error.message);
      } finally {
        setLoading(false);
      }
    };
  
    const selectedCategory = categories.find(c => c.value === formData.category);
    const gradientColors = (selectedCategory?.gradient || ['#667eea', '#764ba2']) as [string, string];
  
    return (
      <View style={styles.container}>
        {/* Animated Gradient Background */}
        <LinearGradient
          colors={['#0F0C29', '#302B63', '#24243E']}
          locations={[0, 0.55, 1]}
          style={styles.gradientBackground}
        />
  
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nowa subskrypcja</Text>
          <View style={{ width: 28 }} />
        </View>
  
        <Animated.ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {/* Big Icon Preview */}
          <View style={styles.previewSection}>
            <Animated.View>
              <LinearGradient
                colors={gradientColors}
                style={styles.bigIcon}
              >
                <Ionicons 
                  name={selectedCategory?.icon as any || 'apps'} 
                  size={64} 
                  color="#fff" 
                />
              </LinearGradient>
            </Animated.View>
          </View>
  
          {/* Name Input */}
          <View style={styles.section}>
            <Text style={styles.label}>Nazwa subskrypcji *</Text>
            <GlassCard style={styles.inputCard}>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Netflix, Spotify, Gym..."
                placeholderTextColor={theme.colors.textSecondary}
              />
            </GlassCard>
          </View>
  
          {/* Category Grid */}
          <View style={styles.section}>
            <Text style={styles.label}>Kategoria</Text>
            <View style={styles.categoryGrid}>
              {categories.map((cat) => {
                const isSelected = formData.category === cat.value;
                return (
                  <TouchableOpacity
                    key={cat.value}
                    onPress={() => setFormData({ ...formData, category: cat.value as any })}
                    activeOpacity={0.7}
                  >
                    <Animated.View>
                      {isSelected ? (
                        <LinearGradient
                          colors={cat.gradient as [string, string]}
                          style={styles.categoryButton}
                        >
                          <Ionicons name={cat.icon as any} size={28} color="#fff" />
                          <Text style={styles.categoryTextActive}>{cat.label}</Text>
                        </LinearGradient>
                      ) : (
                        <View style={[styles.categoryButton, styles.categoryButtonInactive]}>
                          <Ionicons name={cat.icon as any} size={28} color={theme.colors.textSecondary} />
                          <Text style={styles.categoryTextInactive}>{cat.label}</Text>
                        </View>
                      )}
                    </Animated.View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
  
          {/* Price & Currency */}
          <View style={styles.section}>
            <Text style={styles.label}>Cena *</Text>
            <View style={styles.row}>
              <GlassCard style={[styles.inputCard, { flex: 2 }]}>
                <TextInput
                  style={styles.input}
                  value={formData.price}
                  onChangeText={(text) => setFormData({ ...formData, price: text.replace(/[^0-9.]/g, '') })}
                  placeholder="49.99"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="decimal-pad"
                />
              </GlassCard>
              <GlassCard style={[styles.inputCard, { flex: 1 }]}>
                <TextInput
                  style={styles.input}
                  value={formData.currency}
                  onChangeText={(text) => setFormData({ ...formData, currency: text.toUpperCase() })}
                  placeholder="PLN"
                  placeholderTextColor={theme.colors.textSecondary}
                  maxLength={3}
                  autoCapitalize="characters"
                />
              </GlassCard>
            </View>
          </View>
  
          {/* Billing Cycle */}
          <View style={styles.section}>
            <Text style={styles.label}>Cykl rozliczeniowy</Text>
            <View style={styles.cycleGrid}>
              {billingCycles.map((cycle) => {
                const isSelected = formData.billingCycle === cycle.value;
                return (
                  <TouchableOpacity
                    key={cycle.value}
                    onPress={() => setFormData({ ...formData, billingCycle: cycle.value as any })}
                    style={{ flex: 1 }}
                    activeOpacity={0.7}
                  >
                    {isSelected ? (
                      <LinearGradient
                        colors={gradientColors}
                        style={styles.cycleButton}
                      >
                        <Ionicons name="checkmark-circle" size={20} color="#fff" />
                        <Text style={styles.cycleTextActive}>{cycle.fullLabel}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={[styles.cycleButton, styles.cycleButtonInactive]}>
                        <Text style={styles.cycleTextInactive}>{cycle.fullLabel}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <View style={styles.notesHeader}>
              <Text style={styles.label}>Notatki</Text>
              <Text style={styles.notesCounter}>{(formData.notes?.length ?? 0)}/500</Text>
            </View>
            <GlassCard style={styles.inputCard}>
              <TextInput
                style={[styles.input, styles.notesInput]}
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                placeholder="Np. numer klienta, hasło do konta, data promocji…"
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                textAlignVertical="top"
                maxLength={500}
              />
            </GlassCard>
          </View>
  
          {/* Submit Button */}
          <View style={styles.section}>
            <AnimatedButton
              title="Dodaj subskrypcję"
              onPress={handleSubmit}
              loading={loading}
              size="large"
            />
          </View>
  
          <View style={{ height: 40 }} />
        </Animated.ScrollView>
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
    paddingHorizontal: theme.spacing.l,
    paddingTop: 60,
    paddingBottom: theme.spacing.m,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.l,
  },
  previewSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  bigIcon: {
    width: 120,
    height: 120,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  
  section: {
    marginBottom: theme.spacing.xl,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 12,
  },
  inputCard: {
    padding: 0,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.14)',
  },
  input: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 16,
    paddingVertical: 16,
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
    minHeight: 110,
    paddingTop: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryButton: {
    width: 100,
    height: 100,
    borderRadius: theme.radius.l,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  categoryButtonInactive: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  categoryTextActive: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  categoryTextInactive: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.70)',
  },
  cycleGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  cycleButton: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: theme.radius.m,
    alignItems: 'center',
    gap: 6,
  },
  cycleButtonInactive: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  cycleTextActive: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  cycleTextInactive: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.70)',
  },
});
