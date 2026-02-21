import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import { formatCurrency } from '../../utils/currency';
import GlassCard from '../../components/ui/GlassCard';
import { theme } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const { subscriptions, fetchSubscriptions, isLoading, getTotalMonthly } = useSubscriptionStore();
  const [categoryBreakdown, setCategoryBreakdown] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  useEffect(() => {
    // Calculate category breakdown
    const breakdown: Record<string, number> = {};
    subscriptions
      .filter((s) => s.status === 'ACTIVE')
      .forEach((sub) => {
        const cycleMultiplier: Record<string, number> = {
          DAILY: 30,
          WEEKLY: 30 / 7,
          MONTHLY: 1,
          QUARTERLY: 1 / 3,
          YEARLY: 1 / 12,
        };
        const monthlyPrice = sub.price * (cycleMultiplier[sub.billingCycle] || 1);
        breakdown[sub.category] = (breakdown[sub.category] || 0) + monthlyPrice;
      });
    setCategoryBreakdown(breakdown);
  }, [subscriptions]);

  const totalMonthly = getTotalMonthly();
  const totalYearly = totalMonthly * 12;
  const activeCount = subscriptions.filter((s) => s.status === 'ACTIVE').length;

  const categoryLabels: Record<string, string> = {
    STREAMING: 'Streaming',
    FITNESS: 'Fitness',
    SAAS: 'SaaS',
    GAMING: 'Gaming',
    MUSIC: 'Muzyka',
    CLOUD_STORAGE: 'Cloud',
    NEWS: 'News',
    EDUCATION: 'Edukacja',
    OTHER: 'Inne',
  };

  const sortedCategories = Object.entries(categoryBreakdown).sort(
    ([, a], [, b]) => b - a
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F0C29', '#302B63', '#24243E']}
        locations={[0, 0.55, 1]}
        style={styles.gradientBackground}
      />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchSubscriptions} tintColor="#fff" />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Statystyki</Text>
          <Text style={styles.subtitle}>Analiza twoich wydatków</Text>
        </View>

      {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <GlassCard style={styles.summaryCardPrimary}>
            <Text style={styles.summaryLabel}>Miesięcznie</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalMonthly)}</Text>
          </GlassCard>
          <GlassCard style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Rocznie</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalYearly)}</Text>
          </GlassCard>
        </View>

      {/* Stats */}
        <View style={styles.section}>
          <GlassCard style={styles.sectionCard}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Aktywne subskrypcje</Text>
              <Text style={styles.statValue}>{activeCount}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Średnia miesięczna</Text>
              <Text style={styles.statValue}>
                {activeCount > 0 ? formatCurrency(totalMonthly / activeCount) : formatCurrency(0)}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Łącznie subskrypcji</Text>
              <Text style={styles.statValue}>{subscriptions.length}</Text>
            </View>
          </GlassCard>
        </View>

      {/* Category Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wydatki według kategorii</Text>
          {sortedCategories.length === 0 ? (
            <Text style={styles.emptyText}>Brak danych do wyświetlenia</Text>
          ) : (
            sortedCategories.map(([category, amount]) => {
              const percentage = (amount / totalMonthly) * 100;
              return (
                <GlassCard key={category} style={styles.categoryItem}>
                  <View style={styles.categoryHeader}>
                    <Text style={styles.categoryName}>
                      {categoryLabels[category] || category}
                    </Text>
                    <Text style={styles.categoryAmount}>
                      {formatCurrency(amount)}
                    </Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        { width: `${percentage}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.categoryPercentage}>
                    {percentage.toFixed(1)}% całkowitych wydatków
                  </Text>
                </GlassCard>
              );
            })
          )}
        </View>

      {/* Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wnioski</Text>
          <GlassCard style={styles.insightCard}>
            <Text style={styles.insightText}>
              {totalYearly > 0
                ? `Wydajesz rocznie ${formatCurrency(totalYearly)} na subskrypcje. To średnio ${formatCurrency(totalMonthly)} miesięcznie.`
                : 'Dodaj swoje pierwsze subskrypcje aby zobaczyć statystyki.'}
            </Text>
          </GlassCard>
          {sortedCategories.length > 0 && (
            <GlassCard style={styles.insightCard}>
              <Text style={styles.insightText}>
                Największym wydatkiem jest kategoria{' '}
                <Text style={styles.insightHighlight}>
                  {categoryLabels[sortedCategories[0][0]]}
                </Text>{' '}
                ({formatCurrency(sortedCategories[0][1])} miesięcznie)
              </Text>
            </GlassCard>
          )}
        </View>

        <View style={{ height: 140 }} />
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
  scroll: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.95)',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.70)',
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  summaryCard: {
    flex: 1,
    padding: 20,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.14)',
  },
  summaryCardPrimary: {
    flex: 1,
    padding: 20,
    borderRadius: 18,
    backgroundColor: 'rgba(191, 168, 255, 0.20)',
    borderColor: 'rgba(191, 168, 255, 0.35)',
  },
  summaryLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 8,
    fontWeight: '700',
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.95)',
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.92)',
    marginBottom: 16,
  },
  sectionCard: {
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.14)',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  statLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.70)',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.92)',
  },
  categoryItem: {
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.14)',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.90)',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'rgba(191, 168, 255, 0.95)',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'rgba(191, 168, 255, 0.95)',
    borderRadius: 4,
  },
  categoryPercentage: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
  },
  emptyText: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    paddingVertical: 40,
  },
  insightCard: {
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.14)',
  },
  insightText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 20,
  },
  insightHighlight: {
    fontWeight: 'bold',
    color: 'rgba(191, 168, 255, 0.95)',
  },
});
