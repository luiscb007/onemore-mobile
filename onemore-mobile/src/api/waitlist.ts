import { apiClient } from './client';

export interface WaitlistStatus {
  isOnWaitlist: boolean;
  position?: number;
  totalWaitlisted?: number;
}

export const waitlistApi = {
  join: async (eventId: string): Promise<void> => {
    await apiClient.post(`/events/${eventId}/waitlist/join`);
  },

  leave: async (eventId: string): Promise<void> => {
    await apiClient.delete(`/events/${eventId}/waitlist/leave`);
  },

  getStatus: async (eventId: string): Promise<WaitlistStatus> => {
    const response = await apiClient.get(`/events/${eventId}/waitlist/status`);
    return response.data;
  },
};
