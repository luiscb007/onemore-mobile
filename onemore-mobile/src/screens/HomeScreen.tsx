import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  Switch,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { eventsApi } from '../api/events';
import { authApi } from '../api/auth';
import { apiClient } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import type { EventWithDetails } from '../types';
import { format, addDays } from 'date-fns';
import { Search, SlidersHorizontal, MapPin, RefreshCw, Calendar, Plus, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { RangeSlider } from '../components/RangeSlider';
import { useLocation } from '../hooks/useLocation';

export const HomeScreen = () => {
  const { user, refreshUser } = useAuth();
  const { location, getCurrentLocation } = useLocation();
  const navigation = useNavigation();
  const [events, setEvents] = useState<EventWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hidePast, setHidePast] = useState(true);
  const [sortBy, setSortBy] = useState<'date' | 'distance' | 'popularity'>('date');
  const [showFilters, setShowFilters] = useState(false);
  const [startDays, setStartDays] = useState(0);
  const [endDays, setEndDays] = useState(60);
  const [locationLoading, setLocationLoading] = useState(false);
  const [cityName, setCityName] = useState<string>('');
  const categoryScrollRef = useRef<ScrollView>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [categoryLayoutWidth, setCategoryLayoutWidth] = useState(0);
  const [categoryContentWidth, setCategoryContentWidth] = useState(0);
  const [currentCoords, setCurrentCoords] = useState<{latitude: number, longitude: number} | null>(null);

  const categories = ['all', 'arts', 'community', 'culture', 'sports', 'workshops'];

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await apiClient.get(`/geocode/reverse?lat=${lat}&lon=${lng}`);
      if (response.data && response.data.city) {
        setCityName(response.data.city);
      }
    } catch (error) {
      console.error('Failed to reverse geocode:', error);
    }
  };

  useEffect(() => {
    if (user?.currentLatitude && user?.currentLongitude) {
      setCurrentCoords({ latitude: user.currentLatitude, longitude: user.currentLongitude });
      reverseGeocode(user.currentLatitude, user.currentLongitude);
    }
  }, [user?.currentLatitude, user?.currentLongitude]);

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const loadEvents = async (coords?: {latitude: number, longitude: number} | null) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const startDate = new Date(today);
      startDate.setDate(today.getDate() + startDays);
      const dateFrom = formatDate(startDate);
      
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + endDays);
      const dateTo = formatDate(endDate);

      const effectiveCoords = coords !== undefined ? coords : currentCoords;
      const params = {
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        userId: user?.id,
        userLat: effectiveCoords?.latitude ?? undefined,
        userLng: effectiveCoords?.longitude ?? undefined,
        hidePast,
        search: searchQuery || undefined,
        userRadius: user?.searchRadius ?? undefined,
        dateFrom,
        dateTo,
        sortBy,
      };
      
      let data = await eventsApi.getEvents(params);
      
      if (sortBy === 'distance') {
        data = data.sort((a, b) => (a.distance || 999) - (b.distance || 999));
      } else if (sortBy === 'popularity') {
        const getPopularity = (event: EventWithDetails) => 
          (event.interactionCounts?.going || 0) + (event.interactionCounts?.like || 0);
        data = data.sort((a, b) => getPopularity(b) - getPopularity(a));
      } else {
        data = data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      }
      
      setEvents(data);
    } catch (error: any) {
      console.error('Failed to load events:', error);
      if (error.response?.status === 401) {
        Alert.alert('Authentication Error', 'Please log in to view events');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      const timeoutId = setTimeout(() => {
        loadEvents();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [selectedCategory, user, searchQuery, hidePast, sortBy, startDays, endDays]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadEvents();
  };

  const handleInteraction = async (eventId: string, type: 'going' | 'like' | 'pass') => {
    try {
      await eventsApi.interactWithEvent(eventId, type);
      await loadEvents();
    } catch (error: any) {
      console.error('Failed to interact:', error);
      const message = error.response?.data?.message || 'Failed to interact with event';
      Alert.alert('Error', message);
    }
  };

  const renderEvent = ({ item }: { item: EventWithDetails }) => {
    const eventDate = new Date(item.date);
    const hasInteracted = item.userInteraction !== undefined;

    return (
      <TouchableOpacity 
        style={styles.eventCard}
        onPress={() => navigation.navigate('EventDetail' as never, { eventId: item.id } as never)}
        activeOpacity={0.7}
      >
        {item.imageUrl && (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.eventImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.eventContent}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category.toUpperCase()}</Text>
          </View>
          <Text style={styles.eventTitle}>{item.title}</Text>
          <Text style={styles.eventDescription} numberOfLines={2}>
            {item.description}
          </Text>
          <View style={styles.eventMeta}>
            <Text style={styles.metaText}>
              📅 {format(eventDate, 'MMM d, yyyy')} • {item.time}
            </Text>
            <Text style={styles.metaText} numberOfLines={1}>
              📍 {item.address}
            </Text>
            {item.distance !== undefined && item.distance !== null && (
              <Text style={styles.metaText}>
                🚶 {item.distance.toFixed(1)} km away
              </Text>
            )}
            {item.priceAmount !== null && item.priceAmount !== undefined && (
              <Text style={styles.metaText}>
                💰 {item.priceCurrencyCode || 'EUR'} {item.priceAmount}
              </Text>
            )}
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statText}>
              ✅ {item.interactionCounts.going} Going
            </Text>
            <Text style={styles.statText}>
              ❤️ {item.interactionCounts.like} Likes
            </Text>
          </View>
          {!hasInteracted && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.passButton]}
                onPress={() => handleInteraction(item.id, 'pass')}
              >
                <Text style={styles.actionButtonText}>❌ Pass</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.likeButton]}
                onPress={() => handleInteraction(item.id, 'like')}
              >
                <Text style={styles.actionButtonText}>❤️ Like</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.goingButton]}
                onPress={() => handleInteraction(item.id, 'going')}
              >
                <Text style={styles.actionButtonText}>✅ Going</Text>
              </TouchableOpacity>
            </View>
          )}
          {hasInteracted && (
            <View style={styles.interactedBadge}>
              <Text style={styles.interactedText}>
                You {item.userInteraction?.type === 'going' ? "marked yourself as going" : item.userInteraction?.type + "d this event"}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(today);
  startDate.setDate(today.getDate() + startDays);
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + endDays);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>1+</Text>
          </View>
          <Text style={styles.headerTitle}>OneMore</Text>
        </View>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateEvent' as never)}
        >
          <Plus size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.controlsRow}>
        <View style={styles.hidePastRow}>
          <Text style={styles.controlLabel}>Hide past</Text>
          <Switch
            value={hidePast}
            onValueChange={setHidePast}
            trackColor={{ false: '#cbd5e1', true: '#22c55e' }}
            thumbColor="#fff"
          />
        </View>
        <View style={styles.sortRow}>
          <Text style={styles.controlLabel}>Sort by:</Text>
          <TouchableOpacity
            style={styles.sortDropdown}
            onPress={() => setShowFilters(true)}
          >
            <Text style={styles.sortDropdownText}>
              {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.locationBanner}>
        <View style={styles.locationInfo}>
          <MapPin size={16} color="#64748b" />
          <Text style={styles.locationText}>
            {currentCoords?.latitude && currentCoords?.longitude 
              ? cityName || 'Loading location...'
              : 'Enable location to discover nearby events'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={async () => {
            setLocationLoading(true);
            try {
              const coords = await getCurrentLocation();
              if (coords) {
                // Location successful - update everything
                setCurrentCoords(coords);
                await reverseGeocode(coords.latitude, coords.longitude);
                await loadEvents(coords);
              } else {
                // Location unavailable/denied - clear location state
                setCurrentCoords(null);
                setCityName('');
                await loadEvents(null);
              }
            } catch (error) {
              console.error('Failed to refresh location:', error);
              setCurrentCoords(null);
              setCityName('');
              await loadEvents(null);
            } finally {
              setLocationLoading(false);
            }
          }}
        >
          <RefreshCw 
            size={16} 
            color="#64748b"
            style={{ 
              transform: [{ rotate: locationLoading ? '360deg' : '0deg' }] 
            }} 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events by title or description..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94a3b8"
          />
        </View>
      </View>

      <View style={styles.dateRangeContainer}>
        <View style={styles.dateHeader}>
          <Text style={styles.dateLabel}>Events between</Text>
        </View>
        <View style={styles.rangeSliderContainer}>
          <RangeSlider
            min={0}
            max={60}
            step={1}
            low={startDays}
            high={endDays}
            onValueChanged={(low, high) => {
              setStartDays(low);
              setEndDays(high);
            }}
          />
          <View style={styles.dateLabels}>
            <Text style={styles.dateLabelText}>
              {format(addDays(new Date(), startDays), 'MMM d')}
            </Text>
            <Text style={styles.dateLabelText}>
              {format(addDays(new Date(), endDays), 'MMM d')}
            </Text>
          </View>
        </View>
      </View>

      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Text style={styles.modalClose}>Done</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.filterSection}>
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Hide Past Events</Text>
                <Switch
                  value={hidePast}
                  onValueChange={setHidePast}
                  trackColor={{ false: '#cbd5e1', true: '#22c55e' }}
                  thumbColor="#fff"
                />
              </View>

              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Sort By</Text>
                <View style={styles.sortButtons}>
                  {(['date', 'distance', 'popularity'] as const).map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.sortButton,
                        sortBy === option && styles.sortButtonActive
                      ]}
                      onPress={() => setSortBy(option)}
                    >
                      <Text
                        style={[
                          styles.sortButtonText,
                          sortBy === option && styles.sortButtonTextActive
                        ]}
                      >
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.categoryContainer}>
        <TouchableOpacity
          style={[styles.categoryArrow, !canScrollLeft && styles.categoryArrowDisabled]}
          onPress={() => {
            const newOffset = Math.max(0, scrollOffset - 200);
            categoryScrollRef.current?.scrollTo({ x: newOffset, animated: true });
            setScrollOffset(newOffset);
          }}
          disabled={!canScrollLeft}
        >
          <ChevronLeft size={20} color={canScrollLeft ? "#64748b" : "#cbd5e1"} />
        </TouchableOpacity>
        
        <ScrollView
          ref={categoryScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryScrollContent}
          onScroll={(event) => {
            const offset = event.nativeEvent.contentOffset.x;
            const contentWidth = event.nativeEvent.contentSize.width;
            const layoutWidth = event.nativeEvent.layoutMeasurement.width;
            
            setScrollOffset(offset);
            setCanScrollLeft(offset > 5);
            setCanScrollRight(offset + layoutWidth < contentWidth - 5);
          }}
          scrollEventThrottle={16}
          onContentSizeChange={(contentWidth, contentHeight) => {
            setCategoryContentWidth(contentWidth);
            if (categoryLayoutWidth > 0) {
              setCanScrollRight(contentWidth > categoryLayoutWidth);
            }
          }}
          onLayout={(event) => {
            const layoutWidth = event.nativeEvent.layout.width;
            setCategoryLayoutWidth(layoutWidth);
            if (categoryContentWidth > 0) {
              setCanScrollRight(categoryContentWidth > layoutWidth);
            }
          }}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  selectedCategory === category && styles.categoryButtonTextActive,
                ]}
              >
                {category === 'all' ? '⭐ All' : 
                 category === 'arts' ? '🎨 Arts' :
                 category === 'community' ? '💛 Community' :
                 category === 'culture' ? '🎭 Culture' :
                 category === 'sports' ? '⚽ Sports' :
                 category === 'workshops' ? '🛠️ Workshops' :
                 category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        <TouchableOpacity
          style={[styles.categoryArrow, !canScrollRight && styles.categoryArrowDisabled]}
          onPress={() => {
            categoryScrollRef.current?.scrollTo({ x: scrollOffset + 200, animated: true });
            setScrollOffset(scrollOffset + 200);
          }}
          disabled={!canScrollRight}
        >
          <ChevronRight size={20} color={canScrollRight ? "#64748b" : "#cbd5e1"} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={events}
        renderItem={renderEvent}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No events found</Text>
            <Text style={styles.emptyStateSubtext}>
              Try changing the category or check back later
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF5733',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  createButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  hidePastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  sortDropdown: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
  },
  sortDropdownText: {
    fontSize: 12,
    color: '#1e293b',
  },
  locationBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#64748b',
  },
  refreshButton: {
    padding: 8,
  },
  dateRangeContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 8,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  sliderContainer: {
    gap: 4,
  },
  sliderLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  slider: {
    flex: 1,
    height: 30,
  },
  rangeSliderContainer: {
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
  dateLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  dateLabelText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1e293b',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  modalClose: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  filterSection: {
    padding: 20,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#334155',
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
  },
  sortButtonActive: {
    backgroundColor: '#ef4444',
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  sortButtonTextActive: {
    color: '#fff',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 8,
  },
  categoryArrow: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryArrowDisabled: {
    opacity: 0.3,
  },
  categoryScroll: {
    flex: 1,
  },
  categoryScrollContent: {
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F0F0F0',
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'capitalize',
  },
  categoryButtonTextActive: {
    color: '#FFF',
  },
  listContent: {
    padding: 16,
  },
  eventCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventImage: {
    width: '100%',
    height: 200,
  },
  eventContent: {
    padding: 16,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  eventMeta: {
    marginBottom: 12,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statText: {
    fontSize: 14,
    color: '#666',
    marginRight: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  passButton: {
    backgroundColor: '#FF3B30',
  },
  likeButton: {
    backgroundColor: '#FF9500',
  },
  goingButton: {
    backgroundColor: '#34C759',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  interactedBadge: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  interactedText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
  },
});
