# OneMore - Location-Based Event Discovery Platform

## Overview
OneMore is a comprehensive event discovery and matching platform connecting event organizers with attendees. It features a React web application with a swipe-based interface and a React Native iOS mobile application, both offering dual-role functionality (attendee/organizer) and extensive event management. The platform facilitates local event discovery, interaction, creation, management, messaging, and organizer ratings, aiming to foster community engagement based on location.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform prioritizes a mobile-first responsive design using Shadcn/UI, Radix UI, and Tailwind CSS for the web, and native iOS design patterns for the mobile app. Key visual decisions include consistent blue branding, compact UI controls, and an optimized layout for event cards and date range pickers.

### Technical Implementations
- **Web Frontend**: Built with React 18, TypeScript, and Vite. Uses TanStack React Query for server state, Wouter for routing, and React Hook Form with Zod for form management. Geolocation is managed via a centralized `LocationContext`.
- **Mobile Frontend**: A React Native (Expo) iOS app. Features React Navigation, TanStack React Query for API state, React Context for authentication, and Expo SecureStore for secure token storage. Includes robust form validation, recurring event support, and geocoding integration. Advanced features like push notifications, social sharing, and calendar integration are built-in, alongside comprehensive error handling with ErrorBoundary components.
- **Backend**: An Express.js application in TypeScript, providing RESTful APIs. It supports Replit's OIDC via Passport.js for web and JWT token-based authentication for mobile. Secure Apple and Google Sign-In implementations are included. Features rate limiting, profanity filtering, and HTML sanitization.
- **Database**: PostgreSQL (Neon) accessed via Drizzle ORM for type-safe queries and schema management. Key tables manage users, events, interactions, messages, and ratings. Drizzle Kit handles migrations.
- **Geolocation**: Utilizes browser geolocation (web) and `expo-location` (mobile). The Haversine formula calculates distances, and events are filtered by search radius. OpenStreetMap Nominatim provides reverse geocoding for location context and currency detection.

### Feature Specifications
- **Event Discovery & Matching**: Swipe-based interface, filtering by category, distance, keyword, and date range.
- **Event Management**: Organizers can create, edit, cancel events, manage capacity, and utilize waitlists. LocationIQ API aids address autocomplete.
- **Age Restrictions**: Organizers can set minimum age requirements (18+, 21+, etc.) for events. Server-side validation enforces age checks using shared helper function (`checkAgeEligibility`) for both event interactions and waitlist joins. Users must provide birthday to attend age-restricted events. Future waitlist promotion logic documented to require age validation.
- **Attendee Management**: Organizers can view and remove attendees, with removed users blocked from rejoining.
- **Messaging System**: Direct user conversations with real-time unread counts and rate limiting.
- **User Profiles**: Displays user statistics, optional birthday field for age verification, supports account deletion with feedback, and sends email notifications.
- **Content Safety**: Implements profanity filtering, HTML sanitization, and rate limiting.
- **Authentication**: Supports Apple Sign In, Google Sign In, and Email registration with secure verification flows and auto-login.
- **Push Notifications**: Comprehensive system for messages and event changes, with Expo push token integration.
- **Social Sharing & Calendar Integration**: Native share sheet integration and "Add to Calendar" functionality for events.

## External Dependencies

### Third-Party Services
-   **Neon Database**: PostgreSQL hosting.
-   **Replit**: Platform hosting and OIDC provider.
-   **Replit Mail**: Transactional email service.
-   **LocationIQ API**: Geocoding and address autocomplete.
-   **OpenStreetMap Nominatim**: Reverse geocoding.
-   **SendGrid**: Transactional email services.

### Core Libraries
-   **Web**: React 18, Vite, Wouter, TanStack React Query, React Hook Form, Zod, Radix UI, Tailwind CSS.
-   **Mobile**: React Native 0.81, Expo ~54, React Navigation, Axios, TanStack React Query, Zod, react-native-reanimated, react-native-worklets, react-native-gesture-handler.
-   **Backend**: Express.js, Drizzle ORM, Passport.js, connect-pg-simple, express-rate-limit, express-session, memoizee, verify-apple-id-token, google-auth-library.
-   **Utilities**: date-fns, bad-words, sanitize-html.

## Recent Changes (November 20, 2025)

### iOS Production Build Fixes - Build #14 (Final Fix)
Fixed persistent blank screen issue in TestFlight builds by identifying and resolving the root cause:

**Root Cause**: The app was attempting to connect to the Replit backend on startup without any timeout configuration. When the API was unreachable from iOS devices, the AuthProvider would hang indefinitely in "loading" state, resulting in a blank white screen.

**Critical Fixes Applied**:
1. **Added Missing Dependencies**: Installed `react-native-reanimated` and `react-native-worklets` (required by React Navigation in Expo SDK 54)
2. **Babel Configuration**: Created `babel.config.js` with `babel-preset-expo` only (SDK 54 automatically includes Reanimated plugin)
3. **Component Hierarchy**: Corrected nesting order in `App.tsx` to `GestureHandlerRootView > SafeAreaProvider > ErrorBoundary`
4. **Error Visibility**: Modified `ErrorBoundary.tsx` to display error details in production builds
5. **Gesture Handler Import**: Verified `import 'react-native-gesture-handler'` is first line in `index.ts`
6. **API Timeout**: Added 10-second timeout to all API calls in `apiClient` and `refreshClient` (Build #14)
7. **Error Recovery**: Improved AuthProvider initialization to gracefully handle API failures by clearing tokens and showing login screen instead of hanging (Build #14)

**Result**: Build #14 resolves all blank screen issues by ensuring the app shows the Welcome/Login screen within 10 seconds even when the backend is unreachable.