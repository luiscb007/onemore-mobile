# OneMore - Location-Based Event Discovery Platform

## Overview

OneMore is a comprehensive event discovery and matching platform designed to connect event organizers with attendees. It features a React-based web application with a swipe-based interface and a React Native iOS mobile application, both offering dual-role functionality (attendee/organizer) and extensive event management capabilities. The platform enables users to discover local events, interact with them, create and manage events, communicate via messaging, and rate organizers. Its core purpose is to facilitate event discovery and community engagement based on location.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Web Frontend Architecture

The web application uses **React 18** and **TypeScript** with **Vite** for building. It leverages **Shadcn/UI** components, **Radix UI** primitives, and **Tailwind CSS** for a mobile-first responsive design. Key decisions include **TanStack React Query** for server state, **Wouter** for routing, **React Hook Form** with **Zod** for forms, and a centralized `LocationContext` for geolocation.

### Mobile Frontend Architecture

The mobile application is a **React Native** app built with **Expo** for iOS. It features **React Navigation** for navigation, **TanStack React Query** for API state, **React Context** for authentication, and **Expo SecureStore** for secure token storage. It is fully functional on the client side, requiring only JWT authentication endpoints on the backend. Event creation includes form validation using **React Hook Form** + **Zod** and supports recurring events. Geocoding integration is implemented with reverse geocoding displaying city names in the HomeScreen. 

