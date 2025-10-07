import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { useLocation } from '../hooks/useLocation';
import { useAuth } from '../contexts/AuthContext';

export const LocationPermissionPrompt: React.FC = () => {
  const { user } = useAuth();
  const { permissionStatus, requestLocationPermission, loading } = useLocation();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (user && permissionStatus === 'undetermined') {
      setShowPrompt(true);
    } else if (permissionStatus && permissionStatus !== 'undetermined') {
      setShowPrompt(false);
    }
  }, [user, permissionStatus]);

  const handleAllow = async () => {
    await requestLocationPermission();
  };

  const handleNotNow = () => {
    setShowPrompt(false);
    Alert.alert(
      'Location Disabled',
      'You can enable location access later in your device settings to see events near you.',
      [{ text: 'OK' }]
    );
  };

  if (!showPrompt) return null;

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
            <MapPin size={48} color="#007AFF" />
          </View>
          
          <Text style={styles.title}>Enable Location</Text>
          <Text style={styles.description}>
            OneMore needs your location to show you events happening near you. 
            We only use your location to find nearby events.
          </Text>

          <TouchableOpacity
            style={styles.allowButton}
            onPress={handleAllow}
            disabled={loading}
          >
            <Text style={styles.allowButtonText}>
              {loading ? 'Requesting...' : 'Allow Location Access'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.notNowButton}
            onPress={handleNotNow}
            disabled={loading}
          >
            <Text style={styles.notNowButtonText}>Not Now</Text>
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
    textAlign: 'center',
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
