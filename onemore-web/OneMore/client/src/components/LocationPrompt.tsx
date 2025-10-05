import { useState, useEffect } from 'react';
import { AlertCircle, X, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useLocation } from '@/hooks/useLocation';

export function LocationPrompt() {
  const { error, loading, latitude, longitude, refreshLocation } = useLocation();
  const [dismissed, setDismissed] = useState(false);
  
  // Check if user has previously dismissed this
  useEffect(() => {
    const wasDismissed = localStorage.getItem('locationPromptDismissed');
    if (wasDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('locationPromptDismissed', 'true');
    setDismissed(true);
  };

  const handleRetry = () => {
    // Clear dismissed state and retry location request
    localStorage.removeItem('locationPromptDismissed');
    setDismissed(false);
    refreshLocation();
  };

  // Only show if there's an error and user hasn't dismissed
  const hasLocation = latitude !== null && longitude !== null;
  const shouldShow = error && !dismissed && !hasLocation;
  
  if (!shouldShow) {
    return null;
  }

  return (
    <div className="p-4">
      <Alert className="border-warning/50 bg-warning/10" data-testid="alert-location-denied">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
          <div className="flex-1">
            <AlertTitle className="text-foreground mb-1">Location Access Needed</AlertTitle>
            <AlertDescription className="text-sm text-muted-foreground mb-3">
              To show you events near you and filter by distance, we need access to your location. 
              You can still browse all events without location access, but distance-based filtering won't be available.
            </AlertDescription>
            <div className="flex gap-2 flex-wrap">
              <Button 
                size="sm" 
                variant="default"
                onClick={handleRetry}
                disabled={loading}
                data-testid="button-retry-location"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Requesting...' : 'Refresh Location'}
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleDismiss}
                data-testid="button-dismiss-location"
              >
                Continue Without Location
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={handleDismiss}
            data-testid="button-close-location-prompt"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Alert>
    </div>
  );
}
