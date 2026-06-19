import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import type { Enseignant } from '../types/enseignant';

const API_URL =
  Platform.OS === 'web'
    ? 'http://localhost:8080/api/enseignants/login'
    : 'http://10.92.93.120:8080/api/enseignants/login';

export default function Index() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setMessage(null);
    setLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (response.ok) {
        const enseignant: Enseignant = await response.json();
        setIsSuccess(true);
        setMessage('Connexion réussie');
        router.replace({
          pathname: '/home',
          params: { enseignant: JSON.stringify(enseignant) },
        });
      } else {
        setIsSuccess(false);
        setMessage('Email ou mot de passe incorrect');
      }
    } catch {
      setIsSuccess(false);
      setMessage('Impossible de joindre le serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.card}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/images/fst-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>Campus Présence</Text>
        <Text style={styles.subtitle}>Connexion enseignant</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="votre@email.com"
          placeholderTextColor="#94a3b8"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>Mot de passe</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor="#94a3b8"
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Se connecter</Text>
          )}
        </TouchableOpacity>

        {message !== null && (
          <Text style={[styles.message, isSuccess ? styles.success : styles.error]}>
            {message}
          </Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', backgroundColor: '#FAF3E0', padding: 24 },
  card: { backgroundColor: '#FFFEF9', borderRadius: 16, padding: 28, shadowColor: '#5C3317', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.14, shadowRadius: 12, elevation: 6, borderWidth: 1, borderColor: '#E8D5BF' },
  logoContainer: { alignItems: 'center', marginBottom: 12 },
  logo: { width: 220, height: 80 },
  title: { fontSize: 26, fontWeight: '800', color: '#5C3317', textAlign: 'center', marginBottom: 4, letterSpacing: 0.5 },
  subtitle: { fontSize: 15, color: '#7D6B5A', textAlign: 'center', marginBottom: 28 },
  label: { fontSize: 14, fontWeight: '600', color: '#8B4513', marginBottom: 8 },
  input: { backgroundColor: '#FAF3E0', borderWidth: 1.5, borderColor: '#DEB887', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#3B1F0A', marginBottom: 18 },
  button: { backgroundColor: '#8B4513', borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#FFFEF9', fontSize: 17, fontWeight: '600' },
  message: { marginTop: 20, fontSize: 15, fontWeight: '600', textAlign: 'center' },
  success: { color: '#166534' },
  error: { color: '#7A3F1A' },
});
