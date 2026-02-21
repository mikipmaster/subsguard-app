import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Animated, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import { formatCurrency } from '../../utils/currency';
import { getDaysUntilText, getDaysUntil } from '../../utils/date';
import GlassCard from '../../components/ui/GlassCard';
import FAB from '../../components/ui/FAB';
import { theme } from '../../constants/theme';


const { width } = Dimensions.get('window');

// Animated Counter Hook
function useAnimatedCounter(end: number, duration: number = 1000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const startValue = 0;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function (easeOutCubic)
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      setCount(Math.floor(startValue + (end - startValue) * easeProgress));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [end, duration]);

  return count;
}


export default function DashboardScreen() {
  const { user } = useAuthStore();
  const { subscriptions, fetchSubscriptions, isLoading, getTotalMonthly } = useSubscriptionStore();
  const [scrollY] = useState(new Animated.Value(0));

  const handleScroll = (event: any) => {
    scrollY.setValue(event?.nativeEvent?.contentOffset?.y ?? 0);
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const PlaceholderMainStatCard = () => (
    <GlassCard style={styles.mainStatCard}>
      <View style={[styles.gradientCard, { backgroundColor: '#EAEAEA' }]}>
        <View style={[styles.statHeader, { opacity: 0.6 }]}>
          <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#D5D5D5' }} />
          <View style={{ width: 60, height: 20, borderRadius: 10, backgroundColor: '#D5D5D5' }} />
        </View>
        <View style={{ width: 140, height: 16, borderRadius: 8, backgroundColor: '#D5D5D5', marginBottom: 10 }} />
        <View style={{ width: 220, height: 40, borderRadius: 12, backgroundColor: '#D5D5D5', marginBottom: 14 }} />
        <View style={{ width: 170, height: 14, borderRadius: 7, backgroundColor: '#D5D5D5' }} />
      </View>
    </GlassCard>
  );

  const PlaceholderMiniStatCard = () => (
    <GlassCard style={styles.miniStatCard}>
      <View style={[styles.iconCircle, { backgroundColor: '#E0E0E0' }]} />
      <View style={{ width: 40, height: 24, borderRadius: 8, backgroundColor: '#E0E0E0', marginBottom: 6 }} />
      <View style={{ width: 70, height: 12, borderRadius: 6, backgroundColor: '#E0E0E0' }} />
    </GlassCard>
  );

  const PlaceholderPaymentCard = () => (
    <GlassCard style={styles.paymentCard}>
      <View style={styles.paymentLeft}>
        <View style={[styles.subscriptionIcon, { backgroundColor: '#E0E0E0' }]} />
        <View style={{ flex: 1, gap: 8 }}>
          <View style={{ width: '60%', height: 14, borderRadius: 7, backgroundColor: '#E0E0E0' }} />
          <View style={{ width: '40%', height: 12, borderRadius: 6, backgroundColor: '#E0E0E0' }} />
        </View>
      </View>
      <View style={styles.paymentRight}>
        <View style={{ width: 80, height: 14, borderRadius: 7, backgroundColor: '#E0E0E0', marginBottom: 6 }} />
        <View style={{ width: 30, height: 12, borderRadius: 6, backgroundColor: '#E0E0E0' }} />
      </View>
    </GlassCard>
  );

  const showSkeleton = isLoading && subscriptions.length === 0;

  const activeSubscriptions = subscriptions.filter((s) => s.status === 'ACTIVE');
  const upcomingPayments = activeSubscriptions
    .sort((a, b) => new Date(a.nextBillingDate).getTime() - new Date(b.nextBillingDate).getTime())
    .slice(0, 5);

  // MOCK DATA FOR TESTING ANIMATIONS
  //const totalMonthly = getTotalMonthly();
  //const totalYearly = totalMonthly * 12;
  
  const totalMonthly = getTotalMonthly();
  const totalYearly = totalMonthly * 12;


  // Animated counters
  const animatedMonthly = useAnimatedCounter(totalMonthly, 1500);
  const animatedYearly = useAnimatedCounter(totalYearly, 1800);

  const animatedActiveCount = useAnimatedCounter(activeSubscriptions.length, 1000);
  const animatedUpcomingCount = useAnimatedCounter(upcomingPayments.length, 1200);



// Stats cards animation
  const statsOpacity = useRef(new Animated.Value(0)).current;
  const statsScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(statsOpacity, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.spring(statsScale, {
        toValue: 1,
        delay: 200,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
    ]).start();
  }, [subscriptions]);

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });


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

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2', '#F5F5F7']}
        locations={[0, 0.3, 0.7]}
        style={styles.gradientBackground}
      />

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
        <Animated.View style={[styles.header, { opacity: headerOpacity }]}> 
          <View>
            <Text style={styles.greeting}>
              Cześć, {user?.name?.split(' ')[0]}! 👋
            </Text>
            <Text style={styles.subtitle}>
              {showSkeleton
                ? 'Ładowanie...'
                : new Date().toLocaleDateString('pl-PL', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })}
            </Text>
          </View>
          <GlassCard
            style={styles.avatarButton}
            onPress={showSkeleton ? undefined : () => router.push('/(tabs)/settings')}
            hoverable={!showSkeleton}
          >
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase()}
            </Text>
          </GlassCard>
        </Animated.View>

        <View style={styles.statsGrid}>
          {showSkeleton ? (
            <>
              <PlaceholderMainStatCard />
              <View style={styles.miniStatsRow}>
                <PlaceholderMiniStatCard />
                <PlaceholderMiniStatCard />
              </View>
            </>
          ) : (
            <>
              <GlassCard style={styles.mainStatCard}>
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientCard}
                >
                  <View style={styles.statHeader}>
                    <Ionicons name="wallet" size={28} color="#fff" />
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{user?.tier}</Text>
                    </View>
                  </View>
                  <Text style={styles.statLabel}>Wydatki miesięczne</Text>
                  <Text style={styles.statValueLarge}>{formatCurrency(animatedMonthly)}</Text>
                  <View style={styles.statFooter}>
                    <Ionicons name="trending-up" size={16} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.statFooterText}>
                      {formatCurrency(animatedYearly)} rocznie
                    </Text>
                  </View>
                </LinearGradient>
              </GlassCard>

              <View style={styles.miniStatsRow}>
                <GlassCard style={styles.miniStatCard}>
                  <View style={[styles.iconCircle, { backgroundColor: '#34C759' }]}>
                    <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  </View>
                  <Text style={styles.miniStatValue}>{animatedActiveCount}</Text>
                  <Text style={styles.miniStatLabel}>Aktywne</Text>
                </GlassCard>

                <GlassCard style={styles.miniStatCard}>
                  <View style={[styles.iconCircle, { backgroundColor: '#FF9500' }]}>
                    <Ionicons name="time" size={24} color="#fff" />
                  </View>
                  <Text style={styles.miniStatValue}>{animatedUpcomingCount}</Text>
                  <Text style={styles.miniStatLabel}>Zbliżające się</Text>
                </GlassCard>
              </View>
            </>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nadchodzące płatności</Text>
            <GlassCard 
              onPress={() => router.push('/(tabs)/subscriptions')}
              hoverable
            >
              <Text style={styles.seeAllButton}>Zobacz wszystkie</Text>
            </GlassCard>
          </View>

          {showSkeleton ? (
            <>
              <PlaceholderPaymentCard />
              <View style={{ height: 12 }} />
              <PlaceholderPaymentCard />
              <View style={{ height: 12 }} />
              <PlaceholderPaymentCard />
            </>
          ) : upcomingPayments.length === 0 ? null : (
            upcomingPayments.map((sub, index) => {
              const daysUntil = getDaysUntil(sub.nextBillingDate);
              const isUrgent = daysUntil <= 3;
              const iconName = categoryIcons[sub.category] || 'apps';
              const bgColor = categoryColors[sub.category] || '#95A5A6';

              return (
                <GlassCard
                  key={sub._id}
                  style={[styles.paymentCard, index > 0 && { marginTop: 12 }]}
                  onPress={() => router.push(`/modals/edit-subscription?id=${sub._id}`)}
                  hoverable
                >
                  <View style={styles.paymentLeft}>
                    <View style={[styles.subscriptionIcon, { backgroundColor: bgColor }]}>
                      <Ionicons name={iconName} size={24} color="#fff" />
                    </View>
                    <View style={styles.paymentInfo}>
                      <Text style={styles.paymentName}>{sub.name}</Text>
                      <View style={styles.paymentDateRow}>
                        {isUrgent && (
                          <Ionicons name="alert-circle" size={14} color={theme.colors.warning} />
                        )}
                        <Text
                          style={[
                            styles.paymentDate,
                            isUrgent && { color: theme.colors.warning, fontWeight: '600' }
                          ]}
                        >
                          {getDaysUntilText(sub.nextBillingDate)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.paymentRight}>
                    <Text style={styles.paymentAmount}>
                      {formatCurrency(sub.price, sub.currency)}
                    </Text>
                    <Text style={styles.paymentCycle}>
                      /{sub.billingCycle === 'MONTHLY' ? 'msc' : 'rok'}
                    </Text>
                  </View>
                </GlassCard>
              );
            })
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Podsumowanie</Text>
          <GlassCard style={styles.quickStatsCard}>
            <View style={styles.quickStatRow}>
              <Text style={styles.quickStatLabel}>Średnia na subskrypcję</Text>
              <Text style={styles.quickStatValue}>
                {activeSubscriptions.length > 0 
                  ? formatCurrency(totalMonthly / activeSubscriptions.length)
                  : formatCurrency(0)
                }
              </Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStatRow}>
              <Text style={styles.quickStatLabel}>Najtańsza subskrypcja</Text>
              <Text style={styles.quickStatValue}>
                {activeSubscriptions.length > 0
                  ? formatCurrency(Math.min(...activeSubscriptions.map(s => s.price)))
                  : '-'
                }
              </Text>
            </View>
            <View style={styles.quickStatDivider} />
            <View style={styles.quickStatRow}>
              <Text style={styles.quickStatLabel}>Najdroższa subskrypcja</Text>
              <Text style={styles.quickStatValue}>
                {activeSubscriptions.length > 0
                  ? formatCurrency(Math.max(...activeSubscriptions.map(s => s.price)))
                  : '-'
                }
              </Text>
            </View>
          </GlassCard>
        </View>

        <View style={{ height: 100 }} />
      </Animated.ScrollView>

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
    height: 280,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: theme.spacing.l,
    paddingTop: 60,
    paddingBottom: theme.spacing.l,
  },
  
  avatarButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    padding: 0,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  statsGrid: {
    paddingHorizontal: theme.spacing.l,
    gap: 12,
  },
  mainStatCard: {
    padding: 0,
    overflow: 'hidden',
  },
  gradientCard: {
    padding: theme.spacing.l,
    borderRadius: theme.radius.xl,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  
  statFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statFooterText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  miniStatsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  miniStatCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.l,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
 
  section: {
    paddingHorizontal: theme.spacing.l,
    marginTop: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  seeAllButton: {
    fontSize: 15,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  paymentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  subscriptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentInfo: {
    flex: 1,
  },
  
  paymentDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paymentDate: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  paymentRight: {
    alignItems: 'flex-end',
  },
  
  paymentCycle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  quickStatsCard: {
    paddingVertical: 8,
    marginTop: 12,
  },
  quickStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  quickStatLabel: {
    fontSize: 15,
    color: theme.colors.textSecondary,
  },
  quickStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  quickStatDivider: {
    height: 1,
    backgroundColor: theme.colors.borderLight,
  },

  greeting: {
    fontSize: 34, // było 32
    fontWeight: '800', // było '700'
    color: '#fff',
    marginBottom: 4,
    letterSpacing: 0.37,
  },
  subtitle: {
    fontSize: 17, // było 15
    fontWeight: '500', // dodaj to
    color: 'rgba(255, 255, 255, 0.9)', // było 0.8
    textTransform: 'capitalize',
    letterSpacing: -0.41,
  },
  statLabel: {
    fontSize: 16, // było 15
    fontWeight: '500', // było brak
    color: 'rgba(255, 255, 255, 0.9)', // było 0.8
    marginBottom: 8,
    letterSpacing: -0.32,
  },
  statValueLarge: {
    fontSize: 44, // było 40
    fontWeight: '800', // było '700'
    color: '#fff',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  miniStatValue: {
    fontSize: 32, // było 28
    fontWeight: '800', // było '700'
    color: theme.colors.text,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  miniStatLabel: {
    fontSize: 14, // było 13
    fontWeight: '500', // dodaj
    color: theme.colors.textSecondary,
    letterSpacing: -0.08,
  },
  sectionTitle: {
    fontSize: 26, // było 24
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: 0.36,
  },
  paymentName: {
    fontSize: 17, // było 16
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
    letterSpacing: -0.41,
  },
  paymentAmount: {
    fontSize: 19, // było 18
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: -0.45,
  },
  
});
