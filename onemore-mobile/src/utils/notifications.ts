import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../api/client';

// Configure how notifications should be handled when the app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }
    
    try {
      const projectId = process.env.EXPO_PUBLIC_PROJECT_ID || 'aa97bab0-86b8-4bc8-87a8-9b7dceb57024';
      token = (await Notifications.getExpoPushTokenAsync({
        projectId,
      })).data;
      console.log('Push token obtained:', token);
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}

export async function sendPushTokenToBackend(token: string | null): Promise<void> {
  try {
    await apiClient.post('/auth/push-token', { token });
    
    // Store token locally to avoid re-sending unnecessarily
    if (token) {
      await AsyncStorage.setItem('expoPushToken', token);
    } else {
      await AsyncStorage.removeItem('expoPushToken');
    }
    
    console.log('Push token sent to backend successfully');
  } catch (error) {
    console.error('Failed to send push token to backend:', error);
  }
}

export async function setupPushNotifications(): Promise<void> {
  // Check if we already have a stored token
  const storedToken = await AsyncStorage.getItem('expoPushToken');
  
  // Register for push notifications
  const token = await registerForPushNotificationsAsync();
  
  // Only send to backend if token changed or doesn't exist
  if (token && token !== storedToken) {
    await sendPushTokenToBackend(token);
  }
}

export async function unregisterPushNotifications(): Promise<void> {
  // Always send null to backend to clear token, even if we can't fetch a new one
  try {
    await sendPushTokenToBackend(null);
  } catch (error) {
    console.error('Failed to unregister push token:', error);
    // Still try to clear local storage even if backend call fails
    await AsyncStorage.removeItem('expoPushToken');
  }
}
