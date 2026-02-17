import { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const register = useAuthStore((state) => state.register);

  const handleRegister = async () => {
    console.log('🔵 handleRegister CALLED!');
    console.log('📝 Data:', { name, email, password, confirmPassword });
    
    if (!name || !email || !password || !confirmPassword) {
      console.log('❌ Empty fields');
      Alert.alert('Błąd', 'Wypełnij wszystkie pola');
      return;
    }

    if (password !== confirmPassword) {
      console.log('❌ Passwords dont match');
      Alert.alert('Błąd', 'Hasła nie są takie same');
      return;
    }

    if (password.length < 8) {
      console.log('❌ Password too short');
      Alert.alert('Błąd', 'Hasło musi mieć min. 8 znaków');
      return;
    }

    console.log('✅ Validation OK, calling register()...');
    
    try {
      setLoading(true);
      await register(name, email, password);
      console.log('✅ Register success!');
      Alert.alert('Sukces', 'Rejestracja zakończona!');
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('❌ Register error:', error);
      Alert.alert('Błąd rejestracji', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>🚀 Dołącz do nas</Text>
          <Text style={styles.subtitle}>Stwórz konto w SubsGuard</Text>

          <View style={styles.form}>
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

            <View style={styles.loginPrompt}>
              <Text style={styles.loginText}>Masz już konto? </Text>
              <Text
                style={styles.loginLink}
                onPress={() => router.push('/(auth)/login')}
              >
                Zaloguj się
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 14,
    color: '#666',
  },
  loginLink: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
});