**HomeScreen Features:**
- **Blue Branding**: Logo uses blue (#007AFF) background, "Hide past" toggles use blue when active (main controls + modal), consistent with app's accent color
- **Location Display**: Shows current city name with MapPin icon and search radius, includes refresh button with loading animation
- **Category Navigation**: Horizontal scrollable category carousel with compact buttons (12px text, reduced padding) and left/right arrow buttons for incremental navigation (200px scroll per click)
- **Smart Arrow States**: Arrows auto-enable/disable based on scroll position and content width, using dark grey (#334155) when enabled, light grey (#cbd5e1) when disabled for clear visibility
- **Date Range Slider**: Custom horizontal range slider with dual handles using absolute touch positioning for smooth dragging on both web and native

**Create Event Features:**
- **Custom OptionPicker Component**: Reusable modal-based dropdown selector following CalendarPicker/TimePicker pattern, replaces unreliable native iOS Picker
- **Smart Currency Defaulting**: Cascading defaults from user.defaultCurrencyCode (location-based from backend) → EUR fallback
- **Strict Type Safety**: Full TypeScript integration with EventCategory enum types, coordinate conversion (string to number), and Zod superRefine validation
- **Recurrence Validation**: Context-aware validation ensuring pattern and end date are selected when recurring events are enabled, with empty string → null coercion

**Rating System Features:**
- **Persistent Rating State**: Backend includes userRating field in event responses to track rated status across sessions
- **Smart Duplicate Prevention**: Rate button disabled based on backend data (userRating field), not just local state
- **Pre-filled Updates**: Modal shows existing rating when users attempt to rate again, allowing updates
- **Optimistic UI**: Local ratedEventIds provides immediate feedback while backend data refetches
- **Type-Safe Implementation**: Full TypeScript integration with OrganizerRating type including all fields (updatedAt, createdAt)

**Authentication & Welcome Flow:**
- **WelcomeScreen**: Stylish welcome screen with app's red/blue color scheme, featuring triple authentication options (Apple Sign In, Google Sign In, and Email registration) with equal prominence
- **Apple Sign In**: Fully implemented with expo-apple-authentication, secure backend token verification using verify-apple-id-token package, and verified email linking. Auto-verified users bypass email verification.
- **Google Sign In**: Fully implemented with expo-auth-session web-based OAuth flow using Google.useIdTokenAuthRequest hook. Works in Expo Go for immediate testing. Backend uses google-auth-library for secure token verification with proper audience configuration. Auto-verified users bypass email verification. For production, see google-signin-native.md for native iOS SDK implementation guide.
- **Email Registration**: Mandatory first name requirement, secure email verification flow with 24-hour token expiry
- **Email Verification**: Users must verify email before login, with Replit Mail integration for verification emails and resend functionality
- **Auto-Login**: Seamless auto-login for returning users via encrypted token storage in Expo SecureStore
- **Security**: Backend properly validates OAuth tokens (Apple and Google) with provider public keys, checks email_verified claims, and prevents account takeover by only using verified data from providers. Email enumeration prevention with consistent generic responses.

**ProfileScreen Features:**
- **iOS-Native Settings Layout**: Settings items use flexDirection: 'row' with space-between justification, matching native iOS Settings app design patterns
- **Currency Picker**: Modal-based currency selector with scrollable list, visual selection states (checkmark + highlighted background), and real-time currency updates
- **Location Display**: Shows city/country via reverse geocoding instead of raw coordinates, with fallback to coordinates if reverse geocoding fails
- **Search Radius Control**: Slider with real-time updates, displaying current value and range labels (0-100 km)
- **Account Settings**: Displays subscription status and tier, with visual role badges (Attendee/Organizer) using color-coded styling
- **User Stats**: Shows events created, attended, and average organizer rating with visual stat cards
- **Feedback & Account Management**: Feedback modal for user suggestions, account deletion with reason tracking and optional feedback

The mobile app is production-ready for iOS deployment.

### Backend Architecture

The backend is an **Express.js** application written in **TypeScript**, providing RESTful API endpoints. It includes **Replit's OpenID Connect (OIDC)** via **Passport.js** for web authentication and is designed for **JWT token-based authentication** for mobile. **Apple Sign In** is implemented with secure token verification using the **verify-apple-id-token** package, validating tokens against Apple's public keys and only accepting verified email claims to prevent impersonation. **Google Sign In** is implemented with the **google-auth-library** package, properly verifying ID tokens with configured audience validation. Other features include **PostgreSQL-backed sessions**, **express-rate-limit** for rate limiting, **bad-words** filter for content safety, and **sanitize-html** for XSS prevention.

### Database Architecture

**PostgreSQL**, hosted on **Neon**, is the primary database, accessed via **Drizzle ORM** for type-safe queries and schema management. Core tables include `users`, `events`, `eventInteractions`, `eventWaitlist`, `conversations`, `messages`, `organizerRatings`, `currencies`, and `sessions`. **Drizzle Kit** handles migrations, and schema definitions are type-safe and shared between client and server.

### Geolocation & Location Services

The platform uses browser geolocation for the web and `expo-location` for mobile, managing location state consistently. **Haversine formula** calculates distances, and events are filtered by a user-defined search radius. **OpenStreetMap Nominatim** is used for reverse geocoding to display city names and auto-detect currency based on location.

### Key Features & Business Logic

The platform supports:
- **Event Discovery & Matching**: Swipe-based interactions, category, distance, keyword, and date-range filtering, with sorting options.
- **Event Management**: Organizers can create, edit, and cancel events, with support for recurring events, capacity enforcement, and waitlists. LocationIQ API provides address autocomplete.
- **Messaging System**: Direct user conversations with real-time unread counts and rate limiting.
- **User Profiles & Analytics**: Displays user stats, supports account deletion with feedback, and sends email notifications.
- **Content Safety**: Profanity filtering and HTML sanitization for user-generated content, along with rate limiting on various actions.

## External Dependencies

### Third-Party Services

-   **Neon Database**: Serverless PostgreSQL hosting.
-   **Replit**: Platform hosting and OIDC authentication provider.
-   **Replit Mail**: Transactional email service for verification emails.
-   **LocationIQ API**: Address autocomplete and geocoding.
-   **OpenStreetMap Nominatim**: Reverse geocoding for location context and currency detection.
-   **MapLibre GL JS**: Open-source map rendering.
-   **SendGrid**: Transactional email services.
-   **Passport.js**: Authentication middleware.
-   **OpenID Client**: OIDC strategy for Replit authentication.
-   **Expo SecureStore**: Encrypted token storage for mobile.

### Core Libraries

-   **Web Application**: React 18, Vite, Wouter, TanStack React Query, React Hook Form, Zod, Radix UI, Tailwind CSS, date-fns, bad-words, sanitize-html.
-   **Mobile Application**: React Native 0.81, Expo ~54, React Navigation, Axios, TanStack React Query, date-fns, Zod.
-   **Backend Libraries**: Express.js, Drizzle ORM, connect-pg-simple, express-rate-limit, express-session, memoizee.

### Development Tools

-   **TypeScript**: Type safety.
-   **ESBuild**: Production bundling.
-   **Drizzle Kit**: Database migrations.
-   **TSX**: TypeScript execution for development.