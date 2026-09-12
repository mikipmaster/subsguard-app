import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';


export default function IndexScreen() {
  const { isAuthenticated, loadUser } = useAuthStore();
  const { loadSettings } = useSettingsStore();

  useEffect(() => {
    const checkAuth = async () => {
      await loadSettings();
      await loadUser();
      
      // Redirect based on auth status
      if (isAuthenticated) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
    };

    checkAuth();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
