import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Calendar, MapPin, DollarSign, Clock, Users, Star } from 'lucide-react';
import { formatPrice } from '@/lib/currencyUtils';
import type { EventWithDetails } from '@shared/schema';

interface EventDetailsDialogProps {
  event: EventWithDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventDetailsDialog({ event, open, onOpenChange }: EventDetailsDialogProps) {
  const formatDate = (dateValue: string | Date) => {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const renderRatingBadge = () => {
    if (!event.organizerRating) return null;
    
    return (
      <div className="flex items-center space-x-1">
        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        <span className="font-medium">
          {event.organizerRating.average.toFixed(1)}
        </span>
        <span className="text-muted-foreground">
          ({event.organizerRating.count} {event.organizerRating.count === 1 ? 'rating' : 'ratings'})
        </span>
      </div>
    );
  };

  const organizerName = event.organizer.firstName && event.organizer.lastName
    ? `${event.organizer.firstName} ${event.organizer.lastName}`
    : event.organizer.email || 'Unknown Organizer';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-md max-h-[90vh] overflow-y-auto"
        data-testid={`dialog-event-details-${event.id}`}
      >
        <DialogHeader>
          <DialogTitle data-testid={`dialog-title-${event.id}`}>
            {event.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {event.imageUrl && (
            <img 
              src={event.imageUrl}
              alt={event.title}
              className="w-full h-48 object-cover rounded-lg"
              data-testid={`dialog-img-${event.id}`}
            />
          )}

          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
              <p className="text-sm" data-testid={`dialog-description-${event.id}`}>
                {event.description}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Category</h3>
              <p className="text-sm capitalize" data-testid={`dialog-category-${event.id}`}>
                {event.category}
              </p>
            </div>

            <div className="flex items-start space-x-2">
              <Calendar className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Date & Time</h3>
                <p className="text-sm" data-testid={`dialog-datetime-${event.id}`}>
                  {formatDate(event.date)} at {event.time}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Location</h3>
                <p className="text-sm" data-testid={`dialog-location-${event.id}`}>
                  {event.address}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <DollarSign className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Price</h3>
                <p className="text-sm" data-testid={`dialog-price-${event.id}`}>
                  {formatPrice(event.priceAmount, event.priceCurrencyCode)}
                </p>
              </div>
            </div>

            {event.capacity && (
              <div className="flex items-start space-x-2">
                <Users className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Capacity</h3>
                  <p className="text-sm" data-testid={`dialog-capacity-${event.id}`}>
                    {event.capacity} {event.capacity === 1 ? 'person' : 'people'}
                  </p>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Organizer</h3>
              <div className="flex items-center justify-between">
                <p className="text-sm" data-testid={`dialog-organizer-${event.id}`}>
                  {organizerName}
                </p>
                {renderRatingBadge()}
              </div>
            </div>

            {(event.interactionCounts.going > 0 || event.interactionCounts.like > 0) && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Attendee Interest</h3>
                <div className="flex items-center space-x-4 text-sm">
                  {event.interactionCounts.going > 0 && (
                    <span data-testid={`dialog-going-count-${event.id}`}>
                      ✓ {event.interactionCounts.going} going
                    </span>
                  )}
                  {event.interactionCounts.like > 0 && (
                    <span data-testid={`dialog-like-count-${event.id}`}>
                      ❤️ {event.interactionCounts.like} likes
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
