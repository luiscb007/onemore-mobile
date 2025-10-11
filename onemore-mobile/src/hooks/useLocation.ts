import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { apiClient } from '../api/client';
import * as Location from 'expo-location';

type LocationObject = {
  coords: {
    latitude: number;
    longitude: number;
  };
};

type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export const useLocation = () => {
  const [location, setLocation] = useState<LocationObject | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'web') {
      await requestWebLocation();
      return;
    }

    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status as PermissionStatus);
      
      if (status === 'granted') {
        await getCurrentLocation();
      } else {
        setError('Location permission denied');
      }
    } catch (err) {
      setError('Failed to request location permission');
      setPermissionStatus('denied');
      console.error('Location permission error:', err);
    } finally {
      setLoading(false);
    }
  };

  const requestWebLocation = async (): Promise<{ latitude: number; longitude: number } | null> => {
    return new Promise((resolve) => {
      try {
        setLoading(true);
        if (!navigator.geolocation) {
          setError('Geolocation not supported');
          setPermissionStatus('denied');
          setLoading(false);
          resolve(null);
          return;
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const locationData = {
              coords: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              },
            };
            setLocation(locationData);
            setPermissionStatus('granted');
            await updateBackendLocation(
              position.coords.latitude,
              position.coords.longitude
            );
            setLoading(false);
            resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude });
          },
          (err) => {
            setError('Failed to get location');
            setPermissionStatus('denied');
            console.error('Geolocation error:', err);
            setLoading(false);
            resolve(null);
          }
        );
      } catch (err) {
        setError('Failed to get location');
        setPermissionStatus('denied');
        console.error('Location error:', err);
        setLoading(false);
        resolve(null);
      }
    });
  };

  const getCurrentLocation = async (): Promise<{ latitude: number; longitude: number } | null> => {
    if (Platform.OS === 'web') {
      return await requestWebLocation();
    }

    try {
      setLoading(true);
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(currentLocation as LocationObject);
      
      await updateBackendLocation(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude
      );
      
      return {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude
      };
    } catch (err) {
      setError('Failed to get current location');
      console.error('Location error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateBackendLocation = async (latitude: number, longitude: number) => {
    try {
      await apiClient.post('/user/location', {
        latitude,
        longitude,
      });
    } catch (err) {
      // Silently ignore location update errors (e.g., 401 when user not logged in)
      // This is expected behavior and shouldn't show an error to the user
    }
  };

  const checkPermission = async () => {
    if (Platform.OS === 'web') {
      setPermissionStatus('undetermined');
      return;
    }

    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setPermissionStatus(status as PermissionStatus);
      
      if (status === 'granted') {
        await getCurrentLocation();
      }
    } catch (err) {
      console.error('Failed to check permission:', err);
    }
  };

  useEffect(() => {
    checkPermission();
  }, []);

  return {
    location,
    permissionStatus,
    error,
    loading,
    requestLocationPermission,
    getCurrentLocation,
  };
};
