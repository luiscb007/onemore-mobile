import { MapPin, RefreshCw } from 'lucide-react';
import { useLocation } from '@/hooks/useLocation';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

export function LocationBanner() {
  const { latitude, longitude, loading, error, refreshLocation } = useLocation();
  const [cityName, setCityName] = useState<string | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const hasGeocodedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Set timeout to handle cases where geolocation hangs
    const timeout = setTimeout(() => {
      if (loading && !cityName) {
        setCityName('Location unavailable');
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [loading, cityName]);

  useEffect(() => {
    // Reset state when coordinates are null or there's an error
    if (latitude === null || longitude === null || error) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      hasGeocodedRef.current = false;
      setCityName(null);
      setGeocoding(false);
      return;
    }

    // Use explicit null checks for coordinates (handles 0 coordinates)
    if (latitude !== null && longitude !== null && !hasGeocodedRef.current) {
      hasGeocodedRef.current = true;
      setGeocoding(true);
      
      // Create abort controller for cleanup
      abortControllerRef.current = new AbortController();
      
      // Use OpenStreetMap Nominatim API for reverse geocoding
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
        signal: abortControllerRef.current.signal,
        headers: {
          'User-Agent': 'OneMore Event Discovery App'
        }
      })
        .then(res => res.json())
        .then(data => {
          const city = data.address?.city || 
                      data.address?.town || 
                      data.address?.village || 
                      data.address?.county ||
                      data.address?.state ||
                      'Unknown Location';
          setCityName(city);
          setGeocoding(false);
        })
        .catch((err) => {
          if (err.name === 'AbortError') return; // Ignore abort errors
          setCityName('Location unavailable');
          setGeocoding(false);
        });
    }

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [latitude, longitude, error]);

  const getLocationText = () => {
    if (error) return 'Location unavailable';
    if (cityName) return cityName;
    if (loading || geocoding) return 'Getting location...';
    return 'Location unavailable';
  };

  return (
    <div className="bg-secondary/50 px-4 py-2 border-b border-border">
      <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
        <MapPin className="w-4 h-4" />
        <span data-testid="text-location">{getLocationText()}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 min-w-[36px] min-h-[36px] hover:bg-secondary touch-manipulation"
          onClick={refreshLocation}
          disabled={loading}
          data-testid="button-refresh-location"
          title="Refresh location"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  );
}
