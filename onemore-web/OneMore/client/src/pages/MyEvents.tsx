import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Plus } from 'lucide-react';
import { Link } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EventCard } from '@/components/EventCard';
import { BottomNavigation } from '@/components/BottomNavigation';
import { useAuth } from '@/hooks/useAuth';
import type { EventWithDetails } from '@shared/schema';

export default function MyEvents() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('going');

  const { data: goingEvents = [], isLoading: goingLoading } = useQuery<EventWithDetails[]>({
    queryKey: ['/api/user/events', 'going'],
    enabled: !!user,
  });

  const { data: likedEvents = [], isLoading: likedLoading } = useQuery<EventWithDetails[]>({
    queryKey: ['/api/user/events', 'like'],
    enabled: !!user,
  });

  const { data: passedEvents = [], isLoading: passedLoading } = useQuery<EventWithDetails[]>({
    queryKey: ['/api/user/events', 'pass'],
    enabled: !!user,
  });

  const { data: organizedEvents = [], isLoading: organizedLoading } = useQuery<EventWithDetails[]>({
    queryKey: ['/api/events/organizer', user?.id],
    enabled: !!user,
  });

  const renderEventsList = (events: EventWithDetails[], loading: boolean, emptyMessage: string) => {
    if (loading) {
      return (
        <div className="p-8 text-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading events...</p>
        </div>
      );
    }

    if (events.length === 0) {
      return (
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📅</span>
          </div>
          <h3 className="font-semibold text-foreground mb-2">No events found</h3>
          <p className="text-muted-foreground text-sm">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="space-y-0">
        {events.map((event) => (
          <EventCard key={event.id} event={event} showMessageAndRate={true} />
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/">
            <button className="touch-target p-2 -ml-2" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <h1 className="text-lg font-semibold text-foreground">My Events</h1>
          <div className="w-9" /> {/* Spacer for center alignment */}
        </div>
      </header>

      <div className="p-4 pb-20">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="going" data-testid="tab-going">Going</TabsTrigger>
            <TabsTrigger value="liked" data-testid="tab-liked">Liked</TabsTrigger>
            <TabsTrigger value="passed" data-testid="tab-passed">Passed</TabsTrigger>
            <TabsTrigger value="organized" data-testid="tab-organized">My Events</TabsTrigger>
          </TabsList>

          <TabsContent value="going" className="mt-4">
            {renderEventsList(
              goingEvents,
              goingLoading,
              "You haven't marked any events as going yet. Explore events to find ones you'd like to attend!"
            )}
          </TabsContent>

          <TabsContent value="liked" className="mt-4">
            {renderEventsList(
              likedEvents,
              likedLoading,
              "You haven't liked any events yet. Browse events and like the ones that interest you!"
            )}
          </TabsContent>

          <TabsContent value="passed" className="mt-4">
            {renderEventsList(
              passedEvents,
              passedLoading,
              "You haven't passed any events yet. Events you pass on will appear here."
            )}
          </TabsContent>

          <TabsContent value="organized" className="mt-4">
            {renderEventsList(
              organizedEvents,
              organizedLoading,
              "You haven't created any events yet. Start organizing events in your community!"
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Floating Add Button */}
      <Link href="/create-event">
        <button 
          data-testid="button-create-event-fab"
          className="fixed bottom-24 left-1/2 transform -translate-x-1/2 w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow z-50"
        >
          <Plus className="w-6 h-6 text-primary-foreground" />
        </button>
      </Link>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
