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
- **Location Display**: Shows current city name with MapPin icon and search radius, includes refresh button with loading animation
- **Category Navigation**: Horizontal scrollable category carousel with left/right arrow buttons for incremental navigation (200px scroll per click)
- **Smart Arrow States**: Arrows auto-enable/disable based on scroll position and content width, with visual feedback (opacity and color changes)
- **Date Range Slider**: Custom horizontal range slider with dual handles using absolute touch positioning for smooth dragging on both web and native

**Create Event Features:**
- **Custom OptionPicker Component**: Reusable modal-based dropdown selector following CalendarPicker/TimePicker pattern, replaces unreliable native iOS Picker
- **Smart Currency Defaulting**: Cascading defaults from user.defaultCurrencyCode (location-based from backend) → EUR fallback
- **Strict Type Safety**: Full TypeScript integration with EventCategory enum types, coordinate conversion (string to number), and Zod superRefine validation
- **Recurrence Validation**: Context-aware validation ensuring pattern and end date are selected when recurring events are enabled, with empty string → null coercion

The mobile app is production-ready for iOS deployment.

### Backend Architecture

The backend is an **Express.js** application written in **TypeScript**, providing RESTful API endpoints. It includes **Replit's OpenID Connect (OIDC)** via **Passport.js** for web authentication and is designed for **JWT token-based authentication** for mobile. Other features include **PostgreSQL-backed sessions**, **express-rate-limit** for rate limiting, **bad-words** filter for content safety, and **sanitize-html** for XSS prevention.

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