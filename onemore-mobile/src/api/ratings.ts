import { apiClient } from './client';

export interface OrganizerRating {
  averageRating: number;
  totalRatings: number;
}

export interface RatingEligibility {
  canRate: boolean;
  reason?: string;
}

export interface UserRating {
  rating: number;
  comment?: string | null;
}

export const ratingsApi = {
  submitRating: async (
    eventId: string,
    rating: number,
    comment?: string
  ): Promise<void> => {
    await apiClient.post(`/events/${eventId}/rating`, {
      rating,
      comment,
    });
  },

  getOrganizerRating: async (organizerId: string): Promise<OrganizerRating> => {
    const response = await apiClient.get(`/organizers/${organizerId}/rating`);
    return response.data;
  },

  getUserRating: async (eventId: string): Promise<UserRating | null> => {
    const response = await apiClient.get(`/events/${eventId}/rating/me`);
    return response.data;
  },

  checkEligibility: async (eventId: string): Promise<RatingEligibility> => {
    const response = await apiClient.get(`/events/${eventId}/rating/eligibility`);
    return response.data;
  },
};
