import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { MapPin } from 'lucide-react-native';
import { apiClient } from '../api/client';

interface AddressResult {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectAddress: (address: string, lat: string, lon: string) => void;
  onClearCoordinates?: () => void;
  placeholder?: string;
  error?: boolean;
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelectAddress,
  onClearCoordinates,
  placeholder = 'Search for an address...',
  error,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const response = await apiClient.get(`/geocode/autocomplete?q=${encodeURIComponent(value)}`);
        setSuggestions(response.data);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error fetching address suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value]);

  const handleSelectSuggestion = (suggestion: AddressResult) => {
    onChange(suggestion.display_name);
    onSelectAddress(suggestion.display_name, suggestion.lat, suggestion.lon);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <MapPin size={20} color="#64748b" style={styles.icon} />
        <TextInput
          style={[styles.input, error && styles.inputError]}
          value={value}
          onChangeText={(text) => {
            onChange(text);
            if (onClearCoordinates) {
              onClearCoordinates();
            }
          }}
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
        />
        {isLoading && <ActivityIndicator size="small" color="#007AFF" style={styles.loader} />}
      </View>

      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {suggestions.slice(0, 4).map((item, index) => (
            <TouchableOpacity
              key={`${item.place_id}-${index}`}
              style={styles.suggestionItem}
              onPress={() => handleSelectSuggestion(item)}
            >
              <MapPin size={16} color="#64748b" />
              <Text style={styles.suggestionText} numberOfLines={2}>
                {item.display_name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#1e293b',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  loader: {
    marginLeft: 8,
  },
  suggestionsContainer: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    maxHeight: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  suggestionText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#1e293b',
    flex: 1,
  },
});
