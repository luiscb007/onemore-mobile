import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type UserRole = 'attendee' | 'organizer';

interface RoleSwitcherProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ currentRole, onRoleChange }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          currentRole === 'attendee' && styles.buttonActive
        ]}
        onPress={() => onRoleChange('attendee')}
      >
        <Text style={[
          styles.buttonText,
          currentRole === 'attendee' && styles.buttonTextActive
        ]}>
          Attendee
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.button,
          currentRole === 'organizer' && styles.buttonActive
        ]}
        onPress={() => onRoleChange('organizer')}
      >
        <Text style={[
          styles.buttonText,
          currentRole === 'organizer' && styles.buttonTextActive
        ]}>
          Organizer
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 24,
    padding: 4,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  buttonActive: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  buttonTextActive: {
    color: '#fff',
  },
});
