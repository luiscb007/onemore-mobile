# OneMore

## Overview
OneMore is a location-based event discovery and matching platform designed to connect event organizers with attendees. It offers a dual-mode interface: attendees can browse local events, interact with event cards (Going/Like/Pass), and discover events through geolocation, category filtering, and keyword search. Organizers can create, manage, and track events with capacity limits and a comprehensive messaging system. The platform supports recurring events, a waitlist system, and provides detailed event information optimized for mobile devices. Its vision is to be a leading platform for local event engagement, fostering community connections and simplifying event management.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with React 18 and TypeScript, using Vite for development and bundling. It leverages Shadcn/UI components (built on Radix UI) and Tailwind CSS for a mobile-first, responsive design with CSS variables for theming. TanStack React Query manages server state, Wouter handles client-side routing, and React Hook Form with Zod provides type-safe form management and validation.

### Backend Architecture
The backend is an Express.js application written in TypeScript, providing RESTful API endpoints with standardized error handling. It integrates with Vite for hot reloading during development and serves static assets in production. Custom middleware is used for request/response logging.

### Authentication System
Authentication is handled via Replit's OpenID Connect (OIDC) service, using Passport.js and the OpenID Client strategy. User sessions are stored in PostgreSQL with secure, HTTP-only cookies. The system supports automatic user profile creation/updates from OIDC claims and includes role-based access control for attendees and organizers.

### Database Architecture
PostgreSQL, hosted on Neon for serverless scalability, is the primary database. Drizzle ORM provides type-safe schema definitions and query building. Key tables include users (with geolocation and role data), events (with coordinates and categorization), event interactions, and sessions. Drizzle Kit manages database migrations.

### Geolocation Features
The application uses the browser's Geolocation API for user coordinates, managed through a centralized LocationContext that ensures all components stay synchronized. Events are matched by proximity using the Haversine formula, with fallback mechanisms for denied location access. Event locations are stored as latitude/longitude coordinates alongside address information. LocationIQ provides address autocomplete and geocoding, while OpenStreetMap Nominatim is used for reverse geocoding to display city names and detect currency.

**Centralized Location State Management**
- LocationContext (`client/src/contexts/LocationContext.tsx`) provides shared location state across the application
- All components using location data consume from this single source of truth
- Location refresh functionality allows re-requesting permissions without page reload
- Error states are preserved during retry attempts to maintain UI consistency
- Coordinates are cleared on geolocation errors to prevent stale data
- LocationPrompt shows when location is denied, remains visible during refresh with loading feedback
- LocationBanner displays city name via reverse geocoding, automatically updates on location changes, and shows "Location unavailable" during errors (even while retrying)

### Mobile-Optimized Design
The design prioritizes a mobile-first approach, featuring touch-friendly interactions, responsive layouts, sticky navigation, bottom tab bars, and card-based event displays.

### Key Features and Implementations
- **Address Autocomplete & Geocoding**: LocationIQ integration for accurate event location input.
- **Currency Auto-Detection**: Based on user location via OpenStreetMap reverse geocoding.
- **Dual-Range Timeline Slider**: Allows flexible date range filtering for event discovery.
- **Distance Display**: Shows calculated distance to events using the Haversine formula.
- **Account Deletion**: GDPR-compliant feature for permanent user data removal.
- **Capacity Management & Waitlist**: Enforces event capacity and allows users to join a waitlist.
- **Recurring Events**: Supports weekly, biweekly, and monthly recurrence patterns, expanded into individual occurrences for display and interaction.
- **Event Cancellation**: Organizers can cancel events via soft-delete.
- **Keyword Search**: Case-insensitive search on event titles and descriptions.
- **Sort Options**: Events can be sorted by Date, Distance, or Popularity.
- **User Statistics**: Profile page displays Events Created, Attended, and Average Organizer Rating.
- **Search Radius Slider**: Configurable distance-based filtering for event discovery.
- **Legal & Compliance**: Includes Privacy Policy, Terms of Service, and Cookie Consent banner.
- **Security**: Input sanitization (sanitize-html) and user-based rate limiting are implemented.
- **Error Handling**: Enhanced with ApiError class for field-specific feedback.
- **Image System**: Uses category-based SVG gradient placeholder images with emojis.
- **LocationIQ Maps Integration**: Click event locations to view static map preview in popup with option to open in navigation apps.
- **Message & Conversation Deletion**: Users can delete individual messages (sender only) and entire conversations with soft-delete architecture (conversation hidden from deleting user, permanently removed when both participants delete).

## Freemium Model (Infrastructure Ready)

### Overview
The application has a freemium tier infrastructure in place, currently **disabled by default**. All users currently have unlimited access. When activated via environment variable, the platform will enforce usage limits for free-tier users while premium users enjoy unrestricted access.

