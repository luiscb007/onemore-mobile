/**
 * Currency detection service
 * Handles reverse geocoding coordinates to country and mapping to currency
 */

// Country code to currency code mapping
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  // Eurozone countries
  'AT': 'EUR', 'BE': 'EUR', 'CY': 'EUR', 'EE': 'EUR', 'FI': 'EUR',
  'FR': 'EUR', 'DE': 'EUR', 'GR': 'EUR', 'IE': 'EUR', 'IT': 'EUR',
  'LV': 'EUR', 'LT': 'EUR', 'LU': 'EUR', 'MT': 'EUR', 'NL': 'EUR',
  'PT': 'EUR', 'SK': 'EUR', 'SI': 'EUR', 'ES': 'EUR',
  // Poland
  'PL': 'PLN',
  // United Kingdom
  'GB': 'GBP',
};

// Default currency when geocoding fails or country not supported
const DEFAULT_CURRENCY = 'EUR';

// Haversine formula to calculate distance between two coordinates (in km)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Determine if currency should be updated based on location change and time
 */
export function shouldUpdateCurrency(
  currentLat: number,
  currentLon: number,
  lastCheckLat: number | null,
  lastCheckLon: number | null,
  lastCheckTime: Date | null
): boolean {
  // If never checked, update
  if (!lastCheckTime || lastCheckLat === null || lastCheckLon === null) {
    return true;
  }

  // Check if more than 7 days since last check
  const daysSinceCheck = (Date.now() - lastCheckTime.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceCheck > 7) {
    return true;
  }

  // Check if moved more than 50km
  const distance = calculateDistance(
    currentLat,
    currentLon,
    lastCheckLat,
    lastCheckLon
  );
  if (distance > 50) {
    return true;
  }

  return false;
}

/**
 * Reverse geocode coordinates to get country code using OpenStreetMap Nominatim
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=3`,
      {
        headers: {
          'User-Agent': 'OneMore Event Platform',
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('Reverse geocoding failed:', response.status);
      return null;
    }

    const data = await response.json();
    
    // Extract country code from response
    const countryCode = data.address?.country_code?.toUpperCase();
    
    if (!countryCode) {
      console.log('No country code found in geocoding response');
      return null;
    }

    return countryCode;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Reverse geocoding timeout');
    } else {
      console.error('Reverse geocoding error:', error);
    }
    return null;
  }
}

/**
 * Detect currency from coordinates
 * Returns currency code or DEFAULT_CURRENCY if detection fails
 */
export async function detectCurrencyFromCoordinates(
  latitude: number,
  longitude: number
): Promise<string> {
  try {
    const countryCode = await reverseGeocode(latitude, longitude);
    
    if (!countryCode) {
      console.log('Reverse geocoding failed, using default currency:', DEFAULT_CURRENCY);
      return DEFAULT_CURRENCY;
    }

    const currency = COUNTRY_TO_CURRENCY[countryCode];
    
    if (!currency) {
      console.log(`Currency not supported for country ${countryCode}, using default:`, DEFAULT_CURRENCY);
      return DEFAULT_CURRENCY;
    }

    console.log(`Detected currency ${currency} for country ${countryCode}`);
    return currency;
  } catch (error) {
    console.error('Currency detection error:', error);
    return DEFAULT_CURRENCY;
  }
}

/**
 * Map country code directly to currency (without geocoding)
 */
export function getCurrencyForCountry(countryCode: string): string {
  return COUNTRY_TO_CURRENCY[countryCode.toUpperCase()] || DEFAULT_CURRENCY;
}
