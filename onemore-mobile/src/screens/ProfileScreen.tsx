import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export const ProfileScreen = () => {
  const { user, logout, refreshUser } = useAuth();

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
        <Text style={styles.name}>{fullName}</Text>
        {user.email && <Text style={styles.email}>{user.email}</Text>}
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user.role.toUpperCase()}</Text>
        </View>
        {user.subscriptionTier && (
          <View style={[styles.tierBadge, user.subscriptionTier === 'premium' ? styles.premiumBadge : styles.freeBadge]}>
            <Text style={styles.tierText}>{user.subscriptionTier.toUpperCase()}</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Settings</Text>
        
        <View style={styles.settingItem}>
          <View>
            <Text style={styles.settingLabel}>Search Radius</Text>
            <Text style={styles.settingValue}>{user.searchRadius} km</Text>
          </View>
        </View>

        <View style={styles.settingItem}>
          <View>
            <Text style={styles.settingLabel}>Currency</Text>
            <Text style={styles.settingValue}>{user.defaultCurrencyCode || 'EUR'}</Text>
          </View>
        </View>

        <View style={styles.settingItem}>
          <View>
            <Text style={styles.settingLabel}>Subscription Status</Text>
            <Text style={styles.settingValue}>
              {user.subscriptionStatus || 'active'} • {user.subscriptionTier}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>
        
        {user.currentLatitude !== null && user.currentLongitude !== null ? (
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Current Location</Text>
            <Text style={styles.settingValue}>
              {user.currentLatitude.toFixed(4)}, {user.currentLongitude.toFixed(4)}
            </Text>
          </View>
        ) : (
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Location not set</Text>
            <Text style={styles.settingValue}>Enable location to discover nearby events</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Text style={styles.refreshButtonText}>Refresh Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </View>
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
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
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
  logoutButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 14,
    marginHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
