import { useEffect, useState,useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Animated, TextInput } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import { formatCurrency } from '../../utils/currency';
import { getDaysUntilText } from '../../utils/date';
import GlassCard from '../../components/ui/GlassCard';
import FAB from '../../components/ui/FAB';
import { theme } from '../../constants/theme';


// Animated Card Component
interface AnimatedCardProps {
  children: React.ReactNode;
  index: number;
  onPress: () => void;
}

function AnimatedCard({ children, index, onPress }: AnimatedCardProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 50, // 50ms delay między każdą kartą
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <GlassCard 
        style={styles.subscriptionCard}
        onPress={onPress}
        hoverable
      >
        {children}
      </GlassCard>
    </Animated.View>
  );
}


export default function SubscriptionsScreen() {
  const { subscriptions, fetchSubscriptions, isLoading } = useSubscriptionStore();
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'CANCELLED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [scrollY] = useState(new Animated.Value(0));

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  // Placeholder Component for Loading
  const PlaceholderCard = () => (
    <View style={[styles.subscriptionCard, { backgroundColor: '#F0F0F0' }]}>
      <View style={styles.cardContent}>
        <View style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: '#E0E0E0' }} />
        <View style={{ flex: 1, gap: 8 }}>
          <View style={{ width: '70%', height: 16, borderRadius: 8, backgroundColor: '#E0E0E0' }} />
          <View style={{ width: '50%', height: 12, borderRadius: 6, backgroundColor: '#E0E0E0' }} />
        </View>
        <View style={{ width: 60, height: 20, borderRadius: 10, backgroundColor: '#E0E0E0' }} />
      </View>
    </View>
  );

  if (isLoading && subscriptions.length === 0) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#667eea', '#764ba2', '#F5F5F7']}
          locations={[0, 0.2, 0.5]}
          style={styles.gradientBackground}
        />
        
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Twoje subskrypcje</Text>
            <Text style={styles.subtitle}>Ładowanie...</Text>
          </View>
        </View>

        <View style={styles.searchSection}>
          <GlassCard style={styles.searchCard}>
            <View style={{ height: 44, backgroundColor: '#F0F0F0', borderRadius: 12 }} />
          </GlassCard>
        </View>

        <View style={{ paddingHorizontal: theme.spacing.l }}>
          <PlaceholderCard />
          <PlaceholderCard />
          <PlaceholderCard />
          <PlaceholderCard />
        </View>
      </View>
    );
  }



  // Filter & Search
  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesFilter = filter === 'ALL' || sub.status === filter;
    const matchesSearch = sub.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  

// I użyj mockSubs zamiast filteredSubscriptions w groupBy
//const groupedByCategory = mockSubs.reduce((acc, sub) => {
  // ... reszta kodu
  /*
  // PRAWIDŁOWY KOD Group by category
  const groupedByCategory = mockSubs.reduce((acc, sub) => {
    const category = sub.category || 'OTHER';
    if (!acc[category]) acc[category] = [];
    acc[category].push(sub);
    return acc;
  }, {} as Record<string, typeof subscriptions>);
  */

  

