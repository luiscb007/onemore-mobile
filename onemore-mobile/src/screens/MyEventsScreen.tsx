import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { Plus, Calendar, MapPin, Users, DollarSign, Heart, ThumbsDown, MessageCircle, Star } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { eventsApi } from '../api/events';
import { messagingApi } from '../api/messaging';
import { ratingsApi } from '../api/ratings';
import type { EventWithDetails } from '../types';

type TabType = 'going' | 'liked' | 'passed' | 'organized';

export const MyEventsScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('going');

  const { data: goingEvents = [], isLoading: goingLoading, refetch: refetchGoing, isRefetching: goingRefetching } = useQuery({
    queryKey: ['user-events', 'going'],
    queryFn: () => eventsApi.getUserEvents('going'),
    enabled: !!user && activeTab === 'going',
  });

  const { data: likedEvents = [], isLoading: likedLoading, refetch: refetchLiked, isRefetching: likedRefetching } = useQuery({
    queryKey: ['user-events', 'like'],
    queryFn: () => eventsApi.getUserEvents('like'),
    enabled: !!user && activeTab === 'liked',
  });

  const { data: passedEvents = [], isLoading: passedLoading, refetch: refetchPassed, isRefetching: passedRefetching } = useQuery({
    queryKey: ['user-events', 'pass'],
    queryFn: () => eventsApi.getUserEvents('pass'),
    enabled: !!user && activeTab === 'passed',
  });

  const { data: organizedEvents = [], isLoading: organizedLoading, refetch: refetchOrganized, isRefetching: organizedRefetching } = useQuery({
    queryKey: ['organizer-events', user?.id],
    queryFn: () => eventsApi.getOrganizerEvents(user!.id),
    enabled: !!user?.id && activeTab === 'organized',
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getCurrentEvents = (): EventWithDetails[] => {
    switch (activeTab) {
      case 'going':
        return goingEvents;
      case 'liked':
        return likedEvents;
      case 'passed':
        return passedEvents;
      case 'organized':
        return organizedEvents;
      default:
        return [];
    }
  };

  const getCurrentLoading = (): boolean => {
    switch (activeTab) {
      case 'going':
        return goingLoading;
      case 'liked':
        return likedLoading;
      case 'passed':
        return passedLoading;
      case 'organized':
        return organizedLoading;
      default:
        return false;
    }
  };

  const getCurrentRefetch = () => {
    switch (activeTab) {
      case 'going':
        return refetchGoing;
      case 'liked':
        return refetchLiked;
      case 'passed':
        return refetchPassed;
      case 'organized':
        return refetchOrganized;
      default:
        return refetchGoing;
    }
  };

  const getCurrentRefetching = (): boolean => {
    switch (activeTab) {
      case 'going':
        return goingRefetching;
      case 'liked':
        return likedRefetching;
      case 'passed':
        return passedRefetching;
      case 'organized':
        return organizedRefetching;
      default:
        return false;
    }
  };

  const getEmptyMessage = (): string => {
    switch (activeTab) {
      case 'going':
        return "You haven't marked any events as going yet. Explore events to find ones you'd like to attend!";
      case 'liked':
        return "You haven't liked any events yet. Browse events and like the ones that interest you!";
      case 'passed':
        return "You haven't passed any events yet. Events you pass on will appear here.";
      case 'organized':
        return "You haven't created any events yet. Start organizing events in your community!";
      default:
        return '';
    }
  };

  const interactMutation = useMutation({
    mutationFn: ({ eventId, type }: { eventId: string; type: 'going' | 'like' | 'pass' }) =>
      eventsApi.interactWithEvent(eventId, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-events'] });
    },
  });

  const createConversationMutation = useMutation({
    mutationFn: ({ organizerId, eventId, organizerName }: { organizerId: string; eventId: string; organizerName: string }) =>
      messagingApi.createConversation({ otherUserId: organizerId, eventId }).then(conv => ({ conv, organizerName })),
    onSuccess: ({ conv, organizerName }) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      navigation.navigate('Chat' as never, { 
        conversationId: conv.id,
        otherUserName: organizerName 
      } as never);
    },
  });

  const renderEventCard = ({ item }: { item: EventWithDetails }) => {
    const isPastEvent = new Date(item.date) < new Date();
    const isOrganizedTab = activeTab === 'organized';
    const isGoing = item.userInteraction?.type === 'going';
    const isLiked = item.userInteraction?.type === 'like';
    const isPassed = item.userInteraction?.type === 'pass';
    
    // Parse event date and time correctly
    const dateOnly = item.date.split('T')[0]; // Get YYYY-MM-DD from ISO string
    const eventDateTime = new Date(`${dateOnly}T${item.time}:00`); // Combine date with event time
    const hasEventStarted = new Date() >= eventDateTime;
    
    // Check if event started at least 8 hours ago for rating
    const eightHoursAfterEventStart = new Date(eventDateTime.getTime() + (8 * 60 * 60 * 1000));
    const canRate = isGoing && new Date() >= eightHoursAfterEventStart;

    return (
      <View style={styles.eventCard}>
        <TouchableOpacity
          style={[isPastEvent && styles.pastEventCard]}
          onPress={() => {
            if (isOrganizedTab) {
              (navigation as any).navigate('EditEvent', { eventId: item.id });
            } else {
              (navigation as any).navigate('EventDetail', { eventId: item.id });
            }
          }}
        >
        <View style={styles.eventHeader}>
          <Text style={styles.eventTitle} numberOfLines={2}>
            {item.title}
          </Text>
          {item.organizer && !isOrganizedTab && (
            <Text style={styles.organizerText}>
              By {item.organizer.firstName || ''} {item.organizer.lastName || ''}
            </Text>
          )}
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
                Capacity: {item.capacity}
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

        {!isOrganizedTab && (
          <>
            {!hasEventStarted ? (
              // Before event starts: Show Going/Like/Pass + Message (if going)
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, isGoing && styles.actionBtnGoing]}
                  onPress={(e) => {
                    e.stopPropagation();
                    interactMutation.mutate({ eventId: item.id, type: 'going' });
                  }}
                  disabled={interactMutation.isPending}
                >
                  <Text style={[styles.actionBtnText, isGoing && styles.actionBtnTextActive]}>
                    Going
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, isLiked && styles.actionBtnLike]}
                  onPress={(e) => {
                    e.stopPropagation();
                    interactMutation.mutate({ eventId: item.id, type: 'like' });
                  }}
                  disabled={interactMutation.isPending}
                >
                  <Text style={[styles.actionBtnText, isLiked && styles.actionBtnTextActive]}>
                    Like ❤️
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    interactMutation.mutate({ eventId: item.id, type: 'pass' });
                  }}
                  disabled={interactMutation.isPending}
                >
                  <Text style={styles.actionBtnText}>Pass</Text>
                </TouchableOpacity>

                {isGoing && (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      const organizerName = item.organizer ? 
                        `${item.organizer.firstName || ''} ${item.organizer.lastName || ''}`.trim() || 'Organizer' 
                        : 'Organizer';
                      createConversationMutation.mutate({ 
                        organizerId: item.organizerId, 
                        eventId: item.id,
                        organizerName 
                      });
                    }}
                    disabled={createConversationMutation.isPending}
                  >
                    <Text style={styles.actionBtnText}>Message</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              // After event starts
              <>
                {isGoing ? (
                  // Going: Show Message + Rate
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        const organizerName = item.organizer ? 
                          `${item.organizer.firstName || ''} ${item.organizer.lastName || ''}`.trim() || 'Organizer' 
                          : 'Organizer';
                        createConversationMutation.mutate({ 
                          organizerId: item.organizerId, 
                          eventId: item.id,
                          organizerName 
                        });
                      }}
                      disabled={createConversationMutation.isPending}
                    >
                      <Text style={styles.actionBtnText}>Message</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.actionBtn, 
                        canRate && styles.actionBtnRate,
                        !canRate && styles.actionBtnDisabled
                      ]}
                      onPress={(e) => {
                        e.stopPropagation();
                        if (canRate) {
                          (navigation as any).navigate('EventDetail', { eventId: item.id });
                        }
                      }}
                      disabled={!canRate}
                    >
                      <Text style={[styles.actionBtnText, !canRate && styles.actionBtnTextDisabled]}>
                        {canRate ? '⭐ Rate' : '⭐ Rate (8h)'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  // Liked or Passed: Show status badge
                  <View style={styles.statusBadgeContainer}>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusBadgeText}>
                        {isLiked ? '❤️ You liked this' : '❌ You passed on this'}
                      </Text>
                    </View>
                  </View>
                )}
              </>
            )}
          </>
        )}
      </View>
    );
  };

  const renderContent = () => {
    const events = getCurrentEvents();
    const isLoading = getCurrentLoading();
    const refetch = getCurrentRefetch();
    const isRefetching = getCurrentRefetching();

    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      );
    }

    if (events.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Calendar size={64} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>No Events Found</Text>
          <Text style={styles.emptyText}>{getEmptyMessage()}</Text>
          {activeTab === 'organized' && (
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => (navigation as any).navigate('CreateEvent')}
            >
              <Text style={styles.emptyButtonText}>Create Event</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <FlatList
        data={events}
        renderItem={renderEventCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#007AFF"
          />
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Events</Text>
        {user?.role === 'organizer' && (
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => (navigation as any).navigate('CreateEvent')}
          >
            <Plus size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'going' && styles.activeTab]}
          onPress={() => setActiveTab('going')}
        >
          <Text style={[styles.tabText, activeTab === 'going' && styles.activeTabText]}>
            Going
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'liked' && styles.activeTab]}
          onPress={() => setActiveTab('liked')}
        >
          <Text style={[styles.tabText, activeTab === 'liked' && styles.activeTabText]}>
            Liked
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'passed' && styles.activeTab]}
          onPress={() => setActiveTab('passed')}
        >
          <Text style={[styles.tabText, activeTab === 'passed' && styles.activeTabText]}>
            Passed
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'organized' && styles.activeTab]}
          onPress={() => setActiveTab('organized')}
        >
          <Text style={[styles.tabText, activeTab === 'organized' && styles.activeTabText]}>
            My Events
          </Text>
        </TouchableOpacity>
      </View>

      {renderContent()}
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
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 0,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  pastEventCard: {
    opacity: 0.6,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    padding: 16,
    paddingBottom: 0,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
    marginRight: 8,
  },
  organizerText: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 4,
    fontStyle: 'italic',
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
    paddingHorizontal: 16,
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
    marginHorizontal: 16,
    marginBottom: 12,
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
    backgroundColor: '#007AFF',
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
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionBtnGoing: {
    backgroundColor: '#ff6b6b',
    borderColor: '#ff6b6b',
  },
  actionBtnLike: {
    backgroundColor: '#fff',
    borderColor: '#e2e8f0',
  },
  actionBtnRate: {
    backgroundColor: '#fef3c7',
    borderColor: '#fef3c7',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  actionBtnTextActive: {
    color: '#fff',
  },
  actionBtnDisabled: {
    backgroundColor: '#e2e8f0',
    borderColor: '#cbd5e1',
  },
  actionBtnTextDisabled: {
    color: '#64748b',
  },
  statusBadgeContainer: {
    padding: 12,
    paddingTop: 0,
  },
  statusBadge: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusBadgeText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
});
