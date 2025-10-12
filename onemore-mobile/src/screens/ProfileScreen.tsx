import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { RefreshCw } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { queryClient } from '../lib/queryClient';
import { useLocation } from '../hooks/useLocation';

interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export const ProfileScreen = () => {
  const { user, logout, refreshUser, userRole, setUserRole } = useAuth();
  const { getCurrentLocation } = useLocation();
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');
  const [deletionFeedback, setDeletionFeedback] = useState('');
  const [searchRadius, setSearchRadius] = useState(100);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [locationInfo, setLocationInfo] = useState<{city?: string; country?: string}>({});
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [locationLoading, setLocationLoading] = useState(false);
  const [isSliding, setIsSliding] = useState(false);

  const { data: stats } = useQuery<{ eventsCreated: number; eventsAttended: number; averageRating: number }>({
    queryKey: [`/users/${user?.id}/stats`],
    queryFn: async () => {
      const response = await apiClient.get(`/users/${user?.id}/stats`);
      return response.data;
    },
    enabled: !!user?.id,
  });

  const { data: currencies, isLoading: currenciesLoading } = useQuery<Currency[]>({
    queryKey: ['/currencies'],
    queryFn: async () => {
      const response = await apiClient.get('/currencies');
      return response.data;
    },
  });

  useEffect(() => {
    if (user?.searchRadius !== undefined && !isSliding) {
      setSearchRadius(user.searchRadius);
    }
  }, [user?.searchRadius]);

  useEffect(() => {
    const fetchLocationInfo = async () => {
      if (user?.currentLatitude && user?.currentLongitude) {
        try {
          const response = await apiClient.get('/geocode/reverse', {
            params: {
              lat: user.currentLatitude,
              lon: user.currentLongitude,
            },
          });
          setLocationInfo({
            city: response.data.city,
            country: response.data.country,
          });
        } catch (error) {
          console.error('Error fetching location info:', error);
        }
      }
    };

    fetchLocationInfo();
  }, [user?.currentLatitude, user?.currentLongitude]);

  const updateRadiusMutation = useMutation({
    mutationFn: async (radius: number) => {
      const response = await apiClient.put('/user/search-radius', { radius });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/auth/user'] });
      refreshUser();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update search radius');
    },
  });

  const updateCurrencyMutation = useMutation({
    mutationFn: async (currencyCode: string) => {
      const response = await apiClient.put('/user/currency', { currencyCode });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/auth/user'] });
      refreshUser();
      setCurrencyModalVisible(false);
      Alert.alert('Success', 'Currency updated successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update currency');
    },
  });

  const sendFeedbackMutation = useMutation({
    mutationFn: async (feedbackText: string) => {
      const response = await apiClient.post('/feedback', { feedback: feedbackText });
      return response.data;
    },
    onSuccess: () => {
      Alert.alert('Thank you!', 'Your feedback has been sent successfully.');
      setFeedback('');
      setFeedbackModalVisible(false);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to send feedback. Please try again.');
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.delete('/user/delete', {
        data: { reason: deletionReason, feedback: deletionFeedback }
      });
      return response.data;
    },
    onSuccess: async () => {
      await logout();
      Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to delete account. Please try again.');
    },
  });

  const updateNameMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.patch('/user/profile', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      return response.data;
    },
    onSuccess: async () => {
      await refreshUser();
      setNameModalVisible(false);
      Alert.alert('Success', 'Your name has been updated successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update name');
    },
  });

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notAuthText}>Please log in to view your profile</Text>
      </View>
    );
  }

  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to log out');
            }
          },
        },
      ]
    );
  };

  const handleRefresh = async () => {
    await refreshUser();
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Are you absolutely sure?',
      'This action cannot be undone. This will permanently delete your account and remove all your data including events, interactions, messages, and ratings from our servers.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => setDeleteModalVisible(true),
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {user.profileImageUrl ? (
            <Image
              source={{ uri: user.profileImageUrl }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>
                {fullName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity 
          style={styles.nameContainer} 
          onPress={() => {
            setFirstName(user?.firstName || '');
            setLastName(user?.lastName || '');
            setNameModalVisible(true);
          }}
        >
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.editIcon}>✏️</Text>
        </TouchableOpacity>
        <Text style={styles.nameHint}>Tap to edit - this name is shown to others</Text>
        {user.email && <Text style={styles.email}>{user.email}</Text>}
      </View>

      <View style={styles.statsSection}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats?.eventsCreated || 0}</Text>
          <Text style={styles.statLabel}>Events Created</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats?.eventsAttended || 0}</Text>
          <Text style={styles.statLabel}>Events Attended</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {stats?.eventsCreated && stats?.averageRating ? stats.averageRating.toFixed(1) : '-'}
          </Text>
          <Text style={styles.statLabel}>Avg Rating</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Settings</Text>
        
        {user.subscriptionTier && user.subscriptionTier !== 'free' && (
          <View style={styles.settingItem}>
            <View>
              <Text style={styles.settingLabel}>Subscription Status</Text>
              <Text style={styles.settingValue}>
                {user.subscriptionStatus || 'active'} • {user.subscriptionTier}
              </Text>
            </View>
          </View>
        )}

        {(locationInfo.city || locationInfo.country) ? (
          <View style={styles.settingItem}>
            <View>
              <Text style={styles.settingLabel}>Current Location</Text>
              <Text style={styles.settingValue}>
                {[locationInfo.city, locationInfo.country].filter(Boolean).join(', ')}
              </Text>
            </View>
            <TouchableOpacity
              style={{ padding: 8 }}
              onPress={async () => {
                setLocationLoading(true);
                try {
                  const coords = await getCurrentLocation();
                  if (coords) {
                    await refreshUser();
                    const response = await apiClient.get('/geocode/reverse', {
                      params: { lat: coords.latitude, lon: coords.longitude },
                    });
                    setLocationInfo({
                      city: response.data.city,
                      country: response.data.country,
                    });
                  }
                } catch (error) {
                  console.error('Failed to refresh location:', error);
                  Alert.alert('Error', 'Failed to refresh location');
                } finally {
                  setLocationLoading(false);
                }
              }}
            >
              <RefreshCw 
                size={16} 
                color="#64748b"
                style={{ 
                  transform: [{ rotate: locationLoading ? '360deg' : '0deg' }] 
                }} 
              />
            </TouchableOpacity>
          </View>
        ) : typeof user.currentLatitude === 'number' && typeof user.currentLongitude === 'number' ? (
          <View style={styles.settingItem}>
            <View>
              <Text style={styles.settingLabel}>Current Location</Text>
              <Text style={styles.settingValue}>
                {user.currentLatitude.toFixed(4)}, {user.currentLongitude.toFixed(4)}
              </Text>
            </View>
            <TouchableOpacity
              style={{ padding: 8 }}
              onPress={async () => {
                setLocationLoading(true);
                try {
                  const coords = await getCurrentLocation();
                  if (coords) {
                    await refreshUser();
                    const response = await apiClient.get('/geocode/reverse', {
                      params: { lat: coords.latitude, lon: coords.longitude },
                    });
                    setLocationInfo({
                      city: response.data.city,
                      country: response.data.country,
                    });
                  }
                } catch (error) {
                  console.error('Failed to refresh location:', error);
                  Alert.alert('Error', 'Failed to refresh location');
                } finally {
                  setLocationLoading(false);
                }
              }}
            >
              <RefreshCw 
                size={16} 
                color="#64748b"
                style={{ 
                  transform: [{ rotate: locationLoading ? '360deg' : '0deg' }] 
                }} 
              />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.settingItem}>
            <View>
              <Text style={styles.settingLabel}>Location not set</Text>
              <Text style={styles.settingValue}>Enable location to discover nearby events</Text>
            </View>
            <TouchableOpacity
              style={{ padding: 8 }}
              onPress={async () => {
                setLocationLoading(true);
                try {
                  const coords = await getCurrentLocation();
                  if (coords) {
                    await refreshUser();
                    const response = await apiClient.get('/geocode/reverse', {
                      params: { lat: coords.latitude, lon: coords.longitude },
                    });
                    setLocationInfo({
                      city: response.data.city,
                      country: response.data.country,
                    });
                  }
                } catch (error) {
                  console.error('Failed to refresh location:', error);
                  Alert.alert('Error', 'Failed to refresh location');
                } finally {
                  setLocationLoading(false);
                }
              }}
            >
              <RefreshCw 
                size={16} 
                color="#64748b"
                style={{ 
                  transform: [{ rotate: locationLoading ? '360deg' : '0deg' }] 
                }} 
              />
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.settingItem, styles.settingItemColumn]}>
          <View style={styles.radiusHeader}>
            <Text style={styles.settingLabel}>Search Radius</Text>
            <Text style={styles.radiusValue}>{searchRadius} km</Text>
          </View>
          <Slider
            style={styles.slider}
            value={searchRadius}
            onValueChange={setSearchRadius}
            onSlidingStart={() => setIsSliding(true)}
            onSlidingComplete={(value) => {
              setIsSliding(false);
              updateRadiusMutation.mutate(value);
            }}
            minimumValue={0}
            maximumValue={100}
            step={1}
            minimumTrackTintColor="#007AFF"
            maximumTrackTintColor="#D1D1D6"
            thumbTintColor="#007AFF"
          />
          <View style={styles.radiusLabels}>
            <Text style={styles.radiusLabelText}>0 km</Text>
            <Text style={styles.radiusLabelText}>100 km</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.settingItem} 
          onPress={() => setCurrencyModalVisible(true)}
        >
          <View>
            <Text style={styles.settingLabel}>Currency</Text>
            <Text style={styles.settingValue}>{user.defaultCurrencyCode || 'EUR'}</Text>
          </View>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About OneMore</Text>
        <View style={styles.aboutContainer}>
          <Text style={styles.aboutText}>
            OneMore helps you discover local events and connect with your community. Whether you're looking to attend events or organize them, we make it easy to find your tribe.
          </Text>
          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>🎨</Text>
            <Text style={styles.featureText}>Discover arts, culture, and creative events</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>🤝</Text>
            <Text style={styles.featureText}>Connect with your local community</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>⚽</Text>
            <Text style={styles.featureText}>Find sports and fitness activities</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>📚</Text>
            <Text style={styles.featureText}>Learn through workshops and classes</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.feedbackButton} 
          onPress={() => setFeedbackModalVisible(true)}
        >
          <Text style={styles.feedbackButtonText}>💬 Give us feedback</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
          <Text style={styles.deleteButtonText}>🗑️ Delete Account</Text>
        </TouchableOpacity>
      </View>

      {/* Feedback Modal */}
      <Modal
        visible={feedbackModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFeedbackModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Send Feedback</Text>
            <Text style={styles.modalDescription}>
              Help us improve OneMore by sharing your thoughts and suggestions.
            </Text>
            <TextInput
              style={styles.feedbackInput}
              placeholder="Tell us what you think..."
              value={feedback}
              onChangeText={setFeedback}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setFeedbackModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={() => sendFeedbackMutation.mutate(feedback)}
                disabled={!feedback.trim()}
              >
                <Text style={styles.submitButtonText}>
                  {sendFeedbackMutation.isPending ? 'Sending...' : 'Send'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        visible={deleteModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Why are you leaving?</Text>
            <Text style={styles.modalDescription}>Optional: Help us understand</Text>
            
            <View style={styles.reasonsContainer}>
              <TouchableOpacity
                style={[styles.reasonOption, deletionReason === 'not-enough-events' && styles.reasonSelected]}
                onPress={() => setDeletionReason('not-enough-events')}
              >
                <Text style={styles.reasonText}>Not enough events in my area</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reasonOption, deletionReason === 'not-using' && styles.reasonSelected]}
                onPress={() => setDeletionReason('not-using')}
              >
                <Text style={styles.reasonText}>Not using the app anymore</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reasonOption, deletionReason === 'privacy-concerns' && styles.reasonSelected]}
                onPress={() => setDeletionReason('privacy-concerns')}
              >
                <Text style={styles.reasonText}>Privacy concerns</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.feedbackInput}
              placeholder="Additional feedback (optional)..."
              value={deletionFeedback}
              onChangeText={setDeletionFeedback}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteConfirmButton]}
                onPress={() => deleteAccountMutation.mutate()}
                disabled={deleteAccountMutation.isPending}
              >
                <Text style={styles.deleteConfirmButtonText}>
                  {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete Account'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Currency Picker Modal */}
      <Modal
        visible={currencyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCurrencyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Currency</Text>
            <Text style={styles.modalDescription}>Choose your preferred currency for event prices</Text>
            
            {currenciesLoading ? (
              <ActivityIndicator size="large" color="#007AFF" />
            ) : (
              <ScrollView style={styles.currencyList}>
                {currencies?.map((currency) => (
                  <TouchableOpacity
                    key={currency.code}
                    style={[
                      styles.currencyOption,
                      user?.defaultCurrencyCode === currency.code && styles.currencySelected
                    ]}
                    onPress={() => updateCurrencyMutation.mutate(currency.code)}
                    disabled={updateCurrencyMutation.isPending}
                  >
                    <Text style={styles.currencySymbol}>{currency.symbol}</Text>
                    <View style={styles.currencyInfo}>
                      <Text style={styles.currencyCode}>{currency.code}</Text>
                      <Text style={styles.currencyName}>{currency.name}</Text>
                    </View>
                    {user?.defaultCurrencyCode === currency.code && (
                      <Text style={styles.checkMark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setCurrencyModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Name Modal */}
      <Modal
        visible={nameModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setNameModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Your Name</Text>
            <Text style={styles.modalDescription}>This name will be shown to other users</Text>
            
            <TextInput
              style={styles.nameInput}
              placeholder="First Name"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
            />
            
            <TextInput
              style={styles.nameInput}
              placeholder="Last Name"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setNameModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={() => updateNameMutation.mutate()}
                disabled={updateNameMutation.isPending || !firstName.trim()}
              >
                <Text style={styles.submitButtonText}>
                  {updateNameMutation.isPending ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notAuthText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#FFF',
    paddingTop: 60,
    paddingBottom: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 40,
    color: '#FFF',
    fontWeight: 'bold',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  editIcon: {
    fontSize: 16,
    opacity: 0.6,
  },
  nameHint: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    marginBottom: 8,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  nameInput: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1e293b',
    marginBottom: 12,
  },
  roleSwitcherContainer: {
    marginBottom: 16,
  },
  roleBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  roleText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tierBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  freeBadge: {
    backgroundColor: '#999',
  },
  premiumBadge: {
    backgroundColor: '#FFD700',
  },
  tierText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: '#FFF',
    marginTop: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingItemColumn: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  radiusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  radiusValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  radiusLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  radiusLabelText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  settingLabel: {
    fontSize: 16,
    color: '#000',
    marginBottom: 4,
  },
  settingValue: {
    fontSize: 14,
    color: '#666',
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statsSection: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
  },
  aboutContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  aboutText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureEmoji: {
    fontSize: 18,
    marginRight: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
  },
  feedbackButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  feedbackButtonText: {
    color: '#1e293b',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#1e293b',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#fee2e2',
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  feedbackInput: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1e293b',
    minHeight: 100,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  reasonsContainer: {
    marginBottom: 16,
  },
  reasonOption: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  reasonSelected: {
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  reasonText: {
    fontSize: 14,
    color: '#1e293b',
  },
  deleteConfirmButton: {
    backgroundColor: '#dc2626',
  },
  deleteConfirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  settingArrow: {
    fontSize: 24,
    color: '#94a3b8',
    marginLeft: 8,
  },
  currencyList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  currencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f1f5f9',
  },
  currencySelected: {
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  currencySymbol: {
    fontSize: 24,
    marginRight: 16,
    width: 32,
    textAlign: 'center',
  },
  currencyInfo: {
    flex: 1,
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  currencyName: {
    fontSize: 14,
    color: '#64748b',
  },
  checkMark: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: 'bold',
  },
});
