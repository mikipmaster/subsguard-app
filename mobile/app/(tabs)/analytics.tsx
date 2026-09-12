import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import { formatCurrency } from '../../utils/currency';
import GlassCard from '../../components/ui/GlassCard';
import { theme } from '../../constants/theme';
import api from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';

const giftedCharts = Platform.OS === 'web'
  ? null
  : (require('react-native-gifted-charts') as typeof import('react-native-gifted-charts'));

const PieChart = giftedCharts?.PieChart;
const BarChart = giftedCharts?.BarChart;

type Period = 'month' | 'quarter' | 'year';

type StatsResponse = {
  totalMonthly: number;
  totalYearly: number;
  activeCount: number;
  averageMonthly: number;
  categoryBreakdown?: Record<string, number>;
};

const periodFactor: Record<Period, number> = {
  month: 1,
  quarter: 3,
  year: 12,
};

const periodLabel: Record<Period, string> = {
  month: 'miesięcznie',
  quarter: 'kwartalnie',
  year: 'rocznie',
};

const CATEGORY_COLORS = ['#6C63FF', '#FF5DA2', '#43D9AD', '#FFB347'];

function degToRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const a = degToRad(angleDeg - 90);
  return {
    x: cx + r * Math.cos(a),
    y: cy + r * Math.sin(a),
  };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