const groupedByCategory = (filteredSubscriptions as any).reduce((acc: any, sub: any) => {
  const category = sub.category || 'OTHER';
  if (!acc[category]) acc[category] = [];
  acc[category].push(sub);
  return acc;
}, {});



  const categoryIcons: Record<string, any> = {
    STREAMING: 'play-circle',
    FITNESS: 'barbell',
    SAAS: 'cloud',
    GAMING: 'game-controller',
    MUSIC: 'musical-notes',
    CLOUD_STORAGE: 'cloud-upload',
    NEWS: 'newspaper',
    EDUCATION: 'school',
    OTHER: 'apps',
  };

  const categoryColors: Record<string, string> = {
    STREAMING: '#FF6B6B',
    FITNESS: '#4ECDC4',
    SAAS: '#45B7D1',
    GAMING: '#A66BFF',
    MUSIC: '#FFA07A',
    CLOUD_STORAGE: '#98D8C8',
    NEWS: '#F7DC6F',
    EDUCATION: '#BB8FCE',
    OTHER: '#95A5A6',
  };

  const categoryNames: Record<string, string> = {
    STREAMING: 'Streaming',
    FITNESS: 'Fitness',
    SAAS: 'SaaS',
    GAMING: 'Gaming',
    MUSIC: 'Muzyka',
    CLOUD_STORAGE: 'Cloud Storage',
    NEWS: 'News',
    EDUCATION: 'Edukacja',
    OTHER: 'Inne',
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      {/* Gradient Background */}
      <LinearGradient
        colors={['#667eea', '#764ba2', '#F5F5F7']}
        locations={[0, 0.2, 0.5]}
        style={styles.gradientBackground}
      />

      {/* Animated Header */}
      <Animated.View style={[styles.stickyHeader, { opacity: headerOpacity }]}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.9)']}
          style={styles.stickyHeaderGradient}
        >
          <Text style={styles.stickyHeaderTitle}>Subskrypcje</Text>
        </LinearGradient>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchSubscriptions} tintColor="#fff" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Twoje subskrypcje</Text>
          <Text style={styles.subtitle}>
          {filteredSubscriptions.length} {filteredSubscriptions.length === 1 ? 'subskrypcja' : 'subskrypcji'}
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <GlassCard style={styles.searchCard}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Szukaj subskrypcji..."
                placeholderTextColor={theme.colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </GlassCard>
        </View>

        {/* Filters */}
        <View style={styles.filtersSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.filterChip, filter === 'ALL' && styles.filterChipActive]}
              onPress={() => setFilter('ALL')}
            >
              <Ionicons 
                name="apps" 
                size={16} 
                color={filter === 'ALL' ? '#fff' : theme.colors.textSecondary} 
              />
              <Text style={[styles.filterText, filter === 'ALL' && styles.filterTextActive]}>
                Wszystkie
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, filter === 'ACTIVE' && styles.filterChipActive]}
              onPress={() => setFilter('ACTIVE')}
            >
              <Ionicons 
                name="checkmark-circle" 
                size={16} 
                color={filter === 'ACTIVE' ? '#fff' : theme.colors.textSecondary} 
              />
              <Text style={[styles.filterText, filter === 'ACTIVE' && styles.filterTextActive]}>
                Aktywne
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, filter === 'CANCELLED' && styles.filterChipActive]}
              onPress={() => setFilter('CANCELLED')}
            >
              <Ionicons 
                name="close-circle" 
                size={16} 
                color={filter === 'CANCELLED' ? '#fff' : theme.colors.textSecondary} 
              />
              <Text style={[styles.filterText, filter === 'CANCELLED' && styles.filterTextActive]}>
                Anulowane
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Subscriptions List */}
        {filteredSubscriptions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <GlassCard style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="receipt-outline" size={60} color={theme.colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'Nie znaleziono' : 'Brak subskrypcji'}
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? 'Spróbuj wyszukać coś innego'
                  : 'Dodaj swoją pierwszą subskrypcję'}
              </Text>
              {!searchQuery && (
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => router.push('/modals/add-subscription')}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.emptyButtonText}>Dodaj subskrypcję</Text>
                </TouchableOpacity>
              )}
            </GlassCard>
          </View>
        ) : (
          Object.entries(groupedByCategory).map(([category, subs]) => (
            <View key={category} style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <View style={[styles.categoryIconSmall, { backgroundColor: categoryColors[category] }]}>
                  <Ionicons name={categoryIcons[category]} size={16} color="#fff" />
                </View>
                <Text style={styles.categoryTitle}>{categoryNames[category]}</Text>
                <Text style={styles.categoryCount}>{(subs as any[]).length}</Text>
              </View>

              {(subs as any[]).map((sub: any, index: number) => {

                const iconName = categoryIcons[sub.category] || 'apps';
                const bgColor = categoryColors[sub.category] || '#95A5A6';

                return (
                  <AnimatedCard
                    key={sub._id}
                    index={index}
                    onPress={() => router.push(`/modals/edit-subscription?id=${sub._id}`)}
                  >
                    <View style={styles.cardContent}>
                      <View style={[styles.subscriptionIcon, { backgroundColor: bgColor }]}>
                        <Ionicons name={iconName} size={24} color="#fff" />
                      </View>
                      <View style={styles.subscriptionInfo}>
                        <Text style={styles.subscriptionName}>{sub.name}</Text>
                        <Text style={styles.metaText}>
                          {categoryNames[sub.category] || 'Inne'}
                        </Text>
                      </View>
                      <View style={styles.priceContainer}>
                        <Text style={styles.price}>
                          {formatCurrency(sub.price, sub.currency)}
                        </Text>
                        <Text style={styles.metaText}>
                          /{sub.billingCycle === 'MONTHLY' ? 'msc' : 'rok'}
                        </Text>
                      </View>
                    </View>
                  </AnimatedCard>
                );
              })}

            </View>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <FAB 
        onPress={() => router.push('/modals/add-subscription')}
        icon="add"
      />
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
    height: 250,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  stickyHeaderGradient: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: theme.spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  stickyHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    paddingHorizontal: theme.spacing.l,
    paddingTop: 60,
    paddingBottom: theme.spacing.l,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 17,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  searchSection: {
    paddingHorizontal: theme.spacing.l,
    marginBottom: theme.spacing.m,
  },
  searchCard: {
    padding: 0,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
  },
  filtersSection: {
    paddingHorizontal: theme.spacing.l,
    marginBottom: theme.spacing.l,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    marginRight: 8,
    ...theme.shadows.small,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
  },
  filterText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  filterTextActive: {
    color: '#fff',
  },
  emptyContainer: {
    paddingHorizontal: theme.spacing.l,
    marginTop: 40,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(10, 132, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  categorySection: {
    paddingHorizontal: theme.spacing.l,
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  categoryIconSmall: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    flex: 1,
  },
  categoryCount: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  subscriptionCard: {
    marginBottom: 12,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subscriptionIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionName: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
});
