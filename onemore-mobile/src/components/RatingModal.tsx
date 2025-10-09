import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Star } from 'lucide-react-native';

interface RatingModalProps {
  visible: boolean;
  eventTitle: string;
  organizerName: string;
  existingRating?: number | null;
  onClose: () => void;
  onSubmit: (rating: number) => Promise<void>;
}

export default function RatingModal({
  visible,
  eventTitle,
  organizerName,
  existingRating,
  onClose,
  onSubmit,
}: RatingModalProps) {
  const [rating, setRating] = useState(existingRating || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasExistingRating = existingRating !== null && existingRating !== undefined;

  // Update rating when existingRating changes or modal becomes visible
  useEffect(() => {
    if (visible && existingRating) {
      setRating(existingRating);
    } else if (visible && !existingRating) {
      setRating(0);
    }
  }, [visible, existingRating]);

  const handleSubmit = async () => {
    if (rating === 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(rating);
      setRating(0);
      onClose();
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={handleClose}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalContent}>
              <Text style={styles.title}>
                {hasExistingRating ? 'Update Your Rating' : 'Rate Event'}
              </Text>
              <Text style={styles.eventTitle} numberOfLines={2}>
                {eventTitle}
              </Text>
              <Text style={styles.organizerName}>by {organizerName}</Text>
              
              {hasExistingRating && (
                <View style={styles.alreadyRatedBadge}>
                  <Text style={styles.alreadyRatedText}>
                    You've already rated this event
                  </Text>
                </View>
              )}

              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    style={styles.starButton}
                  >
                    <Star
                      size={40}
                      color={star <= rating ? '#FFD700' : '#D1D5DB'}
                      fill={star <= rating ? '#FFD700' : 'transparent'}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {rating > 0 && (
                <Text style={styles.ratingText}>
                  {rating} {rating === 1 ? 'Star' : 'Stars'}
                </Text>
              )}

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleClose}
                  disabled={isSubmitting}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.submitButton,
                    rating === 0 && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={rating === 0 || isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {hasExistingRating ? 'Update Rating' : 'Submit Rating'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouchable: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  eventTitle: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 4,
    textAlign: 'center',
  },
  organizerName: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  alreadyRatedBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
    alignSelf: 'center',
  },
  alreadyRatedText: {
    fontSize: 13,
    color: '#1E40AF',
    fontWeight: '600',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 32,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