function describeDonutSlice(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number
) {
  const outerArc = describeArc(cx, cy, outerR, startAngle, endAngle);
  const innerArc = describeArc(cx, cy, innerR, endAngle, startAngle);
  const p1 = polarToCartesian(cx, cy, outerR, endAngle);
  const p2 = polarToCartesian(cx, cy, innerR, endAngle);
  const p3 = polarToCartesian(cx, cy, innerR, startAngle);
  const p4 = polarToCartesian(cx, cy, outerR, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return [
    `M ${p1.x} ${p1.y}`,
    `A ${outerR} ${outerR} 0 ${largeArcFlag} 0 ${p4.x} ${p4.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${innerR} ${innerR} 0 ${largeArcFlag} 1 ${p2.x} ${p2.y}`,
    'Z',
  ].join(' ');
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function addCycle(date: Date, billingCycle: string, steps: number) {
  const d = new Date(date);
  if (billingCycle === 'DAILY') {
    d.setDate(d.getDate() + steps);
    return d;
  }
  if (billingCycle === 'WEEKLY') {
    d.setDate(d.getDate() + steps * 7);
    return d;
  }
  if (billingCycle === 'MONTHLY') {
    d.setMonth(d.getMonth() + steps);
    return d;
  }
  if (billingCycle === 'QUARTERLY') {
    d.setMonth(d.getMonth() + steps * 3);
    return d;
  }
  if (billingCycle === 'YEARLY') {
    d.setMonth(d.getMonth() + steps * 12);
    return d;
  }
  return d;
}

function monthShortNamePL(monthIndex: number) {
  const names = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'];
  return names[monthIndex] ?? '';
}

export default function AnalyticsScreen() {
  const { subscriptions, fetchSubscriptions, isLoading, getTotalMonthly } = useSubscriptionStore();
  const [period, setPeriod] = useState<Period>('month');
  const [categoryBreakdown, setCategoryBreakdown] = useState<Record<string, number>>({});
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const { data } = await api.get('/subscriptions/stats');
      const payload = data?.data as StatsResponse | undefined;
      if (payload) {
        setStats(payload);
        if (payload.categoryBreakdown) {
          setCategoryBreakdown(payload.categoryBreakdown);
        }
      }
    } catch (e) {
      // ignore: fallback to local calculations
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
    fetchStats();
  }, []);

  useEffect(() => {
    // Fallback: calculate category breakdown locally if stats endpoint didn't provide it
    if (stats?.categoryBreakdown) return;
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
  }, [subscriptions, stats?.categoryBreakdown]);

  const baseTotalMonthly = getTotalMonthly();
  const totalForPeriod = baseTotalMonthly * periodFactor[period];
  const totalYearly = baseTotalMonthly * 12;
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

  const donutData = sortedCategories
    .filter(([, amount]) => amount > 0)
    .slice(0, 8)
    .map(([category, amount], idx) => {
      const scaled = amount * periodFactor[period];
      return {
        value: Math.max(0, scaled),
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
        text: categoryLabels[category] || category,
        rawCategory: category,
        rawMonthly: amount,
      };
    });

  const donutTotal = donutData.reduce((s, d) => s + d.value, 0);

  const now = new Date();
  const last6 = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      monthIndex: d.getMonth(),
      year: d.getFullYear(),
      start: startOfMonth(d),
      end: endOfMonth(d),
      label: monthShortNamePL(d.getMonth()),
    };
  });

  const monthlyTrend = last6.map((m) => {
    let total = 0;
    const subs = subscriptions.filter((s) => s.status === 'ACTIVE');
    subs.forEach((s) => {
      const next = new Date(s.nextBillingDate);
      const cycle = s.billingCycle;

      // Walk backwards to cover the last 6 months
      let cursor = new Date(next);
      let guard = 0;
      while (cursor > m.end && guard < 60) {
        cursor = addCycle(cursor, cycle, -1);
        guard += 1;
      }

      // Sum all occurrences within the month
      guard = 0;
      while (cursor >= m.start && cursor <= m.end && guard < 60) {
        total += s.price;
        cursor = addCycle(cursor, cycle, 1);
        guard += 1;
      }
    });
    return Math.round(total * 100) / 100;
  });

  const barData = last6.map((m, idx) => {
    const isCurrent = idx === last6.length - 1;
    return {
      value: monthlyTrend[idx] * (periodFactor[period] / 1),
      label: m.label,
      frontColor: isCurrent ? '#6C63FF' : '#4B3F8A',
    };
  });

  const soonRenewal = subscriptions
    .filter((s) => s.status === 'ACTIVE')
    .map((s) => {
      const days = Math.ceil((new Date(s.nextBillingDate).getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      return { sub: s, days };
    })
    .filter((x) => x.days >= 0)
    .sort((a, b) => a.days - b.days)[0];

  const renewalsWithin3 = soonRenewal && soonRenewal.days <= 3 ? soonRenewal : null;
  const renewalsWithin7 = subscriptions
    .filter((s) => s.status === 'ACTIVE')
    .some((s) => {
      const days = Math.ceil((new Date(s.nextBillingDate).getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      return days >= 0 && days <= 7;
    });

  const currentMonthSpend = monthlyTrend[monthlyTrend.length - 1] ?? 0;
  const prevMonthSpend = monthlyTrend[monthlyTrend.length - 2] ?? 0;
  const isIncrease = prevMonthSpend > 0 && currentMonthSpend > prevMonthSpend;
  const increasePct = isIncrease ? ((currentMonthSpend - prevMonthSpend) / prevMonthSpend) * 100 : 0;

  const remainingMonthsIncludingCurrent = 12 - now.getMonth();
  const yearlyForecast = baseTotalMonthly * remainingMonthsIncludingCurrent;
  const yearProgress = (now.getMonth() + 1) / 12;

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
          <RefreshControl
            refreshing={isLoading || statsLoading}
            onRefresh={async () => {
              await fetchSubscriptions();
              await fetchStats();
            }}
            tintColor="#fff"
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Statystyki</Text>
          <Text style={styles.subtitle}>Analiza twoich wydatków</Text>
        </View>

      {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <GlassCard style={styles.summaryCardPrimary}>
            <Text style={styles.summaryLabel}>Łącznie ({periodLabel[period]})</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalForPeriod)}</Text>
          </GlassCard>
          <GlassCard style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Rocznie</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalYearly)}</Text>
          </GlassCard>
        </View>

      {/* Period Tabs */}
        <View style={styles.section}>
          <View style={styles.periodTabs}>
            {([
              { key: 'month', label: 'Miesiąc' },
              { key: 'quarter', label: 'Kwartał' },
              { key: 'year', label: 'Rok' },
            ] as const).map((t) => {
              const active = period === t.key;
              return (
                <Text
                  key={t.key}
                  style={[styles.periodTab, active ? styles.periodTabActive : styles.periodTabInactive]}
                  onPress={() => setPeriod(t.key)}
                >
                  {t.label}
                </Text>
              );
            })}
          </View>
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
              <Text style={styles.statLabel}>Średnia ({periodLabel[period]})</Text>
              <Text style={styles.statValue}>
                {activeCount > 0 ? formatCurrency(totalForPeriod / activeCount) : formatCurrency(0)}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Łącznie subskrypcji</Text>
              <Text style={styles.statValue}>{subscriptions.length}</Text>
            </View>
          </GlassCard>
        </View>

      {/* Category Breakdown – Donut */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wydatki według kategorii</Text>
          {donutData.length === 0 ? (
            <Text style={styles.emptyText}>Brak danych do wyświetlenia</Text>
          ) : (
            <GlassCard style={styles.donutCard}>
              {PieChart ? (
                <View style={styles.donutRow}>
                  <View style={styles.donutChartWrap}>
                    <PieChart
                      donut
                      radius={82}
                      innerRadius={58}
                      data={donutData}
                      innerCircleColor="rgba(15, 12, 41, 0.85)"
                      centerLabelComponent={() => (
                        <View style={styles.donutCenter}>
                          <Text style={styles.donutCenterValue}>{formatCurrency(totalForPeriod)}</Text>
                          <Text style={styles.donutCenterLabel}>{periodLabel[period]}</Text>
                        </View>
                      )}
                    />
                  </View>

                  <View style={styles.legend}>
                    {donutData.map((d) => {
                      const pct = totalForPeriod > 0 ? (d.value / totalForPeriod) * 100 : 0;
                      return (
                        <View key={String(d.rawCategory)} style={styles.legendRow}>
                          <View style={[styles.legendDot, { backgroundColor: d.color }]} />
                          <View style={styles.legendTextWrap}>
                            <Text style={styles.legendName} numberOfLines={1}>{d.text}</Text>
                            <Text style={styles.legendMeta}>
                              {pct.toFixed(0)}% · {formatCurrency(d.value)}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ) : (
                <View style={styles.webDonutWrap}>
                  <View style={styles.webDonutSvgWrap}>
                    <Svg width={190} height={190} viewBox="0 0 190 190">
                      <G>
                        {(() => {
                          let angle = 0;
                          return donutData.map((d) => {
                            const pct = donutTotal > 0 ? d.value / donutTotal : 0;
                            const sliceAngle = pct * 360;
                            const start = angle;
                            const end = angle + sliceAngle;
                            angle = end;
                            if (sliceAngle <= 0.0001) return null;
                            const path = describeDonutSlice(95, 95, 82, 58, start, end);
                            return <Path key={String(d.rawCategory)} d={path} fill={d.color} />;
                          });
                        })()}
                        <Circle cx={95} cy={95} r={58} fill="rgba(15, 12, 41, 0.85)" />
                        <SvgText
                          x={95}
                          y={92}
                          fontSize={14}
                          fontWeight="800"
                          fill="rgba(255,255,255,0.95)"
                          textAnchor="middle"
                        >
                          {formatCurrency(totalForPeriod)}
                        </SvgText>
                        <SvgText
                          x={95}
                          y={112}
                          fontSize={11}
                          fontWeight="700"
                          fill="rgba(255,255,255,0.55)"
                          textAnchor="middle"
                        >
                          {periodLabel[period]}
                        </SvgText>
                      </G>
                    </Svg>
                  </View>

                  <View style={styles.legend}>
                    {donutData.map((d) => {
                      const pct = totalForPeriod > 0 ? (d.value / totalForPeriod) * 100 : 0;
                      return (
                        <View key={String(d.rawCategory)} style={styles.legendRow}>
                          <View style={[styles.legendDot, { backgroundColor: d.color }]} />
                          <View style={styles.legendTextWrap}>
                            <Text style={styles.legendName} numberOfLines={1}>{d.text}</Text>
                            <Text style={styles.legendMeta}>
                              {pct.toFixed(0)}% · {formatCurrency(d.value)}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </GlassCard>
          )}
        </View>

      {/* Trend */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trend wydatków</Text>
          <GlassCard style={styles.chartCard}>
            {BarChart ? (
              <BarChart
                data={barData}
                barWidth={18}
                spacing={18}
                roundedTop
                hideRules
                hideYAxisText
                xAxisLabelTextStyle={styles.xAxisLabel}
                xAxisThickness={0}
                yAxisThickness={0}
                noOfSections={4}
                maxValue={Math.max(1, ...barData.map((b) => b.value)) * 1.2}
                height={170}
              />
            ) : (
              <View style={styles.webBarWrap}>
                <Svg width="100%" height={200} viewBox="0 0 420 200">
                  <G>
                    {(() => {
                      const max = Math.max(1, ...barData.map((b) => b.value));
                      const chartTop = 10;
                      const chartBottom = 165;
                      const chartHeight = chartBottom - chartTop;
                      const baseY = chartBottom;
                      const barW = 32;
                      const gap = 26;
                      const startX = 30;

                      return barData.map((b, i) => {
                        const h = (b.value / max) * chartHeight;
                        const x = startX + i * (barW + gap);
                        const y = baseY - h;
                        return (
                          <G key={b.label}>
                            <Rect
                              x={x}
                              y={y}
                              width={barW}
                              height={h}
                              rx={8}
                              fill={b.frontColor}
                            />
                            <SvgText
                              x={x + barW / 2}
                              y={190}
                              fontSize={12}
                              fontWeight="800"
                              fill="rgba(255,255,255,0.55)"
                              textAnchor="middle"
                            >
                              {b.label}
                            </SvgText>
                          </G>
                        );
                      });
                    })()}
                  </G>
                </Svg>
              </View>
            )}
            <View style={styles.trendFooter}>
              <Text style={styles.trendHint}>Ostatnie 6 miesięcy</Text>
              <Text style={styles.trendHint}>{formatCurrency(barData[barData.length - 1]?.value ?? 0)} (bieżący)</Text>
            </View>
          </GlassCard>
        </View>

      {/* Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spostrzeżenia</Text>

          {renewalsWithin3 ? (
            <GlassCard style={[styles.alertCard, styles.alertRed]}>
              <View style={styles.alertRow}>
                <Ionicons name="alert-circle-outline" size={20} color="#FF4444" />
                <Text style={styles.alertText}>
                  Za {renewalsWithin3.days} dni odnowienie {renewalsWithin3.sub.name} – {renewalsWithin3.sub.price} zł
                </Text>
              </View>
            </GlassCard>
          ) : null}

          {isIncrease ? (
            <GlassCard style={[styles.alertCard, styles.alertYellow]}>
              <View style={styles.alertRow}>
                <Ionicons name="trending-up-outline" size={20} color="#FFB347" />
                <Text style={styles.alertText}>
                  Wydatki wzrosły o {increasePct.toFixed(0)}% vs poprzedni miesiąc
                </Text>
              </View>
            </GlassCard>
          ) : null}

          {!renewalsWithin7 ? (
            <GlassCard style={[styles.alertCard, styles.alertGreen]}>
              <View style={styles.alertRow}>
                <Ionicons name="leaf-outline" size={20} color="#43D9AD" />
                <Text style={styles.alertText}>Spokojny tydzień – brak nadchodzących płatności</Text>
              </View>
            </GlassCard>
          ) : null}
        </View>

      {/* Year Forecast */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prognoza roczna</Text>
          <GlassCard style={styles.forecastCard}>
            <Text style={styles.forecastText}>Do końca roku wydasz: <Text style={styles.forecastValue}>{formatCurrency(yearlyForecast)}</Text></Text>

            <View style={styles.progressOuter}>
              <View style={[styles.progressInner, { width: `${Math.min(100, Math.max(0, yearProgress * 100))}%` }]} />
            </View>
            <Text style={styles.progressLabel}>{Math.round(yearProgress * 100)}% roku</Text>
          </GlassCard>
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
  periodTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: 4,
  },
  periodTab: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    fontSize: 14,
    fontWeight: '700',
    overflow: 'hidden',
  },
  periodTabActive: {
    backgroundColor: '#6C63FF',
    color: '#fff',
  },
  periodTabInactive: {
    backgroundColor: 'transparent',
    color: 'rgba(255,255,255,0.60)',
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
  donutCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.14)',
  },
  donutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  donutChartWrap: {
    width: 190,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 110,
  },
  donutCenterValue: {
    fontSize: 16,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
  },
  donutCenterLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.55)',
  },
  legend: {
    flex: 1,
    gap: 10,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendTextWrap: {
    flex: 1,
  },
  legendName: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.88)',
  },
  legendMeta: {
    marginTop: 2,
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '600',
  },
  chartCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.14)',
  },
  xAxisLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontWeight: '700',
  },
  trendFooter: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trendHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '700',
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
  alertCard: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255,255,255,0.78)',
    lineHeight: 20,
    fontWeight: '700',
  },
  alertRed: {
    borderColor: '#FF4444',
    borderWidth: 1,
  },
  alertYellow: {
    borderColor: '#FFB347',
    borderWidth: 1,
  },
  alertGreen: {
    borderColor: '#43D9AD',
    borderWidth: 1,
  },
  forecastCard: {
    backgroundColor: 'rgba(9, 8, 24, 0.70)',
    borderColor: 'rgba(108, 99, 255, 0.55)',
  },
  forecastText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.78)',
    fontWeight: '700',
  },
  forecastValue: {
    color: 'rgba(108, 99, 255, 0.95)',
    fontWeight: '900',
  },
  progressOuter: {
    marginTop: 14,
    height: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
  },
  progressInner: {
    height: '100%',
    backgroundColor: 'rgba(108, 99, 255, 0.95)',
    borderRadius: 6,
  },
  progressLabel: {
    marginTop: 8,
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '700',
  },
  webDonutWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  webDonutSvgWrap: {
    width: 190,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webBarWrap: {
    paddingVertical: 6,
  },
});