### Current Status
- **Infrastructure**: ✅ Fully implemented
- **Enforcement**: ❌ Disabled (set `ENABLE_TIER_RESTRICTIONS=false` by default)
- **All Users**: Unlimited event creation and attendance

### Subscription Tiers

**Free Tier (Default)**
- **Event Creation**: 1 event per month
- **Event Attendance**: 1 "Going" interaction per month
- **Other Interactions**: Unlimited "Like" and "Pass" actions
- **All Other Features**: Full access (messaging, ratings, search, etc.)

**Premium Tier**
- **Event Creation**: Unlimited
- **Event Attendance**: Unlimited
- **All Features**: Unlimited access
- **Future Benefits**: Priority support, advanced analytics (planned)

### Technical Implementation

**Database Schema Additions**
- `users` table includes subscription fields:
  - `subscriptionTier`: "free" or "premium" (default: "free")
  - `subscriptionStatus`: "active", "cancelled", or "expired"
  - `subscriptionStartDate`, `subscriptionEndDate`: Subscription period tracking
  - `stripeCustomerId`, `stripeSubscriptionId`: For Stripe integration
- `monthly_usage` table tracks per-user limits:
  - `eventsCreated`: Count of events created in current month
  - `eventsAttended`: Count of "Going" interactions in current month
  - Unique constraint on (userId, month) for accurate monthly tracking

**Enforcement Logic**
- `checkUserLimits()` function validates actions before execution
- Checks subscription tier and monthly usage counters
- Returns upgrade-required flag for frontend upgrade prompts
- Usage counters increment after successful event creation or attendance
- Feature flag (`ENABLE_TIER_RESTRICTIONS`) controls global enforcement

**Protected Endpoints**
- `POST /api/events` - Event creation (limited to 1/month for free users)
- `POST /api/events/:id/interact` - Event attendance via "going" (limited to 1/month for free users)
- Returns 403 Forbidden with upgrade message when limits exceeded

### Activation Plan

**Phase 1: Enable Restrictions** (Ready Now)
1. Set environment variable: `ENABLE_TIER_RESTRICTIONS=true`
2. Restart application
3. Free users immediately subject to monthly limits
4. Premium users (manually upgraded in database) have unlimited access

**Phase 2: Payment Integration** (When Ready)
1. Install Stripe integration via Replit blueprints (`blueprint:javascript_stripe`)
2. Create subscription management UI:
   - Upgrade button on profile page for free users
   - Usage indicators showing X/1 events created/attended this month
   - Tier badge displaying "Free" or "Premium" status
3. Implement Stripe webhook handlers for subscription events
4. Build subscription success/cancellation flows
5. Test with Stripe test mode
6. Launch payment processing

**Phase 3: Customer Migration** (Future)
- Existing users grandfathered based on historical usage
- Communication campaign about new tiers
- Special launch pricing or promotions

### Developer Notes
- All limit-checking logic is in place but dormant until flag is enabled
- Usage tracking runs silently in background (even when restrictions disabled) for future analytics
- Easy to adjust limits (change from 1 to 3 events/month) by modifying `checkUserLimits()` function
- Stripe customer/subscription IDs stored in database, ready for integration
- Monthly usage resets automatically (keyed by "YYYY-MM" format)

### Environment Variables
- `ENABLE_TIER_RESTRICTIONS`: "true" to enforce limits, "false" (or unset) to disable (default: unset/false)
- `STRIPE_SECRET_KEY`: For future Stripe integration (not yet required)
- `STRIPE_WEBHOOK_SECRET`: For Stripe webhook verification (not yet required)

## External Dependencies

### Database and Hosting
- **Neon Database**: PostgreSQL serverless database hosting.
- **Replit Platform**: Application hosting and development environment.

### Authentication Service
- **Replit OIDC**: OpenID Connect provider for user authentication.

### UI Component Libraries
- **Radix UI**: Headless component primitives.
- **Shadcn/UI**: Component library built on Radix UI and Tailwind CSS.
- **Lucide React**: Icon library.

### Geolocation & Mapping APIs
- **LocationIQ**: Address autocomplete and geocoding.
- **OpenStreetMap Nominatim**: Reverse geocoding.

### Development and Build Tools
- **Vite**: Build tool and development server.
- **TypeScript**: For type safety.
- **Tailwind CSS**: Utility-first CSS framework.
- **Drizzle ORM**: Type-safe database ORM.
- **Drizzle Kit**: Database migration management.

### Form and Validation Libraries
- **React Hook Form**: Form state management.
- **Zod**: Runtime type validation.
- **Hookform Resolvers**: Integration for React Hook Form and Zod.

### Additional Dependencies
- **TanStack React Query**: Server state management and caching.
- **Wouter**: Lightweight client-side routing.
- **Date-fns**: Date manipulation utilities.
- **Class Variance Authority**: Type-safe component variant styling.
- **sanitize-html**: For input sanitization.