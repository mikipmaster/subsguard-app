import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, RefreshControl, Animated, Dimensions, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import { useSettingsStore } from '../../store/settingsStore';
import { formatCurrency } from '../../utils/currency';
import { formatShortDate, getDaysUntil, getDaysUntilText } from '../../utils/date';
import GlassCard from '../../components/ui/GlassCard';
import FAB from '../../components/ui/FAB';
import { theme } from '../../constants/theme';


const { width } = Dimensions.get('window');

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
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

function labelForUpcomingDate(nextBillingDate: string | Date) {
  const d = new Date(nextBillingDate);
  const days = getDaysUntil(d);

  if (days <= 0) return 'Today';
  if (days === 1) return 'Tomorrow';

  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
  if (days < 7) return `Next ${weekday}`;
  return formatShortDate(d);
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
  const { defaultCurrency } = useSettingsStore();
  const [scrollY] = useState(new Animated.Value(0));

  const handleScroll = (event: any) => {
    scrollY.setValue(event?.nativeEvent?.contentOffset?.y ?? 0);
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const showSkeleton = isLoading && subscriptions.length === 0;

  const activeSubscriptions = subscriptions.filter((s) => s.status === 'ACTIVE');
  const upcomingPayments = activeSubscriptions
    .sort((a, b) => new Date(a.nextBillingDate).getTime() - new Date(b.nextBillingDate).getTime())
    .slice(0, 3);

  const totalMonthly = getTotalMonthly();
  const animatedMonthly = useAnimatedCounter(totalMonthly, 1500);
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const yourSubscriptions = useMemo(() => activeSubscriptions.slice(0, 3), [activeSubscriptions]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'Dzień dobry,';
    if (h >= 12 && h < 18) return 'Miłego popołudnia,';
    return 'Dobry wieczór,';
  }, []);

  const iconSpecFor = (name: string) => {
    const n = (name || '').toLowerCase();
    const logoUrl = getServiceLogoUrl(name);
    if (n.includes('netflix')) return { label: 'N', color: '#E50914', logoUrl };
    if (n.includes('spotify')) return { label: 'S', color: '#1DB954', logoUrl };
    if (n.includes('adobe')) return { label: 'A', color: '#FF6A00', logoUrl };
    if (n.includes('icloud') || n.includes('apple')) return { label: 'i', color: '#60A5FA', logoUrl };
    if (n.includes('chatgpt') || n.includes('openai')) return { label: 'G', color: '#10B981', logoUrl };
    if (n.includes('dropbox')) return { label: 'D', color: '#0061FF', logoUrl };
    if (n.includes('figma')) return { label: 'F', color: '#A259FF', logoUrl };
    return { label: (name || '?').trim().charAt(0).toUpperCase() || '?', color: '#6C63FF', logoUrl };
  };

  const categoryPillFor = (category: string) => {
    switch (category) {
      case 'STREAMING':
        return { text: 'Video', color: 'rgba(255, 99, 132, 0.18)', border: 'rgba(255, 99, 132, 0.35)' };
      case 'MUSIC':
        return { text: 'Music', color: 'rgba(34, 197, 94, 0.18)', border: 'rgba(34, 197, 94, 0.35)' };
      case 'SAAS':
        return { text: 'SaaS', color: 'rgba(56, 189, 248, 0.18)', border: 'rgba(56, 189, 248, 0.35)' };
      default:
        return { text: 'Other', color: 'rgba(255, 255, 255, 0.10)', border: 'rgba(255, 255, 255, 0.18)' };
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F0C29', '#302B63', '#24243E']}
        locations={[0, 0.55, 1]}
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
          <View style={styles.headerLeft}>
            <GlassCard style={styles.avatarButton} onPress={() => router.push('/(tabs)/settings')} hoverable>
              <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
            </GlassCard>
            <View>
              <Text style={styles.goodEveningLabel}>{greeting}</Text>
              <Text style={styles.goodEveningName}>{user?.name?.split(' ')[0] || 'User'}</Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/settings')}
            style={styles.notificationButton}
          >
            <Ionicons name="notifications-outline" size={20} color="rgba(255,255,255,0.92)" />
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.heroWrap}>
          <GlassCard style={styles.heroCard}>
            <LinearGradient
              colors={['#6C63FF', '#23D5AB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
            >
              <View style={styles.heroTopRow}>
                <Text style={styles.heroLabel}>Total Monthly Spending</Text>
                <View style={styles.trendPill}>
                  <Ionicons name="arrow-up" size={12} color="#22C55E" />
                  <Text style={styles.trendText}>+12%</Text>
                </View>
              </View>
              <View style={styles.heroValueRow}>
                <Text style={styles.heroValue}>{animatedMonthly}</Text>
                <Text style={styles.heroCurrency}>{defaultCurrency}</Text>
              </View>
              <View style={styles.heroBottomRow}>
                <View style={styles.fakeChartRow}>
                  <View style={[styles.fakeDot, { opacity: 0.9 }]} />
                  <View style={[styles.fakeDot, { opacity: 0.7 }]} />
                  <View style={[styles.fakeDot, { opacity: 0.5 }]} />
                </View>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => router.push('/(tabs)/analytics')}
                  style={styles.heroCta}
                >
                  <Text style={styles.heroCtaText}>See Analytics</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </GlassCard>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Subscriptions</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/subscriptions')}
            >
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          {showSkeleton ? (
            <View style={{ height: 140 }} />
          ) : yourSubscriptions.length === 0 ? (
            <GlassCard style={styles.emptyDashCard}>
              <View style={styles.emptyDashIcon}>
                <Ionicons name="receipt-outline" size={26} color="rgba(191, 168, 255, 0.95)" />
              </View>
              <View style={styles.emptyDashBody}>
                <Text style={styles.emptyDashTitle}>Brak subskrypcji</Text>
                <Text style={styles.emptyDashText}>Dodaj pierwszą subskrypcję, aby zobaczyć statystyki i nadchodzące płatności.</Text>
                <TouchableOpacity style={styles.emptyDashCta} activeOpacity={0.9} onPress={() => router.push('/modals/add-subscription')}>
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={styles.emptyDashCtaText}>Dodaj subskrypcję</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          ) : (
            <View style={styles.subscriptionList}>
              {yourSubscriptions.map((sub) => {
                const { label, color, logoUrl } = iconSpecFor(sub.name);
                const pill = categoryPillFor(sub.category);
                const { ratio } = getRemainingRatioToNextPayment(sub.nextBillingDate, sub.billingCycle);

                const barColor =
                  ratio > 0.5 ? '#22C55E' : ratio >= 0.25 ? '#F59E0B' : '#EF4444';

                return (
                  <GlassCard
                    key={sub._id}
                    style={styles.subscriptionCard}
                    onPress={() => router.push(`/modals/edit-subscription?id=${sub._id}`)}
                    hoverable
                  >
                    <View style={styles.subscriptionRow}>
                      <View style={[styles.serviceIcon, { backgroundColor: color }]}>
                        {logoUrl ? (
                          <Image source={{ uri: logoUrl }} style={styles.serviceLogo} />
                        ) : (
                          <Text style={styles.serviceIconText}>{label}</Text>
                        )}
                      </View>

                      <View style={styles.subscriptionInfo}>
                        <Text style={styles.subscriptionName} numberOfLines={1}>
                          {sub.name}
                        </Text>
                        <Text style={styles.subscriptionMeta}>
                          Renews on {formatShortDate(sub.nextBillingDate)}
                        </Text>
                      </View>

                      <View style={styles.subscriptionRight}>
                        <Text style={styles.subscriptionPrice}>{formatCurrency(sub.price, sub.currency)}</Text>
                        <View style={[styles.categoryPill, { backgroundColor: pill.color, borderColor: pill.border }]}>
                          <Text style={styles.categoryPillText}>{pill.text}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${Math.round(ratio * 100)}%`, backgroundColor: barColor },
                        ]}
                      />
                    </View>
                  </GlassCard>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming payments</Text>
          <View style={styles.timelineWrap}>
            {showSkeleton ? (
              <View style={{ height: 140 }} />
            ) : upcomingPayments.length === 0 ? (
              <GlassCard style={styles.emptyTimelineCard}>
                <Text style={styles.emptyTimelineTitle}>Brak nadchodzących płatności</Text>
                <Text style={styles.emptyTimelineText}>Gdy dodasz subskrypcje, pokażemy tu najbliższe odnowienia.</Text>
              </GlassCard>
            ) : (
              <View style={styles.timelineList}>
                <View style={styles.timelineRail} />
                {upcomingPayments.map((sub, idx) => {
                  const when = labelForUpcomingDate(sub.nextBillingDate);
                  const { label, color, logoUrl } = iconSpecFor(sub.name);

                  return (
                    <View key={sub._id} style={styles.timelineRow}>
                      <View style={styles.timelineLeft}>
                        <Text style={styles.timelineWhen}>{when}</Text>
                        <View style={styles.timelineDotOuter}>
                          <View style={styles.timelineDotInner} />
                        </View>
                      </View>

                      <GlassCard
                        style={styles.timelineCard}
                        onPress={() => router.push(`/modals/edit-subscription?id=${sub._id}`)}
                        hoverable
                      >
                        <View style={styles.timelineCardLeft}>
                          <View style={[styles.timelineServiceIcon, { backgroundColor: color }]}>
                            {logoUrl ? (
                              <Image source={{ uri: logoUrl }} style={styles.timelineServiceLogo} />
                            ) : (
                              <Text style={styles.timelineServiceIconText}>{label}</Text>
                            )}
                          </View>
                          <Text style={styles.timelineName} numberOfLines={1}>
                            {sub.name}
                          </Text>
                        </View>
                        <Text style={styles.timelineAmount}>{formatCurrency(sub.price, sub.currency)}</Text>
                      </GlassCard>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        <View style={{ height: 140 }} />
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
    bottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.l,
    paddingTop: 56,
    paddingBottom: 14,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  goodEveningLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  goodEveningName: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '800',
    marginTop: 1,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroWrap: {
    paddingHorizontal: theme.spacing.l,
    marginTop: 6,
  },
  heroCard: {
    padding: 0,
  },
  heroGradient: {
    padding: 18,
    borderRadius: 22,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.88)',
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  trendText: {
    color: '#EAFEF2',
    fontWeight: '800',
    fontSize: 12,
  },
  heroValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 10,
  },
  heroValue: {
    fontSize: 44,
    color: '#fff',
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  heroCurrency: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '800',
  },
  heroBottomRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fakeChartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fakeDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(15, 12, 41, 0.30)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  heroCta: {
    backgroundColor: 'rgba(15, 12, 41, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  heroCtaText: {
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '800',
    fontSize: 12,
  },

  section: {
    paddingHorizontal: theme.spacing.l,
    marginTop: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.92)',
  },

  seeAllText: {
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '800',
    fontSize: 12,
  },

  subscriptionList: {
    gap: 12,
  },
  emptyDashCard: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.14)',
  },
  emptyDashIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(191, 168, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(191, 168, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDashBody: {
    flex: 1,
  },
  emptyDashTitle: {
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '900',
    fontSize: 14,
  },
  emptyDashText: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '700',
    fontSize: 12,
    lineHeight: 18,
  },
  emptyDashCta: {
    marginTop: 12,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(191, 168, 255, 0.95)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  emptyDashCtaText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 12,
  },
  subscriptionCard: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.14)',
  },
  subscriptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  serviceIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceIconText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
  },
  serviceLogo: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
    borderRadius: 6,
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionName: {
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '900',
    fontSize: 14,
  },
  subscriptionMeta: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.62)',
    fontWeight: '700',
    fontSize: 11,
  },
  subscriptionRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  subscriptionPrice: {
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '900',
    fontSize: 13,
  },
  categoryPill: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  categoryPillText: {
    color: 'rgba(255,255,255,0.88)',
    fontWeight: '800',
    fontSize: 10,
  },
  progressTrack: {
    marginTop: 12,
    height: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },

  timelineWrap: {
    marginTop: 14,
    gap: 14,
  },
  emptyTimelineCard: {
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  emptyTimelineTitle: {
    color: 'rgba(255,255,255,0.90)',
    fontWeight: '900',
    fontSize: 13,
  },
  emptyTimelineText: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.60)',
    fontWeight: '700',
    fontSize: 12,
    lineHeight: 18,
  },
  timelineList: {
    position: 'relative',
    gap: 12,
  },
  timelineRail: {
    position: 'absolute',
    left: 84,
    top: 8,
    bottom: 8,
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 1,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timelineLeft: {
    width: 96,
    alignItems: 'flex-end',
    gap: 8,
    paddingRight: 10,
  },
  timelineWhen: {
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '900',
    letterSpacing: 0.6,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  timelineDotOuter: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(108, 99, 255, 0.30)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(108, 99, 255, 0.95)',
  },
  timelineCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  timelineCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },
  timelineServiceIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineServiceIconText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 12,
  },
  timelineServiceLogo: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
    borderRadius: 4,
  },
  timelineName: {
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '900',
    fontSize: 13,
    flex: 1,
  },
  timelineAmount: {
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '900',
    fontSize: 13,
    minWidth: 86,
    textAlign: 'right',
  },
  
});
