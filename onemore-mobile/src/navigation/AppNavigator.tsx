import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen } from '../screens/HomeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { CreateEventScreen } from '../screens/CreateEventScreen';
import { MyEventsScreen } from '../screens/MyEventsScreen';
import { EditEventScreen } from '../screens/EditEventScreen';
import { useAuth } from '../contexts/AuthContext';
import { ActivityIndicator, View, StyleSheet, Text, TouchableOpacity } from 'react-native';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

export const AppNavigator = () => {
  const { user, loading, userRole } = useAuth();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading OneMore...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <NavigationContainer>
        <LoginScreen />
      </NavigationContainer>
    );
  }

  const MainTabs = () => (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: userRole === 'organizer' ? 'Discover' : 'Events',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24 }}>🎉</Text>
          ),
        }}
      />
      {userRole === 'organizer' && (
        <Tab.Screen
          name="MyEvents"
          component={MyEventsScreen}
          options={{
            tabBarLabel: 'My Events',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 24 }}>📅</Text>
            ),
          }}
        />
      )}
      <Tab.Screen
        name="CreateEventTab"
        component={View}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('CreateEvent');
          },
        })}
        options={{
          tabBarLabel: 'Create',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24 }}>➕</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24 }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="MainTabs" 
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="CreateEvent" 
          component={CreateEventScreen}
          options={{
            title: 'Create Event',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen 
          name="EditEvent" 
          component={EditEventScreen}
          options={{
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});
