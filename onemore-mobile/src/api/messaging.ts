import { apiClient } from './client';

export interface Conversation {
  id: string;
  attendeeId: string;
  organizerId: string;
  eventId: string | null;
  lastMessageAt: Date | null;
  createdAt: Date;
  otherUser?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  };
  event?: {
    id: string;
    title: string;
  } | null;
  unreadCount?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  read: boolean;
  createdAt: Date;
}

export const messagingApi = {
  getConversations: async (): Promise<Conversation[]> => {
    const response = await apiClient.get('/conversations');
    return response.data;
  },

  createConversation: async (data: {
    otherUserId: string;
    eventId?: string | null;
  }): Promise<Conversation> => {
    const response = await apiClient.post('/conversations', data);
    return response.data;
  },

  getMessages: async (conversationId: string): Promise<Message[]> => {
    const response = await apiClient.get(`/conversations/${conversationId}/messages`);
    return response.data;
  },

  sendMessage: async (data: {
    conversationId: string;
    content: string;
  }): Promise<Message> => {
    const response = await apiClient.post('/messages', data);
    return response.data;
  },

  markAsRead: async (conversationId: string): Promise<void> => {
    await apiClient.put(`/conversations/${conversationId}/read`);
  },

  deleteMessage: async (messageId: string): Promise<void> => {
    await apiClient.delete(`/messages/${messageId}`);
  },

  deleteConversation: async (conversationId: string): Promise<void> => {
    await apiClient.delete(`/conversations/${conversationId}`);
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get('/messages/unread-count');
    return response.data.count;
  },
};
