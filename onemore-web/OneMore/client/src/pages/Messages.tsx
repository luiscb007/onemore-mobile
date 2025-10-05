import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MessageCircle, ArrowLeft, Send, Users, Trash2 } from 'lucide-react';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BottomNavigation } from '@/components/BottomNavigation';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { Conversation, Message, Event, User } from '@shared/schema';

type ConversationWithDetails = Conversation & {
  event?: Event;
  otherUser?: User;
  unreadCount?: number;
};

export default function Messages() {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<ConversationWithDetails[]>({
    queryKey: ['/api/conversations'],
    enabled: !!user,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ['/api/conversations', selectedConversation, 'messages'],
    enabled: !!selectedConversation,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
      return apiRequest('POST', '/api/messages', { conversationId, content });
    },
    onSuccess: () => {
      setMessageInput('');
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', selectedConversation, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/unread-count'] });
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      return apiRequest('PUT', `/api/conversations/${conversationId}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/unread-count'] });
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      return apiRequest('DELETE', `/api/messages/${messageId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', selectedConversation, 'messages'] });
    },
    onError: (error) => {
      console.error('Failed to delete message:', error);
    },
  });

  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      return apiRequest('DELETE', `/api/conversations/${conversationId}`, {});
    },
    onSuccess: () => {
      setSelectedConversation(null);
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/unread-count'] });
    },
    onError: (error) => {
      console.error('Failed to delete conversation:', error);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selectedConversation && user) {
      markAsReadMutation.mutate(selectedConversation);
    }
  }, [selectedConversation, user]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation) return;
    
    sendMessageMutation.mutate({
      conversationId: selectedConversation,
      content: messageInput.trim(),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderConversationsList = () => {
    if (conversationsLoading) {
      return (
        <div className="p-8 text-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading conversations...</p>
        </div>
      );
    }

    if (conversations.length === 0) {
      return (
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">No conversations yet</h3>
          <p className="text-muted-foreground text-sm">
            Start a conversation by messaging an event organizer when you attend their events.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-2 p-4">
        {conversations.map((conversation) => (
          <Card 
            key={conversation.id} 
            className="cursor-pointer hover:bg-muted/50 transition-colors group"
            onClick={() => setSelectedConversation(conversation.id)}
            data-testid={`conversation-${conversation.id}`}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center relative">
                  <Users className="w-5 h-5 text-primary-foreground" />
                  {conversation.unreadCount && conversation.unreadCount > 0 && (
                    <div 
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                      data-testid={`badge-unread-${conversation.id}`}
                    >
                      <span className="text-xs font-semibold text-white">
                        {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground truncate">
                    {conversation.event?.title || 'Event Conversation'}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {conversation.otherUser?.firstName && conversation.otherUser?.lastName
                      ? `${conversation.otherUser.firstName} ${conversation.otherUser.lastName}`
                      : conversation.otherUser?.email || 'Unknown User'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-muted-foreground">
                    {conversation.lastMessageAt && 
                      new Date(conversation.lastMessageAt).toLocaleDateString()
                    }
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Delete this conversation? This will remove it from your messages.')) {
                        deleteConversationMutation.mutate(conversation.id);
                      }
                    }}
                    className="p-2 rounded hover:bg-destructive/10 transition-opacity opacity-0 group-hover:opacity-100 text-destructive"
                    data-testid={`button-delete-conversation-list-${conversation.id}`}
                    disabled={deleteConversationMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderChatInterface = () => {
    const conversation = conversations.find(c => c.id === selectedConversation);
    if (!conversation) return null;

    return (
      <div className="flex flex-col h-full">
        {/* Chat Header */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between px-4 py-3">
            <button 
              onClick={() => setSelectedConversation(null)}
              className="touch-target p-2 -ml-2" 
              data-testid="button-back-to-conversations"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 text-center">
              <h1 className="text-lg font-semibold text-foreground truncate">
                {conversation.event?.title || 'Event Chat'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {conversation.otherUser?.firstName && conversation.otherUser?.lastName
                  ? `${conversation.otherUser.firstName} ${conversation.otherUser.lastName}`
                  : conversation.otherUser?.email || 'Unknown User'}
              </p>
            </div>
            <button
              onClick={() => {
                if (window.confirm('Delete this conversation? This will remove it from your messages.')) {
                  deleteConversationMutation.mutate(conversation.id);
                }
              }}
              className="touch-target p-2 -mr-2 text-destructive hover:bg-destructive/10 rounded"
              data-testid={`button-delete-conversation-header-${conversation.id}`}
              disabled={deleteConversationMutation.isPending}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-4">
          {messagesLoading ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const currentUserId = user?.id;
              const isCurrentUser = currentUserId && message.senderId === currentUserId;
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} group`}
                  data-testid={`message-${message.id}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg relative ${
                      isCurrentUser
                        ? 'bg-primary text-primary-foreground ml-4'
                        : 'bg-muted text-foreground mr-4'
                    }`}
                  >
                    <p className="whitespace-pre-wrap pr-8">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.createdAt && new Date(message.createdAt).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                    {isCurrentUser && (
                      <button
                        onClick={() => {
                          if (window.confirm('Delete this message?')) {
                            deleteMessageMutation.mutate(message.id);
                          }
                        }}
                        className="absolute top-2 right-2 p-1 rounded hover:bg-black/10 transition-opacity opacity-0 group-hover:opacity-100"
                        data-testid={`button-delete-message-${message.id}`}
                        disabled={deleteMessageMutation.isPending}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t border-border p-4 bg-background">
          <div className="flex items-center space-x-2">
            <Input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1"
              data-testid="input-message"
              disabled={sendMessageMutation.isPending}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!messageInput.trim() || sendMessageMutation.isPending}
              size="icon"
              data-testid="button-send-message"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen flex flex-col">
      {selectedConversation ? (
        renderChatInterface()
      ) : (
        <>
          {/* Header */}
          <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
            <div className="flex items-center justify-between px-4 py-3">
              <Link href="/">
                <button className="touch-target p-2 -ml-2" data-testid="button-back">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </Link>
              <h1 className="text-lg font-semibold text-foreground">Messages</h1>
              <div className="w-9" />
            </div>
          </header>

          {/* Conversations List */}
          <main className="flex-1 pb-20">
            {renderConversationsList()}
          </main>

          {/* Bottom Navigation */}
          <BottomNavigation />
        </>
      )}
    </div>
  );
}