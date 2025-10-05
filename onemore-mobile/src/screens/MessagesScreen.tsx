import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { MessageCircle } from 'lucide-react-native';
import { messagingApi, type Conversation } from '../api/messaging';
import { useAuth } from '../contexts/AuthContext';

export const MessagesScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const { data: conversations = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['conversations'],
    queryFn: messagingApi.getConversations,
    enabled: !!user,
    refetchInterval: 5000,
  });

  const formatTime = (date: Date | null) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const otherUserName = item.otherUser
      ? `${item.otherUser.firstName || ''} ${item.otherUser.lastName || ''}`.trim() || 'User'
      : 'User';

    return (
      <TouchableOpacity
        style={styles.conversationCard}
        onPress={() => {
          navigation.navigate('Chat' as never, { conversationId: item.id, otherUserName } as never);
        }}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{otherUserName.charAt(0).toUpperCase()}</Text>
        </View>
        
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.userName}>{otherUserName}</Text>
            {item.lastMessageAt && (
              <Text style={styles.timeText}>{formatTime(item.lastMessageAt)}</Text>
            )}
          </View>
          
          {item.event && (
            <Text style={styles.eventText} numberOfLines={1}>
              Re: {item.event.title}
            </Text>
          )}
          
          {item.unreadCount !== undefined && item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
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
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MessageCircle size={64} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>No Messages</Text>
          <Text style={styles.emptyText}>
            Start a conversation by interacting with events!
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
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
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  conversationCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  timeText: {
    fontSize: 12,
    color: '#64748b',
  },
  eventText: {
    fontSize: 14,
    color: '#64748b',
  },
  unreadBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  unreadText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
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
});
