import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeScreen } from '../screens/HomeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { CreateEventScreen } from '../screens/CreateEventScreen';
import { MyEventsScreen } from '../screens/MyEventsScreen';
import { EditEventScreen } from '../screens/EditEventScreen';
import { MessagesScreen } from '../screens/MessagesScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { EventDetailScreen } from '../screens/EventDetailScreen';
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
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  const MainTabs = () => {
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
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24 }}>🔍</Text>
          ),
        }}
      />
      <Tab.Screen
        name="MyEvents"
        component={MyEventsScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24 }}>📅</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24 }}>💬</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24 }}>👤</Text>
          ),
        }}
      />
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
