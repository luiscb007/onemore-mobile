import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Linking,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calendar, MapPin, Users, Star, Heart, ThumbsUp, ThumbsDown, MessageCircle, User } from 'lucide-react-native';
import { eventsApi } from '../api/events';
import { waitlistApi } from '../api/waitlist';
import { ratingsApi } from '../api/ratings';
import { messagingApi } from '../api/messaging';
import { useAuth } from '../contexts/AuthContext';

export const EventDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { eventId } = route.params as { eventId: string };

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventsApi.getEventById(eventId),
  });

  const { data: waitlistStatus } = useQuery({
    queryKey: ['waitlist', eventId],
    queryFn: () => waitlistApi.getStatus(eventId),
    enabled: !!event && event.capacity != null && (event.interactionCounts?.going || 0) >= event.capacity,
  });

  const { data: ratingEligibility } = useQuery({
    queryKey: ['ratingEligibility', eventId],
    queryFn: () => ratingsApi.checkEligibility(eventId),
  });

  const { data: organizerRating } = useQuery({
    queryKey: ['organizerRating', event?.organizerId],
    queryFn: () => ratingsApi.getOrganizerRating(event!.organizerId),
    enabled: !!event?.organizerId,
  });

  const interactMutation = useMutation({
    mutationFn: (interactionType: 'going' | 'like' | 'pass') =>
      eventsApi.interactWithEvent(eventId, interactionType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const joinWaitlistMutation = useMutation({
    mutationFn: () => waitlistApi.join(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist', eventId] });
      Alert.alert('Success', 'You have been added to the waitlist!');
    },
  });

  const leaveWaitlistMutation = useMutation({
    mutationFn: () => waitlistApi.leave(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist', eventId] });
      Alert.alert('Success', 'You have been removed from the waitlist.');
    },
  });

  const submitRatingMutation = useMutation({
    mutationFn: () => ratingsApi.submitRating(eventId, rating, comment || undefined),
    onSuccess: () => {
      setShowRatingModal(false);
      queryClient.invalidateQueries({ queryKey: ['organizerRating'] });
      Alert.alert('Success', 'Thank you for your rating!');
    },
  });

  const createConversationMutation = useMutation({
    mutationFn: () => messagingApi.createConversation({
      otherUserId: event!.organizerId,
      eventId: eventId,
    }),
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      const organizerName = event?.organizer ? 
        `${event.organizer.firstName || ''} ${event.organizer.lastName || ''}`.trim() || 'Organizer' 
        : 'Organizer';
      navigation.navigate('Chat' as never, { 
        conversationId: conversation.id,
        otherUserName: organizerName 
      } as never);
    },
    onError: () => {
      Alert.alert('Error', 'Failed to start conversation. Please try again.');
    },
  });

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#ef4444" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Event not found</Text>
      </View>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const openInMaps = () => {
    if (!event?.latitude || !event?.longitude) return;

    const scheme = Platform.select({
      ios: `maps:0,0?q=${event.latitude},${event.longitude}`,
      android: `geo:0,0?q=${event.latitude},${event.longitude}`,
    });
    
    const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`;

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

  const isFull = event.capacity != null && (event.interactionCounts?.going || 0) >= event.capacity;
  const canJoinWaitlist = isFull && !waitlistStatus?.isOnWaitlist;
  const isOnWaitlist = waitlistStatus?.isOnWaitlist;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Details</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.titleCard}>
          <Text style={styles.title}>{event.title}</Text>
          {event.description && (
            <Text style={styles.description}>{event.description}</Text>
          )}
        </View>

        <View style={styles.organizerCard}>
          <View style={styles.organizerHeader}>
            <View style={styles.organizerIcon}>
              <User size={20} color="#ef4444" />
            </View>
            <View style={styles.organizerInfo}>
              <Text style={styles.organizerLabel}>Organized by</Text>
              <Text style={styles.organizerName}>
                {event.organizer ? 
                  `${event.organizer.firstName || ''} ${event.organizer.lastName || ''}`.trim() || 'Organizer' 
                  : 'Organizer'}
              </Text>
            </View>
          </View>
          {organizerRating && organizerRating.totalRatings > 0 && (
            <View style={styles.ratingRow}>
              <View style={styles.starsDisplay}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={16}
                    color={star <= Math.round(organizerRating.averageRating) ? '#f59e0b' : '#cbd5e1'}
                    fill={star <= Math.round(organizerRating.averageRating) ? '#f59e0b' : 'transparent'}
                  />
                ))}
              </View>
              <Text style={styles.ratingText}>
                {organizerRating.averageRating.toFixed(1)} ({organizerRating.totalRatings} {organizerRating.totalRatings === 1 ? 'rating' : 'ratings'})
              </Text>
            </View>
          )}
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.infoRow}>
            <Calendar size={20} color="#64748b" />
            <Text style={styles.infoText}>{formatDate(event.date)}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Users size={20} color="#64748b" />
            <Text style={styles.infoText}>
              {event.capacity != null 
                ? `${event.interactionCounts?.going || 0} / ${event.capacity} attending${isFull ? ' (FULL)' : ''}`
                : `${event.interactionCounts?.going || 0} attending`
              }
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.infoRow} 
            onPress={openInMaps}
            activeOpacity={0.7}
          >
            <MapPin size={20} color="#3b82f6" />
            <Text style={styles.addressLink}>{event.address}</Text>
          </TouchableOpacity>
        </View>

        {canJoinWaitlist && (
          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={styles.waitlistButton}
              onPress={() => joinWaitlistMutation.mutate()}
              disabled={joinWaitlistMutation.isPending}
            >
              <Text style={styles.waitlistButtonText}>Join Waitlist</Text>
            </TouchableOpacity>
          </View>
        )}

        {isOnWaitlist && (
          <View style={styles.actionsSection}>
            <View style={styles.waitlistInfo}>
              <Text style={styles.waitlistText}>
                You're on the waitlist (Position: {waitlistStatus.position})
              </Text>
              <TouchableOpacity
                style={styles.leaveWaitlistButton}
                onPress={() => leaveWaitlistMutation.mutate()}
                disabled={leaveWaitlistMutation.isPending}
              >
                <Text style={styles.leaveWaitlistButtonText}>Leave Waitlist</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {ratingEligibility?.canRate && (
          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={styles.rateButton}
              onPress={() => setShowRatingModal(true)}
            >
              <Star size={20} color="#f59e0b" />
              <Text style={styles.rateButtonText}>Rate This Event</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showRatingModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRatingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rate the Organizer</Text>
            
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  style={styles.starButton}
                >
                  <Star
                    size={36}
                    color={star <= rating ? '#f59e0b' : '#cbd5e1'}
                    fill={star <= rating ? '#f59e0b' : 'transparent'}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment (optional)"
              placeholderTextColor="#94a3b8"
              value={comment}
              onChangeText={setComment}
              multiline
              maxLength={500}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowRatingModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalSubmitButton}
                onPress={() => submitRatingMutation.mutate()}
                disabled={submitRatingMutation.isPending}
              >
                <Text style={styles.modalSubmitButtonText}>
                  {submitRatingMutation.isPending ? 'Submitting...' : 'Submit'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  titleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 22,
  },
  organizerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  organizerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  organizerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  organizerInfo: {
    flex: 1,
  },
  organizerLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  organizerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  starsDisplay: {
    flexDirection: 'row',
    gap: 4,
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  infoText: {
    fontSize: 15,
    color: '#475569',
    flex: 1,
  },
  addressLink: {
    fontSize: 15,
    color: '#3b82f6',
    textDecorationLine: 'underline',
    flex: 1,
  },
  actionsSection: {
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  actionButtonActive: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  actionButtonTextActive: {
    color: '#fff',
  },
  waitlistButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  waitlistButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  waitlistInfo: {
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  waitlistText: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 8,
  },
  leaveWaitlistButton: {
    alignSelf: 'flex-start',
  },
  leaveWaitlistButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f59e0b',
    gap: 8,
  },
  rateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f59e0b',
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
    gap: 8,
    marginTop: 12,
  },
  messageButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  errorText: {
    fontSize: 16,
    color: '#64748b',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 20,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  starButton: {
    padding: 4,
  },
  commentInput: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
    color: '#1e293b',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  modalSubmitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    alignItems: 'center',
  },
  modalSubmitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
