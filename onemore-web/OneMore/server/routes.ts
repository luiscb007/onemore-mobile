import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { authenticateJWT } from "./jwtAuth";
import { setupJWTRoutes } from "./jwtRoutes";
import { insertEventSchema, baseEventFormSchema, insertEventInteractionSchema, insertConversationSchema, insertMessageSchema, insertOrganizerRatingSchema } from "@shared/schema";
import { z } from "zod";
import { detectCurrencyFromCoordinates, shouldUpdateCurrency } from "./currencyService";
import { sanitizeEventData, sanitizeMessageContent } from "./sanitization";
import { checkProfanityInObject, containsProfanity, getProfanityError } from "./profanityFilter";
import rateLimit from "express-rate-limit";
import { sendFeedbackEmail, sendAccountDeletionEmail } from "./services/emailService";

// Rate limiters for different endpoints
// Note: These run AFTER authentication, so req.user.claims.sub is always available
const createEventLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 events per hour
  message: "Too many events created. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => {
    // Use authenticated user ID (no IP fallback needed for authenticated routes)
    return req.user?.claims?.sub || 'anonymous';
  },
  skip: (req: any) => !req.user, // Skip rate limiting if not authenticated
});

const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 messages per minute
  message: "Too many messages sent. Please slow down.",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => {
    return req.user?.claims?.sub || 'anonymous';
  },
  skip: (req: any) => !req.user,
});

const interactionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 interactions per minute
  message: "Too many actions. Please slow down.",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => {
    return req.user?.claims?.sub || 'anonymous';
  },
  skip: (req: any) => !req.user,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: "Too many requests. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => {
    return req.user?.claims?.sub || 'anonymous';
  },
  skip: (req: any) => !req.user,
});

// Utility function to extract parent event ID from composite IDs (recurring events)
// Composite ID format: parentId_YYYY-MM-DD
// Returns the original ID if it's not a composite ID
function getParentEventId(eventId: string): string {
  const compositeIdPattern = /^(.+)_\d{4}-\d{2}-\d{2}$/;
  const match = eventId.match(compositeIdPattern);
  return match ? match[1] : eventId;
}

