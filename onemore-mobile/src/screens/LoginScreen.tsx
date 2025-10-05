import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export const LoginScreen = () => {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email, password });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
      Alert.alert('Login Failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.logo}>OneMore</Text>
          <Text style={styles.tagline}>Discover local events near you</Text>

          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              editable={!isSubmitting}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSubmitting}
            />

            <TouchableOpacity
              style={[styles.loginButton, isSubmitting && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.loginButtonText}>Log In</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>🔐 Backend Setup Required</Text>
            <Text style={styles.infoText}>
              This login form is ready to work with your backend. To enable authentication, add these endpoints to your Express server:
            </Text>
            <Text style={styles.codeText}>
              POST /api/auth/login{'\n'}
              → Accept: {`{ email, password }`}{'\n'}
              → Return: {`{ token, user, refreshToken? }`}{'\n'}
              {'\n'}
              GET /api/auth/user{'\n'}
              → Accept: Authorization: Bearer [token]{'\n'}
              → Return: user object{'\n'}
              {'\n'}
              POST /api/auth/logout{'\n'}
              → Accept: Authorization: Bearer [token]{'\n'}
              → Return: success confirmation
            </Text>
            <Text style={styles.noteText}>
              The mobile app will automatically store tokens securely and attach them to all API requests.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#007AFF',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 18,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 40,
    opacity: 0.9,
  },
  form: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
    marginBottom: 8,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#FFF',
    marginBottom: 12,
    lineHeight: 20,
  },
  codeText: {
    fontSize: 12,
    color: '#FFF',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    lineHeight: 18,
  },
  noteText: {
    fontSize: 13,
    color: '#FFF',
    fontStyle: 'italic',
    lineHeight: 18,
  },
});
