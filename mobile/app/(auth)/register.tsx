import { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { LinearGradient } from 'expo-linear-gradient';
import GlassCard from '../../components/ui/GlassCard';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const register = useAuthStore((state) => state.register);

  const handleRegister = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!name || !normalizedEmail || !password || !confirmPassword) {
      if (Platform.OS === 'web') {
        window.alert('Wypełnij wszystkie pola');
      } else {
        Alert.alert('Błąd', 'Wypełnij wszystkie pola');
      }
      return;
    }

    if (password !== confirmPassword) {
      if (Platform.OS === 'web') {
        window.alert('Hasła nie są takie same');
      } else {
        Alert.alert('Błąd', 'Hasła nie są takie same');
      }
      return;
    }

    if (password.length < 8) {
      if (Platform.OS === 'web') {
        window.alert('Hasło musi mieć min. 8 znaków');
      } else {
        Alert.alert('Błąd', 'Hasło musi mieć min. 8 znaków');
      }
      return;
    }
    
    try {
      setLoading(true);
      await register(name, normalizedEmail, password);
      if (Platform.OS === 'web') {
        window.alert('Rejestracja zakończona!');
      } else {
        Alert.alert('Sukces', 'Rejestracja zakończona!');
      }
      router.replace('/(tabs)');
    } catch (error: any) {
      const msg = error?.message || 'Nie udało się zarejestrować.';
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Błąd rejestracji', msg);
      }
    } finally {
      setLoading(false);
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
            <Text style={styles.title}>🚀 Dołącz do nas</Text>
            <Text style={styles.subtitle}>Stwórz konto w SubsGuard</Text>

            <GlassCard style={styles.formCard}>
              <Input
                label="Imię i nazwisko"
                value={name}
                onChangeText={setName}
                placeholder="Jan Kowalski"
              />

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
                placeholder="Min. 8 znaków"
                secureTextEntry
                autoCapitalize="none"
              />

              <Input
                label="Potwierdź hasło"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Powtórz hasło"
                secureTextEntry
                autoCapitalize="none"
              />

              <Button
                title="Zarejestruj się"
                onPress={handleRegister}
                loading={loading}
              />
            </GlassCard>

            <View style={styles.loginPrompt}>
              <Text style={styles.loginText}>Masz już konto? </Text>
              <Text
                style={styles.loginLink}
                onPress={() => router.push('/(auth)/login')}
              >
                Zaloguj się
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
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
  },
  loginLink: {
    fontSize: 14,
    color: 'rgba(191, 168, 255, 0.95)',
    fontWeight: '600',
  },
});
