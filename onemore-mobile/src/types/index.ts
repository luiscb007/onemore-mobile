// Types aligned with backend schema (onemore-web/OneMore/shared/schema.ts)

export type User = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  birthday: string | null;
  profileImageUrl: string | null;
  role: string;
  currentLatitude: number | null;
  currentLongitude: number | null;
  searchRadius: number;
  defaultCurrencyCode: string | null;
  lastCurrencyCheck: string | null;
  lastCurrencyCheckLatitude: number | null;
  lastCurrencyCheckLongitude: number | null;
  subscriptionTier: string;
  subscriptionStatus: string | null;
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EventCategory = 'arts' | 'community' | 'culture' | 'sports' | 'workshops';

export type Event = {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  organizerId: string;
  date: string;
  time: string;
  latitude: number;
  longitude: number;
  address: string;
  priceAmount: number | null;
  priceCurrencyCode: string | null;
  capacity: number | null;
  durationHours: number | null;
  minimumAge: number | null;
  imageUrl: string | null;
  status: string;
  isRecurring: boolean;
  recurrenceType: string | null;
  recurrenceEndDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OrganizerRating = {
  id: string;
  eventId: string;
  organizerId: string;
  attendeeId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EventWithDetails = Event & {
  organizer: User;
  userInteraction?: EventInteraction;
  interactionCounts: {
    going: number;
    like: number;
    pass: number;
  };
  organizerRating?: {
    average: number;
    count: number;
  };
  userRating?: OrganizerRating | null; // User's rating for this event
  distance?: number;
};

export type EventInteraction = {
  id: string;
  userId: string;
  eventId: string;
  type: 'going' | 'like' | 'pass';
  createdAt: string;
};

export type Conversation = {
  id: string;
  eventId: string;
  organizerId: string;
  attendeeId: string;
  lastMessageAt: string | null;
  organizerDeletedAt: string | null;
  attendeeDeletedAt: string | null;
  createdAt: string;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
};

export type Currency = {
  code: string;
  symbol: string;
  name: string;
  countryCodes: string[] | null;
};

export type UserStats = {
  eventsCreated: number;
  eventsAttended: number;
  averageOrganizerRating: number;
};
