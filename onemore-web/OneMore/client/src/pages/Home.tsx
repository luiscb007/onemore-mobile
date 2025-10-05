import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { LocationBanner } from '@/components/LocationBanner';
import { LocationPrompt } from '@/components/LocationPrompt';
import { CategoryFilter } from '@/components/CategoryFilter';
import { EventCard } from '@/components/EventCard';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Plus, Search, X, Calendar } from 'lucide-react';
import { useLocation } from 'wouter';
import type { EventWithDetails } from '@shared/schema';

const categories = [
  { id: 'all', name: 'All', emoji: '🌟' },
  { id: 'arts', name: 'Arts', emoji: '🎨' },
  { id: 'community', name: 'Community', emoji: '🤝' },
  { id: 'culture', name: 'Culture', emoji: '🎭' },
  { id: 'sports', name: 'Sports', emoji: '⚽' },
  { id: 'workshops', name: 'Workshops', emoji: '📚' },
];

export default function Home() {
  const { user, isLoading: userLoading } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [hidePastEvents, setHidePastEvents] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState([0, 60]); // Dual-range slider: [start days, end days] from today (0-60)
  const [sortBy, setSortBy] = useState<'date' | 'distance' | 'popularity'>('date');
  const [, setLocation] = useLocation();

  // Calculate date range from timeline slider (timezone-safe)
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const startDate = new Date(today);
  startDate.setDate(today.getDate() + dateRange[0]);
  const dateFrom = formatDate(startDate);
  
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + dateRange[1]);
  const dateTo = formatDate(endDate);

  const { data: events = [], isLoading: eventsLoading } = useQuery<EventWithDetails[]>({
    queryKey: ['/api/events', { category: selectedCategory, userId: user?.id, hidePast: hidePastEvents, radius: user?.searchRadius, search: searchQuery, dateFrom, dateTo, sortBy }],
    queryFn: async () => {
      const params = new URLSearchParams({
        category: selectedCategory,
        ...(user?.id && { userId: user.id }),
        hidePast: hidePastEvents.toString(),
        ...(user?.currentLatitude && { userLat: user.currentLatitude }),
        ...(user?.currentLongitude && { userLng: user.currentLongitude }),
        ...(user?.searchRadius !== undefined && { userRadius: user.searchRadius.toString() }),
        ...(searchQuery && { search: searchQuery }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
        ...(sortBy && { sortBy }),
      });
      
      const response = await fetch(`/api/events?${params}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      
      return response.json();
    },
    enabled: !userLoading,
  });


  if (userLoading) {
    return (
      <div className="max-w-md mx-auto bg-background min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen relative">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <div 
              className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-md shadow-orange-500/20"
              data-testid="logo-1plus-header"
              aria-label="OneMore app logo"
            >
              <span className="text-white font-black text-sm tracking-tighter">1+</span>
            </div>
            <h1 className="text-lg font-semibold text-foreground">OneMore</h1>
          </div>
          
          <button
            onClick={() => setLocation('/create-event')}
            data-testid="button-create-event"
            className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors shadow-md"
            aria-label="Create event"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex items-center justify-between px-4 py-2 border-t border-border gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Hide past</span>
            <Switch
              checked={hidePastEvents}
              onCheckedChange={setHidePastEvents}
              data-testid="switch-hide-past-events"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Sort by:</span>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-32 h-8 text-xs" data-testid="select-sort-by">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date" data-testid="sort-option-date">Date</SelectItem>
                <SelectItem value="distance" data-testid="sort-option-distance">Distance</SelectItem>
                <SelectItem value="popularity" data-testid="sort-option-popularity">Popularity</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {/* Location Banner */}
      <LocationBanner />

      {/* Location Permission Prompt */}
      <LocationPrompt />

      {/* Search Bar and Date Filters */}
      <div className="px-4 py-3 border-b border-border space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search events by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
            data-testid="input-search-events"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              data-testid="button-clear-search"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Timeline Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Events from:</span>
            </div>
            <span className="font-medium text-foreground" data-testid="text-timeline-start-date">
              {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Events to:</span>
            </div>
            <span className="font-medium text-foreground" data-testid="text-timeline-end-date">
              {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Today</span>
            <Slider
              value={dateRange}
              onValueChange={setDateRange}
              min={0}
              max={60}
              step={1}
              className="flex-1"
              data-testid="slider-timeline"
            />
            <span className="text-xs text-muted-foreground whitespace-nowrap">+2mo</span>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <CategoryFilter 
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Events List */}
      <main className="pb-20">
        {eventsLoading ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📅</span>
            </div>
            <h3 className="font-semibold text-foreground mb-2">No events found</h3>
            <p className="text-muted-foreground text-sm">
              Try changing the category or check back later for new events.
            </p>
          </div>
        ) : (
          events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
