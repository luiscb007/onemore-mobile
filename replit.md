# OneMore - Location-Based Event Discovery Platform

## Overview

OneMore is a comprehensive event discovery and matching platform that connects event organizers with attendees through an intuitive, location-based interface. The platform consists of two main applications:

1. **Web Application** - A React-based progressive web app with swipe-based event discovery, dual-role functionality (attendee/organizer), and comprehensive event management features
2. **Mobile Application** - A React Native iOS app with complete JWT authentication, providing native mobile access to the event discovery platform

The system enables users to discover local events, interact with them through a "Going/Like/Pass" system, create and manage events, communicate through messaging, and rate organizers.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Web Frontend Architecture

The web application is built with **React 18 and TypeScript**, using **Vite** for development and production builds. The UI leverages **Shadcn/UI components** (built on Radix UI primitives) with **Tailwind CSS** for styling, following a mobile-first responsive design approach.

**Key Frontend Design Decisions:**
- **State Management**: TanStack React Query for server state, caching, and automatic refetching
- **Routing**: Wouter (lightweight React router) for client-side navigation
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Location Management**: Centralized LocationContext provides shared geolocation state across all components, ensuring consistent location data and preventing stale coordinates
- **Mobile Optimization**: Touch-friendly interactions, sticky navigation, bottom tab bars, and card-based layouts

### Mobile Frontend Architecture

The mobile application is built with **React Native** using **Expo** framework for iOS deployment. It features a complete authentication system ready to integrate with JWT-based backends.

**Key Mobile Design Decisions:**
- **Navigation**: React Navigation with bottom tabs for primary navigation and stack navigation for modal flows
- **State Management**: TanStack React Query for API state management, React Context for authentication state
- **Secure Storage**: Expo SecureStore for encrypted token storage on device
- **API Integration**: Axios with interceptors for automatic token attachment and refresh handling
- **Type Safety**: TypeScript types aligned with backend schema for compile-time safety

The mobile app is **fully functional on the client side** and requires only JWT authentication endpoints on the backend to work immediately.

**Mobile Event Creation:**
- CreateEvent screen fully implemented with all form fields from web app
- Form validation using React Hook Form + Zod (title, description, category, date/time, price, capacity, recurring events)
- Recurring event support with pattern selection (weekly/biweekly/monthly) and 2-month maximum constraint
- Native date/time pickers for mobile UX
- **Geocoding Limitation**: Location coordinates currently use placeholder values (San Francisco default). Full geocoding integration with OpenStreetMap Nominatim or similar service is needed to convert addresses to real latitude/longitude coordinates for accurate event positioning.

### Backend Architecture

The backend is an **Express.js application written in TypeScript**, providing RESTful API endpoints with standardized error handling and request logging.

**Key Backend Design Decisions:**
- **Authentication**: Replit's OpenID Connect (OIDC) via Passport.js for web; JWT token-based auth designed for mobile
- **Session Management**: PostgreSQL-backed sessions using connect-pg-simple with HTTP-only secure cookies
- **Rate Limiting**: Endpoint-specific rate limiters using express-rate-limit (keyed by authenticated user ID)
- **Content Safety**: Bad-words filter with custom additions for profanity detection; sanitize-html for XSS prevention
- **API Design**: Consistent error responses with Zod validation errors exposed for client-side display

### Database Architecture

**PostgreSQL** hosted on **Neon** (serverless) serves as the primary database, accessed via **Drizzle ORM** for type-safe queries and schema management.

**Core Tables:**
- **users**: Stores user profiles with role (attendee/organizer), geolocation coordinates, search radius preferences, currency settings, and subscription tier information
- **events**: Event data with geolocation, categorization, pricing, capacity, recurrence patterns, and status tracking
- **eventInteractions**: Tracks user interactions (going/like/pass) with events for matching and filtering
- **eventWaitlist**: Manages waitlist entries when events reach capacity
- **conversations & messages**: Direct messaging system between users
- **organizerRatings**: User ratings for event organizers with aggregated statistics
- **currencies**: Supported currency definitions with country mappings
- **sessions**: Passport.js session storage for web authentication

