import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Animated, TextInput, PanResponder, Alert, Image } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import { formatCurrency } from '../../utils/currency';
import { getDaysUntil, getDaysUntilText } from '../../utils/date';
import { showToast } from '../../utils/toast';
import GlassCard from '../../components/ui/GlassCard';
import FAB from '../../components/ui/FAB';
import { theme } from '../../constants/theme';


// Animated Card Component
interface AnimatedCardProps {
  children: React.ReactNode;
  index: number;
  onPress: () => void;
  onDelete: () => void;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function subtractBillingCycle(date: Date, billingCycle: string): Date {
  const d = new Date(date);
  switch (billingCycle) {
    case 'DAILY':
      d.setDate(d.getDate() - 1);
      return d;
    case 'WEEKLY':
      d.setDate(d.getDate() - 7);
      return d;
    case 'MONTHLY':
      d.setMonth(d.getMonth() - 1);
      return d;
    case 'QUARTERLY':
      d.setMonth(d.getMonth() - 3);
      return d;
    case 'YEARLY':
      d.setFullYear(d.getFullYear() - 1);
      return d;
    default:
      d.setMonth(d.getMonth() - 1);
      return d;
  }
}

function getRemainingRatioToNextPayment(nextBillingDate: string | Date, billingCycle: string) {
  const next = new Date(nextBillingDate);
  const periodStart = subtractBillingCycle(next, billingCycle);
  const now = new Date();

  const totalDays = Math.max(1, Math.round((next.getTime() - periodStart.getTime()) / MS_PER_DAY));
  const remainingDays = Math.max(0, Math.min(totalDays, Math.ceil((next.getTime() - now.getTime()) / MS_PER_DAY)));
  const ratio = clamp01(remainingDays / totalDays);

  return {
    ratio,
    remainingDays,
    totalDays,
  };
}

function getServiceLogoUrl(name: string) {
  const n = (name || '').toLowerCase();

  if (n.includes('spotify')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_without_text.svg/512px-Spotify_logo_without_text.svg.png';
  if (n.includes('netflix')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Netflix_2015_logo.svg/512px-Netflix_2015_logo.svg.png';
  if (n.includes('chatgpt') || n.includes('openai')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/OpenAI_Logo.svg/512px-OpenAI_Logo.svg.png';
  if (n.includes('adobe')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Adobe_Corporate_logo.svg/512px-Adobe_Corporate_logo.svg.png';
  if (n.includes('icloud') || n.includes('apple')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/512px-Apple_logo_black.svg.png';
  if (n.includes('figma')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Figma-logo.svg/512px-Figma-logo.svg.png';
  if (n.includes('dropbox')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Dropbox_Icon.svg/512px-Dropbox_Icon.svg.png';
  return undefined;
}

function AnimatedCard({ children, index, onPress, onDelete }: AnimatedCardProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opened = useRef(false);
  const maxSwipe = 92;

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

  const closeSwipe = () => {
    opened.current = false;
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  const openSwipe = () => {
    opened.current = true;
    Animated.spring(translateX, {
      toValue: -maxSwipe,
      useNativeDriver: true,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => {
        const isHorizontal = Math.abs(gesture.dx) > 8 && Math.abs(gesture.dy) < 10;
        return isHorizontal;
      },
      onPanResponderMove: (_, gesture) => {
        const dx = Math.min(0, Math.max(gesture.dx, -maxSwipe));
        translateX.setValue(dx);
      },
      onPanResponderRelease: (_, gesture) => {
        const shouldOpen = gesture.dx < -maxSwipe / 2;
        if (shouldOpen) openSwipe();
        else closeSwipe();
      },
      onPanResponderTerminate: () => {
        closeSwipe();
      },
    })
  ).current;

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={styles.swipeContainer}>
        <View style={styles.deleteUnderlay}>
          <TouchableOpacity
            style={styles.deleteButton}
            activeOpacity={0.8}
            onPress={() => {
              Alert.alert('Usuń subskrypcję', 'Na pewno chcesz usunąć tę subskrypcję?', [
                { text: 'Anuluj', style: 'cancel', onPress: closeSwipe },
                {
                  text: 'Usuń',
                  style: 'destructive',
                  onPress: () => {
                    closeSwipe();
                    onDelete();
                  }
                }
              ]);
            }}
          >
            <Ionicons name="trash" size={22} color="#fff" />
            <Text style={styles.deleteText}>Usuń</Text>
          </TouchableOpacity>
        </View>

        <Animated.View
          style={{ transform: [{ translateX }], width: '100%' }}
          {...panResponder.panHandlers}
        >
          <GlassCard style={[styles.subscriptionCard, styles.subscriptionCardSolid]} onPress={() => {
            if (opened.current) {
              closeSwipe();
              return;
            }
            onPress();
          }} hoverable>
            {children}
          </GlassCard>
        </Animated.View>
      </View>
    </Animated.View>
  );
}


export default function SubscriptionsScreen() {
  const { subscriptions, fetchSubscriptions, isLoading, deleteSubscription } = useSubscriptionStore();
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'CANCELLED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [scrollY] = useState(new Animated.Value(0));

  const handleScroll = (event: any) => {
    scrollY.setValue(event?.nativeEvent?.contentOffset?.y ?? 0);
  };

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
          colors={['#0F0C29', '#302B63', '#24243E']}
          locations={[0, 0.55, 1]}
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
        colors={['#0F0C29', '#302B63', '#24243E']}
        locations={[0, 0.55, 1]}
        style={styles.gradientBackground}
      />

      {/* Animated Header */}
      <Animated.View style={[styles.stickyHeader, { opacity: headerOpacity }]}>
        <LinearGradient
          colors={['rgba(15, 12, 41, 0.92)', 'rgba(15, 12, 41, 0.72)']}
          style={styles.stickyHeaderGradient}
        >
          <Text style={styles.stickyHeaderTitle}>Subskrypcje</Text>
        </LinearGradient>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
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
              <Ionicons name="search" size={20} color="rgba(255,255,255,0.7)" />
              <TextInput
                style={styles.searchInput}
                placeholder="Szukaj subskrypcji..."
                placeholderTextColor="rgba(255,255,255,0.55)"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.7)" />
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
                color={filter === 'ALL' ? '#fff' : 'rgba(255,255,255,0.65)'} 
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
                color={filter === 'ACTIVE' ? '#fff' : 'rgba(255,255,255,0.65)'} 
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
                color={filter === 'CANCELLED' ? '#fff' : 'rgba(255,255,255,0.65)'} 
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
                const logoUrl = getServiceLogoUrl(sub.name);

                const { ratio } = getRemainingRatioToNextPayment(sub.nextBillingDate, sub.billingCycle);
                const barColor = ratio > 0.5 ? '#22C55E' : ratio >= 0.25 ? '#F59E0B' : '#EF4444';

                return (
                  <AnimatedCard
                    key={sub._id}
                    index={index}
                    onPress={() => router.push(`/modals/edit-subscription?id=${sub._id}`)}
                    onDelete={async () => {
                      try {
                        await deleteSubscription(sub._id);
                        showToast.success('Subskrypcja usunięta');
                      } catch (e: any) {
                        showToast.error(e?.message || 'Nie udało się usunąć subskrypcji');
                      }
                    }}
                  >
                    <View style={styles.cardBody}>
                      <View style={styles.cardContent}>
                        <View style={[styles.subscriptionIcon, { backgroundColor: bgColor }]}>
                          {logoUrl ? (
                            <Image source={{ uri: logoUrl }} style={styles.subscriptionLogo} />
                          ) : (
                            <Ionicons name={iconName} size={24} color="#fff" />
                          )}
                        </View>
                        <View style={styles.subscriptionInfo}>
                          <Text style={styles.subscriptionName} numberOfLines={1}>{sub.name}</Text>
                          <Text style={styles.metaText}>
                            {getDaysUntilText(sub.nextBillingDate)}
                          </Text>
                        </View>
                        <View style={styles.priceContainer}>
                          <Text style={styles.price}>
                            {formatCurrency(sub.price, sub.currency)}
                          </Text>
                          <Text style={styles.metaText}>
                            /{sub.billingCycle === 'MONTHLY' ? 'msc' : sub.billingCycle.toLowerCase()}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${Math.round(ratio * 100)}%`, backgroundColor: barColor }]} />
                      </View>
                    </View>
                  </AnimatedCard>
                );
              })}

            </View>
          ))
        )}
      </Animated.ScrollView>

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
    bottom: 0,
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
    borderBottomColor: 'rgba(255,255,255,0.10)',
  },
  stickyHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.92)',
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
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.14)',
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
    color: 'rgba(255,255,255,0.92)',
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
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    marginRight: 8,
    ...theme.shadows.small,
  },
  filterChipActive: {
    backgroundColor: 'rgba(191, 168, 255, 0.28)',
    borderColor: 'rgba(191, 168, 255, 0.45)',
  },
  filterText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
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
    backgroundColor: 'rgba(191, 168, 255, 0.14)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.92)',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.65)',
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(191, 168, 255, 0.95)',
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
    color: 'rgba(255,255,255,0.92)',
    flex: 1,
  },
  categoryCount: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.55)',
  },
  subscriptionCard: {
    marginBottom: 0,
    width: '100%',
  },
  subscriptionCardSolid: {
    backgroundColor: 'rgba(20, 18, 45, 0.96)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  swipeContainer: {
    position: 'relative',
    marginBottom: 12,
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    backgroundColor: 'rgba(20, 18, 45, 0.96)',
  },
  deleteUnderlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 92,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 92,
    height: '100%',
    backgroundColor: '#FF3B30',
    borderRadius: theme.radius.l,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  deleteText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardBody: {
    gap: 12,
  },
  subscriptionIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  subscriptionLogo: {
    width: 26,
    height: 26,
    resizeMode: 'contain',
    borderRadius: 8,
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionName: {
    fontSize: 17,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.92)',
    marginBottom: 4,
  },
  metaText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.62)',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.92)',
  },
  progressTrack: {
    height: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
});
