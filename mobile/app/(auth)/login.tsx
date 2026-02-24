import { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { LinearGradient } from 'expo-linear-gradient';
import GlassCard from '../../components/ui/GlassCard';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuthStore();

  const handleLogin = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      Alert.alert('Błąd', 'Wypełnij wszystkie pola');
      return;
    }

    try {
      await login(normalizedEmail, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Błąd logowania', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F0C29', '#302B63', '#24243E']}
        locations={[0, 0.55, 1]}
        style={styles.gradientBackground}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboard}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <Text style={styles.title}>🔐 Zaloguj się</Text>
            <Text style={styles.subtitle}>Witaj ponownie w SubsGuard!</Text>

            <GlassCard style={styles.formCard}>
              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="twoj@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Input
                label="Hasło"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                autoCapitalize="none"
              />

              <Button
                title="Zaloguj się"
                onPress={handleLogin}
                loading={isLoading}
              />
            </GlassCard>

            <View style={styles.registerPrompt}>
              <Text style={styles.registerText}>Nie masz konta? </Text>
              <Text
                style={styles.registerLink}
                onPress={() => router.push('/(auth)/register')}
              >
                Zarejestruj się
              </Text>
            </View>

            <View style={{ height: 90 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0C29',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  keyboard: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.95)',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.65)',
    marginBottom: 24,
    textAlign: 'center',
  },
  formCard: {
    padding: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 20,
  },
  registerPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  registerText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
  },
  registerLink: {
    fontSize: 14,
    color: 'rgba(191, 168, 255, 0.95)',
    fontWeight: '600',
  },
});
