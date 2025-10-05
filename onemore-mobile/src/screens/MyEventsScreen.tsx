import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { Plus, Calendar, MapPin, Users, DollarSign } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { eventsApi } from '../api/events';
import type { EventWithDetails } from '../types';

export const MyEventsScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const { data: events = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['organizer-events', user?.id],
    queryFn: () => eventsApi.getOrganizerEvents(user!.id),
    enabled: !!user?.id,
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderEventCard = ({ item }: { item: EventWithDetails }) => {
    const isPastEvent = new Date(item.date) < new Date();

    return (
      <TouchableOpacity
        style={[styles.eventCard, isPastEvent && styles.pastEventCard]}
        onPress={() => navigation.navigate('EditEvent' as never, { eventId: item.id } as never)}
      >
        <View style={styles.eventHeader}>
          <Text style={styles.eventTitle} numberOfLines={2}>
            {item.title}
          </Text>
          {item.status === 'cancelled' && (
            <View style={styles.cancelledBadge}>
              <Text style={styles.cancelledText}>Cancelled</Text>
            </View>
          )}
        </View>

        <View style={styles.eventDetails}>
          <View style={styles.detailRow}>
            <Calendar size={14} color="#64748b" />
            <Text style={styles.detailText}>{formatDate(item.date)}</Text>
          </View>

          <View style={styles.detailRow}>
            <MapPin size={14} color="#64748b" />
            <Text style={styles.detailText} numberOfLines={1}>
              {item.address}
            </Text>
          </View>

          {item.capacity && (
            <View style={styles.detailRow}>
              <Users size={14} color="#64748b" />
              <Text style={styles.detailText}>
                {item.attendees?.length || 0} / {item.capacity}
              </Text>
            </View>
          )}

          {item.priceAmount && (
            <View style={styles.detailRow}>
              <DollarSign size={14} color="#64748b" />
              <Text style={styles.detailText}>
                {item.priceCurrencyCode} {item.priceAmount}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#ef4444" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Events</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateEvent' as never)}
        >
          <Plus size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {events.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Calendar size={64} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>No Events Yet</Text>
          <Text style={styles.emptyText}>Create your first event to get started!</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.navigate('CreateEvent' as never)}
          >
            <Text style={styles.emptyButtonText}>Create Event</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={events}
          renderItem={renderEventCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#ef4444"
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pastEventCard: {
    opacity: 0.6,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
    marginRight: 8,
  },
  cancelledBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  cancelledText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#dc2626',
  },
  eventDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#64748b',
    flex: 1,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
    textTransform: 'capitalize',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