**Schema Management:**
- Drizzle Kit handles migrations with `drizzle.config.ts` configuration
- Type-safe schema definitions in `shared/schema.ts` shared between client and server
- Database provisioning via `DATABASE_URL` environment variable

### Authentication Systems

**Web Authentication (Replit OIDC):**
- OpenID Connect integration via Passport.js with openid-client strategy
- Automatic user creation/updates from OIDC claims
- Persistent sessions in PostgreSQL with 7-day TTL
- HTTP-only, secure cookies for production environments
- Memoized OIDC configuration for performance

**Mobile Authentication (JWT - Backend Implementation Needed):**
- Mobile app expects JWT token-based authentication
- Requires three backend endpoints: `POST /api/auth/login`, `GET /api/auth/user`, `POST /api/auth/logout`
- Automatic token refresh on 401 responses using refresh tokens
- Secure token storage via Expo SecureStore (encrypted device storage)
- Authorization headers automatically attached via Axios interceptors

**Mobile Migration Status (January 2025):**
The mobile app migration is **100% complete** with full feature parity to the web app:

✅ **Core Features Implemented:**
- Role switching (attendee/organizer) with AsyncStorage persistence
- **MyEvents screen with 4 tabs** (Going, Liked, Passed, Organized) matching web app layout
- EditEvent screen with full validation and prefilled data
- Advanced filters (search, date range, sort, hide past toggle)
- **Custom range slider** with dual draggable handles for flexible date filtering (0-60 days from today)
- Complete messaging system (conversation list + chat threads with optimized mark-as-read)
- Event interactions (going/like/pass) with visual feedback
- **Discover screen filters out user's own events** (backend automatically excludes)
- Reverse geocoding displays user's city name in Discover header using LocationIQ API

✅ **MVP Features Implemented:**
- EventDetailScreen with comprehensive event information
- MapPreview component (static maps with deep linking to device maps)
- Waitlist system (join/leave/status with position display)
- Ratings system (star ratings with modal UI, eligibility checks, organizer ratings)
- Full navigation flow (HomeScreen → EventDetail)

✅ **Profile & Account Features:**
- User stats display (Events Created, Events Attended, Average Rating)
- About OneMore info section with feature list
- Give us feedback modal (submits to `/api/feedback`)
- Delete account dialog with reason selection and feedback

✅ **Authentication:**
- **Email/password registration** fully implemented (`POST /api/auth/register`)
- Login with email/password (`POST /api/auth/login`)
- JWT token-based authentication with automatic refresh
- Secure token storage via Expo SecureStore
- Registration screen with validation (password min 6 chars, email required, passwords must match)

🔧 **Testing & Integration:**
The app is production-ready for iOS deployment. All REST API endpoints for events, messaging, waitlist, ratings, authentication, and user management are fully integrated. Backend JWT authentication endpoints are implemented and working.

📱 **Native iOS Deployment:**
The mobile app is configured for native iOS deployment using EAS Build:
- **Bundle Identifier**: `com.onemore.app` (configured in app.json)
- **Secure Storage**: expo-secure-store@~12.8.1 for encrypted token storage
- **Build Profiles**: Development, Preview, and Production configured in eas.json
- **Permissions**: Location, Camera, and Photo Library properly configured
- **Deployment Guide**: See `onemore-mobile/iOS_DEPLOYMENT.md` for complete build and App Store submission instructions
- **Current State**: Web bundle deployment for testing; ready to build as native iOS app with `eas build --platform ios`

### Geolocation & Location Services

**Browser Geolocation (Web):**
- LocationContext manages shared location state across all components
- Coordinates obtained via browser's Geolocation API
- Automatic retry mechanism with user-initiated refresh capability
- Error states preserved during retry to maintain UI consistency
- LocationBanner displays city name via OpenStreetMap reverse geocoding
- LocationPrompt shown when access denied, remains visible during refresh with loading feedback

**Distance Calculations:**
- Haversine formula for accurate distance computation between coordinates
- Events filtered by user-defined search radius (0-100km configurable)
- Distance displayed on event cards for user context

