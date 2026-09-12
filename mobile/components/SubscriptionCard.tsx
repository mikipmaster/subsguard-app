import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Subscription } from '../store/subscriptionStore';
import { formatCurrency } from '../utils/currency';
import { getDaysUntilText } from '../utils/date';

interface SubscriptionCardProps {
  subscription: Subscription;
  onPress: () => void;
}

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

export default function SubscriptionCard({ subscription, onPress }: SubscriptionCardProps) {
  const daysUntil = getDaysUntilText(subscription.nextBillingDate);
  const iconName = categoryIcons[subscription.category] || 'apps';
  const bgColor = categoryColors[subscription.category] || '#95A5A6';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={[styles.iconContainer, { backgroundColor: bgColor }]}>
        <Ionicons name={iconName} size={24} color="#fff" />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.name}>{subscription.name}</Text>
        <Text style={styles.cycle}>{daysUntil}</Text>
        {!!subscription.notes && (
          <Text style={styles.notes} numberOfLines={2}>
            {subscription.notes}
          </Text>
        )}
      </View>
      
      <View style={styles.right}>
        <Text style={styles.price}>
          {formatCurrency(subscription.price, subscription.currency)}
        </Text>
        <Text style={styles.billingCycle}>
          /{subscription.billingCycle === 'MONTHLY' ? 'msc' : subscription.billingCycle.toLowerCase()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  cycle: {
    fontSize: 14,
    color: '#666',
  },
  notes: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: '#555',
    fontWeight: '500',
  },
  right: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  billingCycle: {
    fontSize: 12,
    color: '#999',
  },
});
