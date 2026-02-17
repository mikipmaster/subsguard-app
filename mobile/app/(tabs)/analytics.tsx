import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import { formatCurrency } from '../../utils/currency';

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
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={fetchSubscriptions} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Statystyki</Text>
        <Text style={styles.subtitle}>Analiza twoich wydatków</Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, styles.summaryCardPrimary]}>
          <Text style={styles.summaryLabel}>Miesięcznie</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalMonthly)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Rocznie</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalYearly)}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.section}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Aktywne subskrypcje</Text>
          <Text style={styles.statValue}>{activeCount}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Średnia miesięczna</Text>
          <Text style={styles.statValue}>
            {activeCount > 0 ? formatCurrency(totalMonthly / activeCount) : formatCurrency(0)}
          </Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Łącznie subskrypcji</Text>
          <Text style={styles.statValue}>{subscriptions.length}</Text>
        </View>
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
              <View key={category} style={styles.categoryItem}>
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
              </View>
            );
          })
        )}
      </View>

      {/* Insights */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💡 Wnioski</Text>
        <View style={styles.insightCard}>
          <Text style={styles.insightText}>
            {totalYearly > 0
              ? `Wydajesz rocznie ${formatCurrency(totalYearly)} na subskrypcje. To średnio ${formatCurrency(totalMonthly)} miesięcznie.`
              : 'Dodaj swoje pierwsze subskrypcje aby zobaczyć statystyki.'}
          </Text>
        </View>
        {sortedCategories.length > 0 && (
          <View style={styles.insightCard}>
            <Text style={styles.insightText}>
              Największym wydatkiem jest kategoria{' '}
              <Text style={styles.insightHighlight}>
                {categoryLabels[sortedCategories[0][0]]}
              </Text>{' '}
              ({formatCurrency(sortedCategories[0][1])} miesięcznie)
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryCardPrimary: {
    backgroundColor: '#007AFF',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  categoryItem: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#999',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    paddingVertical: 40,
  },
  insightCard: {
    backgroundColor: '#FFF9E6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  insightText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  insightHighlight: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
});
