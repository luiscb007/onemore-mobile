import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './src/contexts/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { LocationPermissionPrompt } from './src/components/LocationPermissionPrompt';
import { StatusBar } from 'expo-status-bar';
import { queryClient } from './src/lib/queryClient';

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar style="auto" />
          <AppNavigator />
          <LocationPermissionPrompt />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