// Check user subscription tier limits (freemium model)
// Feature flag: ENABLE_TIER_RESTRICTIONS controls whether limits are enforced
async function checkUserLimits(userId: string, action: 'create' | 'attend'): Promise<{ 
  allowed: boolean; 
  reason?: string; 
  tier: string;
  upgradeRequired?: boolean;
}> {
  // Check if tier restrictions are enabled via environment variable
  if (process.env.ENABLE_TIER_RESTRICTIONS !== 'true') {
    return { allowed: true, tier: 'unrestricted' };
  }

  // Get user details to check subscription tier
  const user = await storage.getUser(userId);
  if (!user) {
    return { allowed: false, tier: 'unknown', reason: 'User not found' };
  }

  // Premium users have unlimited access
  if (user.subscriptionTier === 'premium') {
    return { allowed: true, tier: 'premium' };
  }

  // Free tier users: check monthly limits
  const currentMonth = new Date().toISOString().slice(0, 7); // Format: "2025-10"
  const usage = await storage.getMonthlyUsage(userId, currentMonth);

  // Free tier limit: 1 event created per month
  if (action === 'create' && usage.eventsCreated >= 1) {
    return { 
      allowed: false, 
      tier: 'free',
      upgradeRequired: true,
      reason: 'You have reached your free tier limit of 1 event per month. Upgrade to Premium for unlimited events.' 
    };
  }

  // Free tier limit: 1 event attendance per month
  if (action === 'attend' && usage.eventsAttended >= 1) {
    return { 
      allowed: false, 
      tier: 'free',
      upgradeRequired: true,
      reason: 'You have reached your free tier limit of 1 event attendance per month. Upgrade to Premium for unlimited access.' 
    };
  }

  // Within limits
  return { allowed: true, tier: 'free' };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware - JWT first, then Replit Auth
  app.use(authenticateJWT); // Try JWT token first (mobile)
  await setupAuth(app); // Then set up Replit Auth (web)
  
  // JWT auth routes (login, register, logout, refresh)
  setupJWTRoutes(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let user = await storage.getUser(userId);
      
      // Auto-detect currency if user has coordinates and currency should be updated
      if (user && user.currentLatitude && user.currentLongitude) {
        const currentLat = parseFloat(user.currentLatitude);
        const currentLon = parseFloat(user.currentLongitude);
        
        // Get coordinates from last currency check
        const lastCheckLat = user.lastCurrencyCheckLatitude ? parseFloat(user.lastCurrencyCheckLatitude) : null;
        const lastCheckLon = user.lastCurrencyCheckLongitude ? parseFloat(user.lastCurrencyCheckLongitude) : null;
        
        if (shouldUpdateCurrency(
          currentLat,
          currentLon,
          lastCheckLat,
          lastCheckLon,
          user.lastCurrencyCheck
        )) {
          try {
            // Detect currency and wait for it to complete
            const currency = await detectCurrencyFromCoordinates(currentLat, currentLon);
            await storage.updateUserCurrency(userId, currency, currentLat, currentLon);
            console.log(`Updated user ${userId} currency to ${currency}`);
            
            // Refetch user to get updated currency
            user = await storage.getUser(userId);
          } catch (error) {
            console.error("Error auto-detecting currency:", error);
          }
        }
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Reverse geocoding endpoint
  app.get('/api/geocode/reverse', isAuthenticated, async (req: any, res) => {
    try {
      const { lat, lon } = req.query;
      
      if (!lat || !lon) {
        return res.status(400).json({ message: "Latitude and longitude are required" });
      }
      
      // Use Nominatim for reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'OneMore Event Discovery App'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Reverse geocoding failed');
      }
      
      const data = await response.json();
      
      // Extract city name from the response
      const city = data.address?.city || 
                   data.address?.town || 
                   data.address?.village || 
                   data.address?.municipality ||
                   data.address?.county ||
                   'Unknown location';
      
      res.json({ city, fullAddress: data.display_name });
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      res.status(500).json({ message: "Failed to reverse geocode location" });
    }
  });

  // User location update
  app.post('/api/user/location', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { latitude, longitude } = req.body;
      
      if (latitude == null || longitude == null || 
          String(latitude).trim() === '' || String(longitude).trim() === '') {
        return res.status(400).json({ message: "Latitude and longitude are required" });
      }
      
      const lat = Number(latitude);
      const lon = Number(longitude);
      
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return res.status(400).json({ message: "Valid latitude and longitude are required" });
      }

      await storage.updateUserLocation(userId, lat, lon);
      
      // Auto-detect and update currency based on new location
      try {
        const user = await storage.getUser(userId);
        const lastCheckLat = user?.lastCurrencyCheckLatitude ? parseFloat(user.lastCurrencyCheckLatitude) : null;
        const lastCheckLon = user?.lastCurrencyCheckLongitude ? parseFloat(user.lastCurrencyCheckLongitude) : null;
        
        if (shouldUpdateCurrency(lat, lon, lastCheckLat, lastCheckLon, user?.lastCurrencyCheck || null)) {
          const currency = await detectCurrencyFromCoordinates(lat, lon);
          await storage.updateUserCurrency(userId, currency, lat, lon);
          console.log(`Updated user ${userId} currency to ${currency}`);
        }
      } catch (currencyError) {
        console.error("Error auto-detecting currency:", currencyError);
        // Don't fail the location update if currency detection fails
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating location:", error);
      res.status(500).json({ message: "Failed to update location" });
    }
  });

  // User search radius update
  app.put('/api/user/search-radius', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { radius } = req.body;
      
      if (radius === undefined || radius < 0 || radius > 100) {
        return res.status(400).json({ message: "Radius must be between 0 and 100 km" });
      }

      await storage.updateUserSearchRadius(userId, parseInt(radius));
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating search radius:", error);
      res.status(500).json({ message: "Failed to update search radius" });
    }
  });

  // Update user profile (name)
  app.patch('/api/user/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { firstName, lastName } = req.body;
      
      if (!firstName || firstName.trim().length === 0) {
        return res.status(400).json({ message: "First name is required" });
      }

      await storage.updateUserProfile(userId, firstName.trim(), lastName?.trim() || '');
      const updatedUser = await storage.getUser(userId);
      
      // Remove sensitive fields from response
      if (updatedUser) {
        const { passwordHash, verificationToken, verificationTokenExpiry, appleId, googleId, ...safeUser } = updatedUser;
        res.json(safeUser);
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Send feedback
  app.post('/api/feedback', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { feedback } = req.body;
      
      if (!feedback || typeof feedback !== 'string' || !feedback.trim()) {
        return res.status(400).json({ message: "Feedback is required" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonymous';
      const userEmail = user.email || 'no-email@example.com';

      await sendFeedbackEmail(userEmail, userName, feedback.trim());
      res.json({ success: true, message: "Feedback sent successfully" });
    } catch (error) {
      console.error("Error sending feedback:", error);
      res.status(500).json({ message: "Failed to send feedback" });
    }
  });

  // Delete user account
  app.delete('/api/user/delete', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { reason, feedback } = req.body;
      
      // Get user info before deletion for email
      const user = await storage.getUser(userId);
      const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonymous' : 'Anonymous';
      const userEmail = user?.email || 'no-email@example.com';
      
      // Delete user and all associated data
      await storage.deleteUser(userId);
      
      // Send notification email (don't block deletion if email fails)
      try {
        await sendAccountDeletionEmail(userEmail, userName, reason, feedback);
      } catch (emailError) {
        console.error("Error sending deletion notification email:", emailError);
      }
      
      // Logout the user
      req.logout((err: any) => {
        if (err) {
          console.error("Error logging out after account deletion:", err);
        }
        // Destroy session
        req.session.destroy((sessionErr: any) => {
          if (sessionErr) {
            console.error("Error destroying session:", sessionErr);
          }
          res.json({ success: true, message: "Account deleted successfully" });
        });
      });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  // User stats
  app.get('/api/users/:id/stats', async (req, res) => {
    try {
      const userId = req.params.id;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // Geocoding routes (proxy to LocationIQ to keep API key secure)
  app.get('/api/geocode/autocomplete', async (req, res) => {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }

      const apiKey = process.env.LOCATIONIQ_API_KEY;
      if (!apiKey) {
        console.error("LOCATIONIQ_API_KEY not configured");
        return res.status(500).json({ message: "Geocoding service not configured" });
      }

      const url = `https://api.locationiq.com/v1/autocomplete?key=${apiKey}&q=${encodeURIComponent(q)}&format=json&limit=5`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`LocationIQ API error: ${response.status} ${response.statusText}`, errorText);
        return res.status(500).json({ message: "Failed to fetch address suggestions" });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching address suggestions:", error);
      res.status(500).json({ message: "Failed to fetch address suggestions" });
    }
  });

  // Static map endpoint (proxy to LocationIQ to keep API key secure)
  app.get('/api/geocode/static-map', async (req, res) => {
    try {
      const { lat, lng } = req.query;
      
      if (!lat || !lng || typeof lat !== 'string' || typeof lng !== 'string') {
        return res.status(400).json({ message: "Parameters 'lat' and 'lng' are required" });
      }

      const apiKey = process.env.LOCATIONIQ_API_KEY;
      if (!apiKey) {
        console.error("LOCATIONIQ_API_KEY not configured");
        return res.status(500).json({ message: "Map service not configured" });
      }

      // Generate static map URL with marker
      // Size optimized for mobile screens (600x400 for retina displays)
      const mapUrl = `https://maps.locationiq.com/v3/staticmap?key=${apiKey}&center=${lat},${lng}&zoom=15&size=600x400&format=png&markers=icon:small-red-cutout|${lat},${lng}`;
      
      res.json({ mapUrl });
    } catch (error) {
      console.error("Error generating static map:", error);
      res.status(500).json({ message: "Failed to generate map" });
    }
  });

  // Currency routes
  app.get('/api/currencies', async (req, res) => {
    try {
      const currencies = await storage.getAllCurrencies();
      res.json(currencies);
    } catch (error) {
      console.error("Error fetching currencies:", error);
      res.status(500).json({ message: "Failed to fetch currencies" });
    }
  });

  app.put('/api/user/currency', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { currencyCode } = req.body;

      if (!currencyCode) {
        return res.status(400).json({ message: "Currency code is required" });
      }

      // Verify currency exists
      const currencies = await storage.getAllCurrencies();
      const validCurrency = currencies.find((c: any) => c.code === currencyCode);
      
      if (!validCurrency) {
        return res.status(400).json({ message: "Invalid currency code" });
      }

      // Update user's currency
      const user = await storage.getUser(userId);
      const lat = user?.currentLatitude ? parseFloat(user.currentLatitude) : 0;
      const lon = user?.currentLongitude ? parseFloat(user.currentLongitude) : 0;
      
      await storage.updateUserCurrency(userId, currencyCode, lat, lon);

      res.json({ success: true, message: "Currency updated successfully" });
    } catch (error) {
      console.error("Error updating currency:", error);
      res.status(500).json({ message: "Failed to update currency" });
    }
  });

  // Event routes
  app.get('/api/events', async (req, res) => {
    try {
      const { category = 'all', userId, userLat, userLng, hidePast, userRadius, search, dateFrom, dateTo, sortBy } = req.query;
      const events = await storage.getEventsByCategory(
        category as string,
        userId as string,
        userLat ? parseFloat(userLat as string) : undefined,
        userLng ? parseFloat(userLng as string) : undefined,
        hidePast === 'true',
        userRadius ? parseInt(userRadius as string) : undefined,
        search as string | undefined,
        dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo ? new Date(dateTo as string) : undefined,
        sortBy as 'date' | 'distance' | 'popularity' | undefined
      );
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get('/api/events/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const event = await storage.getEventById(req.params.id);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Events are viewable by all authenticated users
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  app.post('/api/events', isAuthenticated, createEventLimiter, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Check subscription tier limits (freemium model)
      const limitCheck = await checkUserLimits(userId, 'create');
      if (!limitCheck.allowed) {
        return res.status(403).json({ 
          message: limitCheck.reason,
          upgradeRequired: limitCheck.upgradeRequired,
          tier: limitCheck.tier
        });
      }
      
      // Sanitize input data first
      const sanitizedBody = sanitizeEventData(req.body);
      
      // Check for profanity in title and description
      const profanityField = checkProfanityInObject(sanitizedBody, ['title', 'description']);
      if (profanityField) {
        return res.status(400).json({ 
          message: getProfanityError(profanityField),
          errors: [{ path: [profanityField], message: getProfanityError(profanityField) }]
        });
      }
      
      // Custom schema to handle ISO date strings from frontend
      const createEventSchema = baseEventFormSchema.extend({
        date: z.string().transform(str => new Date(str)),
        recurrenceEndDate: z.union([
          z.string().transform(str => new Date(str)),
          z.null()
        ]),
      }).refine((data) => {
        // If event is recurring, validate that recurrenceType and recurrenceEndDate are provided
        if (data.isRecurring) {
          if (!data.recurrenceType) return false;
          if (!data.recurrenceEndDate) return false;
          
          // Validate 2-month max duration
          const startDate = data.date instanceof Date ? data.date : new Date(data.date);
          const endDate = new Date(data.recurrenceEndDate);
          const twoMonthsLater = new Date(startDate);
          twoMonthsLater.setMonth(startDate.getMonth() + 2);
          
          if (endDate > twoMonthsLater) return false;
        }
        return true;
      }, {
        message: "Recurring events must have a recurrence type and end date within 2 months of the start date"
      });
      
      const validatedData = createEventSchema.parse({
        ...sanitizedBody,
        organizerId: userId,
      });

      // Auto-generate category-based image if not provided
      if (!validatedData.imageUrl) {
        const { getCategoryImage } = await import('./categoryImages');
        validatedData.imageUrl = getCategoryImage(validatedData.category);
      }

      const event = await storage.createEvent(validatedData);
      
      // Increment monthly usage counter for event creation
      await storage.incrementMonthlyUsage(userId, 'create');
      
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid event data", errors: error.errors });
      }
      console.error("Error creating event:", error);
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  app.get('/api/events/organizer/:organizerId', async (req, res) => {
    try {
      const events = await storage.getEventsByOrganizer(req.params.organizerId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching organizer events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.put('/api/events/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const eventId = req.params.id;
      
      // Check if user owns this event
      const event = await storage.getEventById(eventId);
      if (!event || event.organizerId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this event" });
      }

      // Sanitize input data first
      const sanitizedBody = sanitizeEventData(req.body);

      // Check for profanity in title and description
      const profanityField = checkProfanityInObject(sanitizedBody, ['title', 'description']);
      if (profanityField) {
        return res.status(400).json({ 
          message: getProfanityError(profanityField),
          errors: [{ path: [profanityField], message: getProfanityError(profanityField) }]
        });
      }

      // Custom schema to handle ISO date strings from frontend
      const updateEventSchema = baseEventFormSchema.partial().extend({
        date: z.string().transform(str => new Date(str)).optional(),
      });

      const validatedData = updateEventSchema.parse(sanitizedBody);
      
      // If category changed, update image
      if (validatedData.category && validatedData.category !== event.category) {
        const { getCategoryImage } = await import('./categoryImages');
        validatedData.imageUrl = getCategoryImage(validatedData.category);
      }
      
      const updatedEvent = await storage.updateEvent(eventId, validatedData);
      
      if (!updatedEvent) {
        return res.status(404).json({ message: "Event not found" });
      }

      res.json(updatedEvent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid event data", errors: error.errors });
      }
      console.error("Error updating event:", error);
      res.status(500).json({ message: "Failed to update event" });
    }
  });

  // Cancel event (organizer only)
  app.post('/api/events/:id/cancel', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const eventId = req.params.id;
      
      // Check if user owns this event
      const event = await storage.getEventById(eventId);
      if (!event || event.organizerId !== userId) {
        return res.status(403).json({ message: "Not authorized to cancel this event" });
      }

      if (event.status === 'cancelled') {
        return res.status(400).json({ message: "Event is already cancelled" });
      }

      const cancelledEvent = await storage.cancelEvent(eventId);
      
      if (!cancelledEvent) {
        return res.status(404).json({ message: "Event not found" });
      }

      res.json(cancelledEvent);
    } catch (error) {
      console.error("Error cancelling event:", error);
      res.status(500).json({ message: "Failed to cancel event" });
    }
  });

  app.delete('/api/events/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const eventId = req.params.id;
      
      // Check if user owns this event
      const event = await storage.getEventById(eventId);
      if (!event || event.organizerId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this event" });
      }

      const deleted = await storage.deleteEvent(eventId);
      if (!deleted) {
        return res.status(404).json({ message: "Event not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  // Event interaction routes
  app.post('/api/events/:eventId/interact', isAuthenticated, interactionLimiter, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const eventId = req.params.eventId;
      const { type } = req.body;

      if (!['going', 'like', 'pass'].includes(type)) {
        return res.status(400).json({ message: "Invalid interaction type" });
      }

      // Check subscription tier limits for "going" interactions (freemium model)
      if (type === 'going') {
        const limitCheck = await checkUserLimits(userId, 'attend');
        if (!limitCheck.allowed) {
          return res.status(403).json({ 
            message: limitCheck.reason,
            upgradeRequired: limitCheck.upgradeRequired,
            tier: limitCheck.tier
          });
        }
      }

      // Extract parent event ID from composite IDs (for recurring events)
      const parentEventId = getParentEventId(eventId);

      const validatedData = insertEventInteractionSchema.parse({
        userId,
        eventId: parentEventId,
        type,
      });

      const interaction = await storage.createOrUpdateInteraction(validatedData);
      
      // Increment monthly usage counter for event attendance ("going")
      if (type === 'going') {
        await storage.incrementMonthlyUsage(userId, 'attend');
      }
      
      res.json(interaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid interaction data", errors: error.errors });
      }
      // Handle capacity errors
      if (error instanceof Error && error.message === "Event is at full capacity") {
        return res.status(400).json({ message: error.message });
      }
      if (error instanceof Error && error.message === "Event not found") {
        return res.status(404).json({ message: error.message });
      }
      console.error("Error creating interaction:", error);
      res.status(500).json({ message: "Failed to create interaction" });
    }
  });

  app.get('/api/user/events/:type', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const type = req.params.type;

      if (!['going', 'like', 'pass'].includes(type)) {
        return res.status(400).json({ message: "Invalid interaction type" });
      }

      const events = await storage.getEventsByUserInteraction(userId, type);
      res.json(events);
    } catch (error) {
      console.error("Error fetching user events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  // Waitlist routes
  app.post('/api/events/:eventId/waitlist/join', isAuthenticated, interactionLimiter, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const eventId = req.params.eventId;
      
      // Extract parent event ID from composite IDs (for recurring events)
      const parentEventId = getParentEventId(eventId);

      // Check if event exists and has capacity
      const event = await storage.getEventById(parentEventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      if (event.capacity == null) {
        return res.status(400).json({ message: "This event does not have capacity limits" });
      }

      // Check if user already has "going" status
      const interaction = await storage.getUserInteractionForEvent(userId, parentEventId);
      if (interaction && interaction.type === 'going') {
        return res.status(400).json({ message: "You are already attending this event" });
      }

      // Check if event is actually at capacity
      const goingCount = event.interactionCounts?.going || 0;
      if (goingCount < event.capacity) {
        return res.status(400).json({ message: "Event still has available spots. Please mark yourself as 'Going' instead." });
      }

      const waitlistEntry = await storage.joinWaitlist(userId, parentEventId);
      const position = await storage.getWaitlistPosition(userId, parentEventId);
      
      res.json({ ...waitlistEntry, position });
    } catch (error) {
      console.error("Error joining waitlist:", error);
      res.status(500).json({ message: "Failed to join waitlist" });
    }
  });

  app.delete('/api/events/:eventId/waitlist/leave', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const eventId = req.params.eventId;
      
      // Extract parent event ID from composite IDs (for recurring events)
      const parentEventId = getParentEventId(eventId);

      const removed = await storage.leaveWaitlist(userId, parentEventId);
      if (!removed) {
        return res.status(404).json({ message: "Not on waitlist" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error leaving waitlist:", error);
      res.status(500).json({ message: "Failed to leave waitlist" });
    }
  });

  app.get('/api/events/:eventId/waitlist/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const eventId = req.params.eventId;
      
      // Extract parent event ID from composite IDs (for recurring events)
      const parentEventId = getParentEventId(eventId);

      const status = await storage.getUserWaitlistStatus(userId, parentEventId);
      if (!status) {
        return res.json({ onWaitlist: false });
      }

      const position = await storage.getWaitlistPosition(userId, parentEventId);
      const totalCount = await storage.getWaitlistCount(parentEventId);

      res.json({
        onWaitlist: true,
        position,
        totalCount,
        joinedAt: status.createdAt,
      });
    } catch (error) {
      console.error("Error fetching waitlist status:", error);
      res.status(500).json({ message: "Failed to fetch waitlist status" });
    }
  });

  // Messaging routes
  // Create or get conversation between organizer and attendee for an event
  app.post('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { eventId, organizerId, attendeeId, otherUserId } = req.body;

      // Support both old format (organizerId + attendeeId) and new format (otherUserId)
      let finalOrganizerId: string;
      let finalAttendeeId: string;

      if (otherUserId) {
        // New format: determine roles based on event
        const event = await storage.getEventById(eventId);
        if (!event) {
          return res.status(404).json({ message: "Event not found" });
        }

        if (event.organizerId === userId) {
          // Current user is organizer, other user is attendee
          finalOrganizerId = userId;
          finalAttendeeId = otherUserId;
        } else {
          // Current user is attendee, other user is organizer
          finalOrganizerId = otherUserId;
          finalAttendeeId = userId;
        }
      } else {
        // Old format: use provided organizerId and attendeeId
        finalOrganizerId = organizerId;
        finalAttendeeId = attendeeId;
      }

      // Validate that the user is either the organizer or attendee
      if (userId !== finalOrganizerId && userId !== finalAttendeeId) {
        return res.status(403).json({ message: "Not authorized to create this conversation" });
      }

      const conversation = await storage.createOrGetConversation(eventId, finalOrganizerId, finalAttendeeId);
      res.json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  // Get user's conversations
  app.get('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getUserConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Send a message
  app.post('/api/messages', isAuthenticated, messageLimiter, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { conversationId, content } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: "Message content is required" });
      }

      // Sanitize message content to prevent XSS
      const sanitizedContent = sanitizeMessageContent(content);
      
      if (sanitizedContent.length === 0) {
        return res.status(400).json({ message: "Message content is required" });
      }

      // Check for profanity in message content
      if (containsProfanity(sanitizedContent)) {
        return res.status(400).json({ 
          message: getProfanityError('content')
        });
      }

      const message = await storage.sendMessage(conversationId, userId, sanitizedContent);
      res.json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Get messages for a conversation
  app.get('/api/conversations/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversationId = req.params.id;

      // TODO: Add authorization check to ensure user is part of this conversation
      const messages = await storage.getConversationMessages(conversationId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Mark messages as read
  app.put('/api/conversations/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversationId = req.params.id;

      await storage.markMessagesAsRead(conversationId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      res.status(500).json({ message: "Failed to mark messages as read" });
    }
  });

  // Delete a message
  app.delete('/api/messages/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const messageId = req.params.id;

      const deleted = await storage.deleteMessage(messageId, userId);
      
      if (!deleted) {
        return res.status(403).json({ message: "You can only delete your own messages" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({ message: "Failed to delete message" });
    }
  });

  // Delete a conversation (archive for user, hard-delete when both users delete)
  app.delete('/api/conversations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversationId = req.params.id;

      const deleted = await storage.deleteConversation(conversationId, userId);
      
      if (!deleted) {
        return res.status(403).json({ message: "You can only delete conversations you are part of" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ message: "Failed to delete conversation" });
    }
  });

  app.get('/api/messages/unread-count', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const count = await storage.getTotalUnreadCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  // Rating routes
  // Submit or update an organizer rating
  app.post('/api/events/:eventId/rating', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const eventId = req.params.eventId;
      const { rating, comment } = req.body;
      
      // Extract parent event ID from composite IDs (for recurring events)
      const parentEventId = getParentEventId(eventId);

      // Validate rating
      const ratingSchema = z.object({
        rating: z.number().min(1).max(5),
        comment: z.string().nullable().optional(),
      });

      const validationResult = ratingSchema.safeParse({ rating, comment });
      if (!validationResult.success) {
        console.error("Rating validation failed:", validationResult.error);
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }

      // Check eligibility
      const eligibility = await storage.checkRatingEligibility(userId, parentEventId);
      if (!eligibility.eligible) {
        return res.status(403).json({ message: eligibility.reason });
      }

      // Get event to find organizer
      const event = await storage.getEventById(parentEventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Submit rating
      const ratingData = {
        eventId: parentEventId,
        organizerId: event.organizerId,
        attendeeId: userId,
        rating: validationResult.data.rating,
        comment: validationResult.data.comment || undefined,
      };

      const submittedRating = await storage.upsertOrganizerRating(ratingData);
      
      // Return updated organizer rating summary
      const summary = await storage.getOrganizerRatingSummary(event.organizerId);
      
      res.json({ 
        rating: submittedRating, 
        organizerSummary: summary 
      });
    } catch (error) {
      console.error("Error submitting rating:", error);
      res.status(500).json({ message: "Failed to submit rating" });
    }
  });

  // Get organizer rating summary
  app.get('/api/organizers/:organizerId/rating', async (req, res) => {
    try {
      const organizerId = req.params.organizerId;
      const summary = await storage.getOrganizerRatingSummary(organizerId);
      res.json(summary);
    } catch (error) {
      console.error("Error fetching organizer rating:", error);
      res.status(500).json({ message: "Failed to fetch organizer rating" });
    }
  });

  // Get user's own rating for an event (for prefilling form)
  app.get('/api/events/:eventId/rating/me', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const eventId = req.params.eventId;
      
      // Extract parent event ID from composite IDs (for recurring events)
      const parentEventId = getParentEventId(eventId);

      const rating = await storage.getUserEventRating(userId, parentEventId);
      res.json(rating || null);
    } catch (error) {
      console.error("Error fetching user rating:", error);
      res.status(500).json({ message: "Failed to fetch user rating" });
    }
  });

  // Check rating eligibility
  app.get('/api/events/:eventId/rating/eligibility', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const eventId = req.params.eventId;
      
      // Extract parent event ID from composite IDs (for recurring events)
      const parentEventId = getParentEventId(eventId);

      const eligibility = await storage.checkRatingEligibility(userId, parentEventId);
      res.json(eligibility);
    } catch (error) {
      console.error("Error checking rating eligibility:", error);
      res.status(500).json({ message: "Failed to check rating eligibility" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
