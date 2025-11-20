import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeScreen } from '../screens/HomeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { CreateEventScreen } from '../screens/CreateEventScreen';
import { MyEventsScreen } from '../screens/MyEventsScreen';
import { EditEventScreen } from '../screens/EditEventScreen';
import { MessagesScreen } from '../screens/MessagesScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { EventDetailScreen } from '../screens/EventDetailScreen';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../hooks/useLocation';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { ActivityIndicator, View, StyleSheet, Text, TouchableOpacity } from 'react-native';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

export const AppNavigator = () => {
  console.log('[AppNavigator] Component rendering');
  const { user, loading, userRole, refreshUser } = useAuth();
  console.log('[AppNavigator] Auth state - loading:', loading, 'user:', user ? 'exists' : 'null');
  const { getCurrentLocation, requestLocationPermission, permissionStatus } = useLocation();
  const locationFetchedRef = useRef(false);

  // Request location when user logs in
  useEffect(() => {
    const fetchLocation = async () => {
      if (user && !locationFetchedRef.current) {
        // Request permission if not granted
        if (permissionStatus !== 'granted') {
          await requestLocationPermission();
        }
        
        // Get location after permission is granted (either already or just granted)
        if (permissionStatus === 'granted') {
          const coords = await getCurrentLocation();
          if (coords) {
            locationFetchedRef.current = true;
            // Refresh user data to get updated coordinates
            setTimeout(() => {
              refreshUser();
            }, 500);
          }
        }
      } else if (!user) {
        // Reset when user logs out
        locationFetchedRef.current = false;
      }
    };
    
    fetchLocation();
  }, [user, permissionStatus]);

  if (loading) {
    console.log('[AppNavigator] Showing loading screen');
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading OneMore...</Text>
      </View>
    );
  }

  if (!user) {
    console.log('[AppNavigator] Rendering guest navigation (Welcome/Login/Register)');
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  console.log('[AppNavigator] Rendering authenticated navigation for role:', userRole);
  
  const MainTabs = () => {
    console.log('[MainTabs] Rendering main tabs');
    const insets = useSafeAreaInsets();
    
    return (
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#999',
          tabBarShowLabel: false,
          tabBarStyle: {
            paddingBottom: insets.bottom + 8,
            paddingTop: 8,
            height: 60 + insets.bottom,
          },
        }}
      >
      <Tab.Screen
        name="Home"
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24 }}>🔍</Text>
          ),
        }}
      >
        {() => (
          <ErrorBoundary>
            <HomeScreen />
          </ErrorBoundary>
        )}
      </Tab.Screen>
      <Tab.Screen
        name="MyEvents"
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24 }}>📅</Text>
          ),
        }}
      >
        {() => (
          <ErrorBoundary>
            <MyEventsScreen />
          </ErrorBoundary>
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Messages"
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24 }}>💬</Text>
          ),
        }}
      >
        {() => (
          <ErrorBoundary>
            <MessagesScreen />
          </ErrorBoundary>
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Profile"
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24 }}>👤</Text>
          ),
        }}
      >
        {() => (
          <ErrorBoundary>
            <ProfileScreen />
          </ErrorBoundary>
        )}
      </Tab.Screen>
      </Tab.Navigator>
    );
  };

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
        <Stack.Screen 
          name="Chat" 
          component={ChatScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="EventDetail" 
          component={EventDetailScreen}
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
