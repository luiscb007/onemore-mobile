import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  loading: boolean;
  error: string | null;
}

interface LocationContextType extends LocationState {
  refreshLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    loading: true,
    error: null,
  });

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.error('[Geolocation] Not supported by this browser');
      setLocation(prev => ({
        ...prev,
        loading: false,
        error: 'Geolocation is not supported by this browser',
      }));
      return;
    }

    const protocol = window.location.protocol;
    const isSecure = protocol === 'https:' || window.location.hostname === 'localhost';
    console.log('[Geolocation] Requesting location...', {
      protocol,
      isSecure,
      hostname: window.location.hostname,
      userAgent: navigator.userAgent.includes('iPhone') ? 'iPhone' : 
                 navigator.userAgent.includes('Android') ? 'Android' : 'Other'
    });

    setLocation(prev => ({ ...prev, loading: true }));

    const handleSuccess = async (position: GeolocationPosition) => {
      const coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      
      console.log('[Geolocation] Success!', {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: position.coords.accuracy + ' meters',
        timestamp: new Date(position.timestamp).toISOString()
      });
      
      setLocation({
        ...coords,
        loading: false,
        error: null,
      });

      try {
        await fetch('/api/user/location', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(coords),
          credentials: 'include',
        });
      } catch (error) {
        console.error('[Geolocation] Failed to save location to server:', error);
      }
    };

    const handleError = (error: GeolocationPositionError) => {
      let errorMessage = error.message;
      let detailedLog = '';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location access denied. Please enable location permissions.';
          detailedLog = 'User denied permission or HTTPS required';
          if (!isSecure) {
            errorMessage += ' Note: HTTPS is required for location access on mobile devices.';
            detailedLog += ' (Currently using HTTP)';
          }
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information unavailable. Please check device settings.';
          detailedLog = 'Position unavailable - GPS/network issue';
          break;
        case error.TIMEOUT:
          errorMessage = 'Location request timed out. Please try again.';
          detailedLog = 'Request timeout (10s)';
          break;
      }
      
      console.error('[Geolocation] Error:', {
        code: error.code,
        message: errorMessage,
        details: detailedLog,
        protocol: window.location.protocol,
        isSecure
      });
      
      setLocation({
        latitude: null,
        longitude: null,
        loading: false,
        error: errorMessage,
      });
    };

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return (
    <LocationContext.Provider value={{ ...location, refreshLocation: requestLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
