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
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calendar, MapPin, Users, Star, Heart, ThumbsUp, ThumbsDown } from 'lucide-react-native';
import { eventsApi, type Event } from '../api/events';
import { waitlistApi } from '../api/waitlist';
import { ratingsApi } from '../api/ratings';
import { MapPreview } from '../components/MapPreview';
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
    enabled: !!event && event.attendeesCount >= event.maxAttendees,
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

  const isFull = event.attendeesCount >= event.maxAttendees;
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
        <Text style={styles.title}>{event.title}</Text>
        
        {event.description && (
          <Text style={styles.description}>{event.description}</Text>
        )}

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Calendar size={20} color="#64748b" />
            <Text style={styles.infoText}>{formatDate(event.startTime)}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Users size={20} color="#64748b" />
            <Text style={styles.infoText}>
              {event.attendeesCount} / {event.maxAttendees} attending
              {isFull && ' (FULL)'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <MapPin size={20} color="#64748b" />
            <Text style={styles.infoText}>{event.location}</Text>
          </View>

          {organizerRating && organizerRating.totalRatings > 0 && (
            <View style={styles.infoRow}>
              <Star size={20} color="#f59e0b" />
              <Text style={styles.infoText}>
                Organizer: {organizerRating.averageRating.toFixed(1)} ({organizerRating.totalRatings} ratings)
              </Text>
            </View>
          )}
        </View>

        {event.latitude && event.longitude && (
          <View style={styles.mapSection}>
            <MapPreview
              latitude={event.latitude}
              longitude={event.longitude}
              address={event.location}
            />
          </View>
        )}

        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, event.userInteraction === 'going' && styles.actionButtonActive]}
              onPress={() => interactMutation.mutate('going')}
              disabled={interactMutation.isPending}
            >
              <ThumbsUp size={20} color={event.userInteraction === 'going' ? '#fff' : '#64748b'} />
              <Text style={[styles.actionButtonText, event.userInteraction === 'going' && styles.actionButtonTextActive]}>
                Going
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, event.userInteraction === 'like' && styles.actionButtonActive]}
              onPress={() => interactMutation.mutate('like')}
              disabled={interactMutation.isPending}
            >
              <Heart size={20} color={event.userInteraction === 'like' ? '#fff' : '#64748b'} />
              <Text style={[styles.actionButtonText, event.userInteraction === 'like' && styles.actionButtonTextActive]}>
                Interested
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, event.userInteraction === 'pass' && styles.actionButtonActive]}
              onPress={() => interactMutation.mutate('pass')}
              disabled={interactMutation.isPending}
            >
              <ThumbsDown size={20} color={event.userInteraction === 'pass' ? '#fff' : '#64748b'} />
              <Text style={[styles.actionButtonText, event.userInteraction === 'pass' && styles.actionButtonTextActive]}>
                Pass
              </Text>
            </TouchableOpacity>
          </View>

          {canJoinWaitlist && (
            <TouchableOpacity
              style={styles.waitlistButton}
              onPress={() => joinWaitlistMutation.mutate()}
              disabled={joinWaitlistMutation.isPending}
            >
              <Text style={styles.waitlistButtonText}>Join Waitlist</Text>
            </TouchableOpacity>
          )}

          {isOnWaitlist && (
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
          )}

          {ratingEligibility?.canRate && (
            <TouchableOpacity
              style={styles.rateButton}
              onPress={() => setShowRatingModal(true)}
            >
              <Star size={20} color="#f59e0b" />
              <Text style={styles.rateButtonText}>Rate This Event</Text>
            </TouchableOpacity>
          )}
        </View>
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
    backgroundColor: '#fff',
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
    marginBottom: 20,
  },
  infoSection: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#475569',
  },
  mapSection: {
    marginBottom: 24,
  },
  actionsSection: {
    marginTop: 8,
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
