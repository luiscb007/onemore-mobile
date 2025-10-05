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
} from 'react-native';
import { eventsApi } from '../api/events';
import { useAuth } from '../contexts/AuthContext';
import type { EventWithDetails } from '../types';
import { format } from 'date-fns';

export const HomeScreen = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = ['all', 'arts', 'community', 'culture', 'sports', 'workshops'];

  const loadEvents = async () => {
    try {
      const params = {
        category: selectedCategory,
        userId: user?.id,
        userLat: user?.currentLatitude ?? undefined,
        userLng: user?.currentLongitude ?? undefined,
        hidePast: true,
      };
      const data = await eventsApi.getEvents(params);
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
      loadEvents();
    }
  }, [selectedCategory, user]);

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
      <View style={styles.eventCard}>
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
      </View>
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
