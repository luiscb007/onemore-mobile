import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Linking } from 'react-native';
import { MapPin, Settings, AlertCircle } from 'lucide-react-native';
import { useLocation } from '../hooks/useLocation';
import { useAuth } from '../contexts/AuthContext';

export const LocationPermissionPrompt: React.FC = () => {
  const { user } = useAuth();
  const { permissionStatus, requestLocationPermission, loading, error } = useLocation();
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptType, setPromptType] = useState<'request' | 'denied' | 'settings'>('request');

  useEffect(() => {
    if (user && permissionStatus === 'undetermined') {
      setShowPrompt(true);
      setPromptType('request');
    } else if (permissionStatus === 'denied' && error) {
      setShowPrompt(true);
      setPromptType('settings');
    } else if (permissionStatus && permissionStatus !== 'undetermined') {
      setShowPrompt(false);
    }
  }, [user, permissionStatus, error]);

  const handleAllow = async () => {
    await requestLocationPermission();
    
    if (permissionStatus === 'denied') {
      setPromptType('settings');
    }
  };

  const handleOpenSettings = async () => {
    setShowPrompt(false);
    
    if (Platform.OS === 'ios') {
      await Linking.openURL('app-settings:');
    } else {
      await Linking.openSettings();
    }
    
    Alert.alert(
      'Enable Location',
      Platform.select({
        ios: 'Go to Expo Go → Location → Select "While Using the App"',
        android: 'Go to Expo Go → Permissions → Enable Location',
        default: 'Enable location permissions for Expo Go in your device settings'
      }),
      [{ text: 'OK' }]
    );
  };

  const handleNotNow = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  const getContent = () => {
    if (promptType === 'settings') {
      return {
        icon: <Settings size={48} color="#3b82f6" />,
        title: 'Enable Location in Settings',
        description: Platform.select({
          ios: `To enable location services:\n\n1. Open Settings on your iPhone\n2. Scroll down and tap "Expo Go"\n3. Tap "Location"\n4. Select "While Using the App"\n5. Return to OneMore`,
          android: `To enable location services:\n\n1. Open Settings on your device\n2. Tap "Apps" or "Applications"\n3. Find and tap "Expo Go"\n4. Tap "Permissions"\n5. Enable "Location"\n6. Return to OneMore`,
          default: 'Please enable location services in your device settings.'
        }),
        primaryText: 'Open Settings',
        primaryAction: handleOpenSettings,
        secondaryText: 'Continue Without Location',
      };
    }
    
    return {
      icon: <MapPin size={48} color="#007AFF" />,
      title: 'Enable Location',
      description: 'OneMore uses your location to show you events happening near you. We only use your location while you\'re using the app.',
      primaryText: loading ? 'Requesting...' : 'Allow Location Access',
      primaryAction: handleAllow,
      secondaryText: 'Not Now',
    };
  };

  const content = getContent();

  return (
    <Modal
      visible={showPrompt}
      transparent
      animationType="fade"
      onRequestClose={handleNotNow}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            {content.icon}
          </View>
          
          <Text style={styles.title}>{content.title}</Text>
          <Text style={styles.description}>{content.description}</Text>

          <TouchableOpacity
            style={styles.allowButton}
            onPress={content.primaryAction}
            disabled={loading}
          >
            <Text style={styles.allowButtonText}>
              {content.primaryText}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.notNowButton}
            onPress={handleNotNow}
            disabled={loading}
          >
            <Text style={styles.notNowButtonText}>{content.secondaryText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'left',
    lineHeight: 24,
    marginBottom: 24,
  },
  allowButton: {
    width: '100%',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  allowButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  notNowButton: {
    width: '100%',
    paddingVertical: 14,
  },
  notNowButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});
