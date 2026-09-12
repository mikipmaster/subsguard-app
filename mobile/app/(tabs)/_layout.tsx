import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, View } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { useNotifications } from '../../hooks/useNotifications';

export default function TabLayout() {
  const { isAuthenticated } = useAuthStore();
  useNotifications(isAuthenticated);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#BFA8FF',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.55)',
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
          backgroundColor: 'rgba(15, 12, 41, 0.72)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.10)',
          height: Platform.OS === 'ios' ? 88 : 65,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
          ...styles.tabBarShadow,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabIconWrap}>
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={focused ? 28 : 26}
                color={color}
              />
              {focused ? <View style={styles.activeUnderline} /> : null}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="subscriptions"
        options={{
          title: 'Subskrypcje',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabIconWrap}>
              <Ionicons
                name={focused ? 'apps' : 'apps-outline'}
                size={focused ? 28 : 26}
                color={color}
              />
              {focused ? <View style={styles.activeUnderline} /> : null}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Statystyki',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabIconWrap}>
              <Ionicons
                name={focused ? 'bar-chart' : 'bar-chart-outline'}
                size={focused ? 28 : 26}
                color={color}
              />
              {focused ? <View style={styles.activeUnderline} /> : null}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ustawienia',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabIconWrap}>
              <Ionicons
                name={focused ? 'settings' : 'settings-outline'}
                size={focused ? 28 : 26}
                color={color}
              />
              {focused ? <View style={styles.activeUnderline} /> : null}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarShadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 22,
    elevation: 16,
  },
  tabIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 54,
  },
  activeUnderline: {
    marginTop: 6,
    width: 16,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#BFA8FF',
    shadowColor: '#BFA8FF',
    shadowOpacity: 0.9,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
});
