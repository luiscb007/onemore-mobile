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
import { CalendarPicker } from '../components/CalendarPicker';

type RegisterScreenProps = {
  navigation: any;
};

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const { register, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthday, setBirthday] = useState<Date | null>(null);
  const [showBirthdayPicker, setShowBirthdayPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    if (!firstName || firstName.trim() === '') {
      Alert.alert('Error', 'First name is required');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await register({
        email,
        password,
        firstName: firstName.trim(),
        lastName: lastName?.trim() || undefined,
        birthday: birthday || undefined,
      });
      
      // Show success message and navigate to login
      Alert.alert(
        'Check Your Email',
        response.message || 'Please check your email to verify your account before logging in.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      Alert.alert('Registration Failed', message);
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
          <Text style={styles.tagline}>Create your account</Text>

          <View style={styles.form}>
            <Text style={styles.label}>Email *</Text>
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

            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="John"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              editable={!isSubmitting}
            />

            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Doe"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              editable={!isSubmitting}
            />

            <Text style={styles.label}>Birthday (Optional)</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => !isSubmitting && setShowBirthdayPicker(true)}
              disabled={isSubmitting}
            >
              <Text style={birthday ? styles.dateText : styles.placeholderText}>
                {birthday ? birthday.toLocaleDateString() : 'Select your birthday'}
              </Text>
            </TouchableOpacity>
            {birthday && (
              <TouchableOpacity
                onPress={() => setBirthday(null)}
                disabled={isSubmitting}
                style={styles.clearButton}
              >
                <Text style={styles.clearButtonText}>Clear Birthday</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.helperText}>
              Optional: Used for age-restricted events
            </Text>

            <CalendarPicker
              visible={showBirthdayPicker}
              value={birthday || new Date(2000, 0, 1)}
              onSelect={(date) => {
                setBirthday(date);
                setShowBirthdayPicker(false);
              }}
              onClose={() => setShowBirthdayPicker(false)}
              minimumDate={new Date(1900, 0, 1)}
            />

            <Text style={styles.label}>Password *</Text>
            <TextInput
              style={styles.input}
              placeholder="At least 6 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSubmitting}
            />

            <Text style={styles.label}>Confirm Password *</Text>
            <TextInput
              style={styles.input}
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSubmitting}
            />

            <TouchableOpacity
              style={[styles.registerButton, isSubmitting && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.registerButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => navigation.navigate('Login')}
              disabled={isSubmitting}
            >
              <Text style={styles.loginLinkText}>
                Already have an account? <Text style={styles.loginLinkBold}>Log In</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              By creating an account, you'll be able to discover local events, connect with organizers, and manage your event preferences.
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
  registerButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  loginLinkText: {
    color: '#64748b',
    fontSize: 14,
  },
  loginLinkBold: {
    color: '#007AFF',
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#FFF',
    lineHeight: 20,
    textAlign: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#000',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  clearButton: {
    marginTop: 4,
    marginBottom: 4,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#007AFF',
    textAlign: 'center',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
});
