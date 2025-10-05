import React from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  Linking,
  Platform,
} from 'react-native';
import { MapPin } from 'lucide-react-native';

interface MapPreviewProps {
  latitude: number;
  longitude: number;
  address?: string;
  width?: number;
  height?: number;
}

export const MapPreview: React.FC<MapPreviewProps> = ({
  latitude,
  longitude,
  address,
  width = 350,
  height = 200,
}) => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
  const staticMapUrl = `${apiUrl}/api/geocode/static-map?lat=${latitude}&lng=${longitude}&width=${width}&height=${height}`;

  const openInMaps = () => {
    const scheme = Platform.select({
      ios: `maps:0,0?q=${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}`,
    });
    
    const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

    if (scheme) {
      Linking.canOpenURL(scheme).then((supported) => {
        if (supported) {
          Linking.openURL(scheme);
        } else {
          Linking.openURL(fallbackUrl);
        }
      });
    } else {
      Linking.openURL(fallbackUrl);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={openInMaps} activeOpacity={0.8}>
        <Image
          source={{ uri: staticMapUrl }}
          style={[styles.mapImage, { width, height }]}
          resizeMode="cover"
        />
        <View style={styles.overlay}>
          <View style={styles.openButton}>
            <MapPin size={16} color="#fff" />
            <Text style={styles.openButtonText}>Open in Maps</Text>
          </View>
        </View>
      </TouchableOpacity>
      {address && (
        <Text style={styles.addressText} numberOfLines={2}>
          {address}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
  },
  mapImage: {
    backgroundColor: '#e2e8f0',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 12,
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  openButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  addressText: {
    padding: 12,
    fontSize: 14,
    color: '#64748b',
  },
});
