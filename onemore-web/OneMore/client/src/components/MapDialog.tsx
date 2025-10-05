import { useState, useRef, useEffect } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import { ExternalLink, MapPin } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface MapDialogProps {
  isOpen: boolean;
  onClose: () => void;
  latitude: string;
  longitude: string;
  address: string;
  eventTitle: string;
}

export function MapDialog({ isOpen, onClose, latitude, longitude, address, eventTitle }: MapDialogProps) {
  const mapRef = useRef<any>(null);
  const [viewState, setViewState] = useState({
    longitude: parseFloat(longitude) || 0,
    latitude: parseFloat(latitude) || 0,
    zoom: 14
  });

  useEffect(() => {
    if (isOpen && latitude && longitude) {
      setViewState({
        longitude: parseFloat(longitude),
        latitude: parseFloat(latitude),
        zoom: 14
      });
    }
  }, [isOpen, latitude, longitude]);

  const handleOpenInMaps = () => {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    window.open(mapsUrl, '_blank');
  };

  const apiKey = import.meta.env.VITE_LOCATIONIQ_API_KEY || '';
  const mapStyle = `https://tiles.locationiq.com/v3/streets/vector.json?key=${apiKey}`;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] sm:h-auto rounded-t-2xl"
        data-testid="dialog-map"
      >
        <SheetHeader className="text-left mb-4">
          <SheetTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Event Location
          </SheetTitle>
          <SheetDescription className="text-sm">
            {eventTitle}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4">
          {/* Interactive Map Display */}
          <div className="relative w-full h-64 sm:h-80 rounded-lg overflow-hidden" data-testid="container-interactive-map">
            {isOpen && apiKey && (
              <Map
                ref={mapRef}
                {...viewState}
                onMove={evt => setViewState(evt.viewState)}
                style={{ width: '100%', height: '100%' }}
                mapStyle={mapStyle}
                minZoom={2}
                maxZoom={18}
                attributionControl={false}
              >
                <NavigationControl 
                  position="top-right" 
                  showCompass={true}
                  showZoom={true}
                />
                
                <Marker 
                  longitude={parseFloat(longitude)} 
                  latitude={parseFloat(latitude)}
                  color="#ef4444"
                />
              </Map>
            )}
            {!apiKey && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <p className="text-sm text-muted-foreground">
                  Map service not configured
                </p>
              </div>
            )}
          </div>

          {/* Address Display */}
          <div className="p-3 bg-secondary rounded-lg">
            <p className="text-sm font-medium mb-1">Address</p>
            <p className="text-sm text-muted-foreground" data-testid="text-map-address">
              {address}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleOpenInMaps}
              className="w-full touch-target"
              data-testid="button-open-external-maps"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in Maps App
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full touch-target"
              data-testid="button-close-map-dialog"
            >
              Close
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