**Currency Auto-Detection:**
- Coordinates reverse-geocoded to country via OpenStreetMap Nominatim API
- Country mapped to currency using predefined mappings (EUR, PLN, GBP, USD)
- Currency updated when user moves >50km or after 24 hours
- Falls back to EUR when geocoding fails or country not supported

### Key Features & Business Logic

**Event Discovery & Matching:**
- Swipe-based interaction system (Going/Like/Pass) for attendees
- Category-based filtering (Arts, Community, Culture, Sports, Workshops)
- Distance-based filtering with configurable search radius slider
- Keyword search on event titles and descriptions (case-insensitive)
- Date range filtering with dual-range timeline slider
- Sort options: Date, Distance, Popularity
- Events automatically filtered to hide user's own events and past events

**Event Management:**
- Organizers can create, edit, cancel events (soft-delete)
- Support for recurring events (weekly, biweekly, monthly patterns)
- Capacity enforcement with automatic waitlist when full
- Address autocomplete powered by LocationIQ API for accurate geocoding
- Category-based default images using SVG gradients with emojis
- Event status tracking (active/cancelled)

**Messaging System:**
- Direct conversations between users via REST endpoints
- Real-time unread message count (polling every 5 seconds)
- Rate-limited to 30 messages per minute per user
- Conversation persistence and message history

**User Profiles & Analytics:**
- Profile displays: Events Created, Events Attended, Average Organizer Rating
- Account deletion with GDPR compliance (full data removal)
- Optional feedback collection on account deletion
- Email notifications via SendGrid integration

**Content Safety:**
- Profanity filter on event titles, descriptions, and messages
- Sanitization of all user-generated HTML content
- Rate limiting on event creation (10/hour), messaging (30/min), interactions (60/min)

## External Dependencies

### Third-Party Services

**Database & Hosting:**
- **Neon Database** - Serverless PostgreSQL hosting with websocket connections (@neondatabase/serverless)
- **Replit** - Platform hosting with OIDC authentication provider

**Geocoding & Mapping:**
- **LocationIQ API** - Address autocomplete and geocoding services
- **OpenStreetMap Nominatim** - Reverse geocoding for city names and currency detection
- **MapLibre GL JS** - Open-source map rendering for event location display (via react-map-gl)

**Email Services:**
- **SendGrid** (@sendgrid/mail) - Transactional emails for feedback and account deletion notifications

**Authentication & Security:**
- **Passport.js** - Authentication middleware framework
- **OpenID Client** - OIDC strategy for Replit authentication
- **Expo SecureStore** - Encrypted token storage for mobile (React Native)

### Core Frontend Libraries

**Web Application:**
- **React 18** - UI framework with TypeScript
- **Vite** - Build tool and development server
- **Wouter** - Lightweight routing
- **TanStack React Query** - Server state management
- **React Hook Form** - Form state management
- **Zod** - Runtime type validation and schema definition
- **Radix UI** - Headless UI primitives (@radix-ui/react-*)
- **Tailwind CSS** - Utility-first styling
- **date-fns** - Date manipulation and formatting
- **bad-words** - Profanity filtering
- **sanitize-html** - XSS prevention

**Mobile Application:**
- **React Native 0.81** - Mobile framework
- **Expo ~54** - React Native tooling and APIs
- **React Navigation** - Navigation library (@react-navigation/native, bottom-tabs, stack)
- **Axios** - HTTP client with interceptors
- **TanStack React Query** - API state management
- **date-fns** - Date utilities
- **Zod** - Schema validation

### Backend Libraries

- **Express.js** - Web server framework
- **Drizzle ORM** - Type-safe database ORM
- **connect-pg-simple** - PostgreSQL session store
- **express-rate-limit** - API rate limiting
- **express-session** - Session management
- **memoizee** - Function memoization for performance

### Development Tools

- **TypeScript** - Type safety across stack
- **ESBuild** - Production bundling
- **Drizzle Kit** - Database migrations
- **TSX** - TypeScript execution for development