import { apiClient } from './client';
import type { EventWithDetails, Event, EventInteraction } from '../types';

export const eventsApi = {
  getEvents: async (params?: {
    category?: string;
    userId?: string;
    userLat?: number;
    userLng?: number;
    hidePast?: boolean;
    userRadius?: number;
    search?: string;
  }): Promise<EventWithDetails[]> => {
    const response = await apiClient.get('/events', { params });
    return response.data;
  },

  getEventById: async (id: string): Promise<EventWithDetails> => {
    const response = await apiClient.get(`/events/${id}`);
    return response.data;
  },

  createEvent: async (eventData: Partial<Event>): Promise<Event> => {
    const response = await apiClient.post('/events', eventData);
    return response.data;
  },

  updateEvent: async (id: string, eventData: Partial<Event>): Promise<Event> => {
    const response = await apiClient.put(`/events/${id}`, eventData);
    return response.data;
  },

  deleteEvent: async (id: string): Promise<void> => {
    await apiClient.delete(`/events/${id}`);
  },

  interactWithEvent: async (
    eventId: string,
    type: 'going' | 'like' | 'pass'
  ): Promise<EventInteraction> => {
    const response = await apiClient.post(`/events/${eventId}/interact`, { type });
    return response.data;
  },

  getOrganizerEvents: async (organizerId: string): Promise<EventWithDetails[]> => {
    const response = await apiClient.get(`/events/organizer/${organizerId}`);
    return response.data;
  },

  getUserEvents: async (type: 'going' | 'like' | 'pass'): Promise<EventWithDetails[]> => {
    const response = await apiClient.get(`/user/events/${type}`);
    return response.data;
  },

  rateEvent: async (
    eventId: string,
    rating: number,
    comment?: string
  ): Promise<{ rating: any; organizerSummary: any }> => {
    const response = await apiClient.post(`/api/events/${eventId}/rating`, { 
      rating, 
      comment: comment || null 
    });
    return response.data;
  },

  getUserEventRating: async (eventId: string): Promise<any> => {
    const response = await apiClient.get(`/api/events/${eventId}/rating/me`);
    return response.data;
  },
};
