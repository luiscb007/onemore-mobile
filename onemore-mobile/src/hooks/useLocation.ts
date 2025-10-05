import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { apiClient } from '../api/client';

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
      const Location = await import('expo-location');
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status as PermissionStatus);
      
      if (status === 'granted') {
        await getCurrentLocation();
      } else {
        setError('Location permission denied');
      }
    } catch (err) {
      setError('Failed to request location permission');
      console.error('Location permission error:', err);
    } finally {
      setLoading(false);
    }
  };

  const requestWebLocation = async () => {
    try {
      setLoading(true);
      if (!navigator.geolocation) {
        setError('Geolocation not supported');
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
        },
        (err) => {
          setError('Failed to get location');
          setPermissionStatus('denied');
          console.error('Geolocation error:', err);
          setLoading(false);
        }
      );
    } catch (err) {
      setError('Failed to get location');
      console.error('Location error:', err);
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    if (Platform.OS === 'web') {
      await requestWebLocation();
      return;
    }

    try {
      setLoading(true);
      const Location = await import('expo-location');
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(currentLocation as LocationObject);
      
      await updateBackendLocation(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude
      );
    } catch (err) {
      setError('Failed to get current location');
      console.error('Location error:', err);
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
      console.error('Failed to update backend location:', err);
    }
  };

  const checkPermission = async () => {
    if (Platform.OS === 'web') {
      return;
    }

    try {
      const Location = await import('expo-location');
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
