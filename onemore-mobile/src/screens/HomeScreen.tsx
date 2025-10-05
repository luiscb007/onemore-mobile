import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { eventsApi } from '../api/events';
import { useAuth } from '../contexts/AuthContext';
import type { EventWithDetails } from '../types';
import { format, addDays } from 'date-fns';
import { Search, SlidersHorizontal } from 'lucide-react-native';

export const HomeScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [events, setEvents] = useState<EventWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hidePast, setHidePast] = useState(true);
  const [sortBy, setSortBy] = useState<'date' | 'distance' | 'popularity'>('date');
  const [showFilters, setShowFilters] = useState(false);

  const categories = ['all', 'arts', 'community', 'culture', 'sports', 'workshops'];

  const loadEvents = async () => {
    try {
      const params = {
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        userId: user?.id,
        userLat: user?.currentLatitude ?? undefined,
        userLng: user?.currentLongitude ?? undefined,
        hidePast,
        search: searchQuery || undefined,
        userRadius: user?.searchRadius ?? undefined,
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
  }, [selectedCategory, user, searchQuery, hidePast, sortBy]);

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover Events</Text>
        {user?.currentLatitude && user?.currentLongitude && (
          <Text style={styles.headerSubtitle}>📍 Events near you</Text>
        )}
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94a3b8"
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <SlidersHorizontal size={20} color="#fff" />
        </TouchableOpacity>
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

      <View style={styles.categoryScroll}>
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
              {category}
            </Text>
          </TouchableOpacity>
        ))}
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
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
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
  categoryScroll: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
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
