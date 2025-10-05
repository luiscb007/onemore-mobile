import { Calendar, MapPin, DollarSign, Edit, MessageCircle, Star, Clock, Ban } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { isUnauthorizedError } from '@/lib/authUtils';
import { formatPrice } from '@/lib/currencyUtils';
import { RatingDialog } from '@/components/RatingDialog';
import { EventDetailsDialog } from '@/components/EventDetailsDialog';
import { MapDialog } from '@/components/MapDialog';
import type { EventWithDetails } from '@shared/schema';

interface EventCardProps {
  event: EventWithDetails;
  onInteraction?: (eventId: string, type: string) => void;
  showMessageAndRate?: boolean; // Controls visibility of Message and Rate buttons
}

export function EventCard({ event, onInteraction, showMessageAndRate = false }: EventCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showMapDialog, setShowMapDialog] = useState(false);
  
  // Check if current user is the organizer
  const isOwnEvent = user?.id === event.organizerId;

  const interactionMutation = useMutation({
    mutationFn: async ({ eventId, type }: { eventId: string; type: string }) => {
      await apiRequest('POST', `/api/events/${eventId}/interact`, { type });
    },
    onSuccess: (_, { type }) => {
      // Invalidate all event queries to ensure discover page updates
      queryClient.invalidateQueries({ 
        queryKey: ['/api/events'],
        exact: false,
        refetchType: 'active'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/events'] });
      
      const messages = {
        going: 'Added to Going list! ✓',
        like: 'Added to Like list! ❤️',
        pass: 'Event passed'
      };
      
      toast({
        title: "Success",
        description: messages[type as keyof typeof messages] || 'Action completed',
      });

      if (onInteraction) {
        onInteraction(event.id, type);
      }
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update event interaction",
        variant: "destructive",
      });
    },
  });

  const messageOrganizerMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/conversations', {
        eventId: event.id,
        organizerId: event.organizerId,
        attendeeId: user?.id
      });
    },
    onSuccess: (conversation) => {
      // Navigate to Messages page and select this conversation
      setLocation('/messages');
      // Note: We'll need to handle conversation selection in the Messages component
      toast({
        title: "Success",
        description: "Conversation started with organizer",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive",
      });
    },
  });

  const handleInteraction = (type: string) => {
    interactionMutation.mutate({ eventId: event.id, type });
  };

  const handleMessageOrganizer = () => {
    messageOrganizerMutation.mutate();
  };

  const cancelEventMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', `/api/events/${event.id}/cancel`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/events'], 
        exact: false 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/events/organizer'], 
        exact: false 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/user/events'], 
        exact: false 
      });
      toast({
        title: "Event Cancelled",
        description: "Your event has been cancelled successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to cancel event",
        variant: "destructive",
      });
    },
  });

  const handleCancelEvent = () => {
    if (confirm("Are you sure you want to cancel this event? This action cannot be undone.")) {
      cancelEventMutation.mutate();
    }
  };

  const handleOpenMaps = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening details dialog
    setShowMapDialog(true);
  };

  const formatDate = (dateValue: string | Date) => {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const renderRatingBadge = () => {
    if (!event.organizerRating) return null;
    
    return (
      <div className="flex items-center space-x-1">
        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
        <span data-testid={`text-organizer-rating-${event.id}`}>
          {event.organizerRating.average.toFixed(1)}
        </span>
        <span className="text-muted-foreground">
          ({event.organizerRating.count})
        </span>
      </div>
    );
  };

  const renderDistance = () => {
    if (event.distance === undefined || event.distance === null) return null;
    
    return (
      <span className="text-xs text-muted-foreground" data-testid={`text-event-distance-${event.id}`}>
        📍 {event.distance.toFixed(1)} km
      </span>
    );
  };

  const getButtonStyle = (type: string) => {
    const isSelected = event.userInteraction?.type === type;
    const baseClasses = "flex-1 min-w-0 px-2 py-1 rounded-md text-[10px] font-medium touch-target transition-colors";
    
    if (type === 'going') {
      return `${baseClasses} ${isSelected 
        ? 'bg-primary text-primary-foreground' 
        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
      }`;
    } else if (type === 'like') {
      return `${baseClasses} ${isSelected 
        ? 'bg-primary text-primary-foreground' 
        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
      }`;
    } else {
      return `${baseClasses} bg-muted text-muted-foreground hover:bg-muted/80`;
    }
  };

  return (
    <div className="bg-card border-b border-border p-4 hover:bg-accent/50 transition-colors">
      <div className="flex space-x-3">
        {event.imageUrl && (
          <img 
            src={event.imageUrl}
            alt={event.title}
            className="w-20 h-20 rounded-lg object-cover flex-shrink-0 cursor-pointer"
            data-testid={`img-event-${event.id}`}
            onClick={() => setShowDetailsDialog(true)}
          />
        )}
        
        <div className="flex-1 min-w-0">
          <h3 
            className="text-sm font-semibold text-foreground truncate cursor-pointer hover:text-primary transition-colors leading-tight mb-1" 
            data-testid={`text-event-title-${event.id}`}
            onClick={() => setShowDetailsDialog(true)}
          >
            {event.title}
          </h3>
          <p 
            className="text-xs text-muted-foreground mb-2 line-clamp-2 cursor-pointer leading-snug" 
            data-testid={`text-event-description-${event.id}`}
            onClick={() => setShowDetailsDialog(true)}
          >
            {event.description.length > 60 
              ? `${event.description.substring(0, 60)}...` 
              : event.description
            }
          </p>
          
          <div 
            className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-muted-foreground mb-2 cursor-pointer"
            onClick={() => setShowDetailsDialog(true)}
          >
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3 flex-shrink-0" />
              <span data-testid={`text-event-date-${event.id}`} className="truncate">
                {formatDate(event.date)}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3 flex-shrink-0" />
              <span data-testid={`text-event-time-${event.id}`} className="truncate">
                {event.time}
              </span>
            </div>
            <div 
              className="flex items-center space-x-1 cursor-pointer hover:text-primary transition-colors"
              onClick={handleOpenMaps}
              data-testid={`button-open-maps-${event.id}`}
            >
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span data-testid={`text-event-location-${event.id}`} className="truncate">
                {event.address}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <DollarSign className="w-3 h-3 flex-shrink-0" />
              <span data-testid={`text-event-price-${event.id}`} className="truncate">
                {formatPrice(event.priceAmount, event.priceCurrencyCode)}
              </span>
            </div>
            {renderRatingBadge()}
            {renderDistance()}
          </div>
          
          <div className="flex flex-wrap items-center gap-1.5">
            {isOwnEvent ? (
              // Show Edit and Cancel buttons for user's own events
              <>
                {event.status === 'active' && (
                  <>
                    <button
                      data-testid={`button-edit-${event.id}`}
                      onClick={() => setLocation(`/edit-event/${event.id}`)}
                      className="flex items-center justify-center gap-1 flex-1 min-w-0 px-2 py-1 rounded-md text-[10px] font-medium bg-primary text-primary-foreground hover:bg-primary/80 transition-colors touch-target"
                    >
                      <Edit className="w-3 h-3" />
                      Edit
                    </button>
                    <button
                      data-testid={`button-cancel-${event.id}`}
                      onClick={handleCancelEvent}
                      disabled={cancelEventMutation.isPending}
                      className="flex items-center justify-center gap-1 flex-1 min-w-0 px-2 py-1 rounded-md text-[10px] font-medium bg-destructive text-destructive-foreground hover:bg-destructive/80 transition-colors touch-target"
                    >
                      <Ban className="w-3 h-3" />
                      Cancel
                    </button>
                  </>
                )}
                {event.status === 'cancelled' && (
                  <div className="flex-1 px-2 py-1 text-center text-[10px] font-medium text-muted-foreground bg-muted rounded-md">
                    Event Cancelled
                  </div>
                )}
              </>
            ) : (
              // Show interaction buttons for other users' events
              <>
                <button
                  data-testid={`button-going-${event.id}`}
                  onClick={() => handleInteraction('going')}
                  disabled={interactionMutation.isPending}
                  className={getButtonStyle('going')}
                >
                  Going ✓
                </button>
                <button
                  data-testid={`button-like-${event.id}`}
                  onClick={() => handleInteraction('like')}
                  disabled={interactionMutation.isPending}
                  className={getButtonStyle('like')}
                >
                  Like ❤️
                </button>
                <button
                  data-testid={`button-pass-${event.id}`}
                  onClick={() => handleInteraction('pass')}
                  disabled={interactionMutation.isPending}
                  className={getButtonStyle('pass')}
                >
                  Pass
                </button>
                {showMessageAndRate && (
                  <>
                    {event.userInteraction?.type === 'going' && (
                      <button
                        data-testid={`button-message-organizer-${event.id}`}
                        onClick={handleMessageOrganizer}
                        disabled={messageOrganizerMutation.isPending}
                        className="flex items-center justify-center gap-1 flex-1 min-w-0 px-2 py-1 rounded-md text-[10px] font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors touch-target"
                      >
                        <MessageCircle className="w-3 h-3" />
                        Message
                      </button>
                    )}
                    <button
                      data-testid={`button-rate-organizer-${event.id}`}
                      onClick={() => setShowRatingDialog(true)}
                      className="flex items-center justify-center gap-1 flex-1 min-w-0 px-2 py-1 rounded-md text-[10px] font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-100 dark:hover:bg-yellow-800 transition-colors touch-target"
                    >
                      <Star className="w-3 h-3" />
                      Rate
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      
      <RatingDialog
        eventId={event.id}
        organizerName={
          event.organizer.firstName && event.organizer.lastName
            ? `${event.organizer.firstName} ${event.organizer.lastName}`
            : event.organizer.email || 'Unknown Organizer'
        }
        open={showRatingDialog}
        onOpenChange={setShowRatingDialog}
      />
      
      <EventDetailsDialog
        event={event}
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
      />
      
      <MapDialog
        isOpen={showMapDialog}
        onClose={() => setShowMapDialog(false)}
        latitude={event.latitude}
        longitude={event.longitude}
        address={event.address}
        eventTitle={event.title}
      />
    </div>
  );
}
