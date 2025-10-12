import {
  users,
  currencies,
  events,
  eventInteractions,
  eventWaitlist,
  conversations,
  messages,
  organizerRatings,
  monthlyUsage,
  accountDeletions,
  type User,
  type UpsertUser,
  type Currency,
  type Event,
  type InsertEvent,
  type EventInteraction,
  type InsertEventInteraction,
  type Waitlist,
  type InsertWaitlist,
  type EventWithDetails,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type OrganizerRating,
  type InsertOrganizerRating,
  type OrganizerRatingSummary,
  type MonthlyUsage,
  type InsertMonthlyUsage,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, sql, desc, asc, ne, isNull, gte, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByAppleId(appleId: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUserWithPassword(user: { email: string; passwordHash: string; firstName?: string | null; lastName?: string | null; role: string; verificationToken?: string | null; verificationTokenExpiry?: Date | null }): Promise<User>;
  createUserWithAppleId(user: { appleId: string; email?: string | null; firstName?: string | null; lastName?: string | null; role: string; emailVerified?: boolean }): Promise<User>;
  createUserWithGoogleId(user: { googleId: string; email?: string | null; firstName?: string | null; lastName?: string | null; role: string; emailVerified?: boolean }): Promise<User>;
  updateUserLocation(userId: string, latitude: number, longitude: number): Promise<void>;
  updateUserSearchRadius(userId: string, radius: number): Promise<void>;
  updateUserProfile(userId: string, firstName: string, lastName: string): Promise<void>;
  updateUserCurrency(userId: string, currencyCode: string, checkLatitude: number, checkLongitude: number): Promise<void>;
  getUserStats(userId: string): Promise<{ eventsCreated: number; eventsAttended: number; averageRating: number }>;
  deleteUser(userId: string): Promise<void>;
  
  // Currency operations
  getAllCurrencies(): Promise<Currency[]>;
  
  // Event operations
  createEvent(event: InsertEvent): Promise<Event>;
  getEventById(id: string): Promise<EventWithDetails | undefined>;
  getEventsByCategory(category: string, userId?: string, userLat?: number, userLng?: number, hidePast?: boolean, userRadius?: number, searchQuery?: string, dateFrom?: Date, dateTo?: Date, sortBy?: 'date' | 'distance' | 'popularity'): Promise<EventWithDetails[]>;
  getEventsByOrganizer(organizerId: string): Promise<Event[]>;
  updateEvent(id: string, updates: Partial<InsertEvent>): Promise<Event | undefined>;
  cancelEvent(id: string): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<boolean>;
  
  // Event interaction operations
  createOrUpdateInteraction(interaction: InsertEventInteraction): Promise<EventInteraction>;
  getUserInteractionForEvent(userId: string, eventId: string): Promise<EventInteraction | undefined>;
  getEventsByUserInteraction(userId: string, interactionType: string): Promise<EventWithDetails[]>;
  
  // Waitlist operations
  joinWaitlist(userId: string, eventId: string): Promise<Waitlist>;
  leaveWaitlist(userId: string, eventId: string): Promise<boolean>;
  getUserWaitlistStatus(userId: string, eventId: string): Promise<Waitlist | undefined>;
  getWaitlistPosition(userId: string, eventId: string): Promise<number>;
  getWaitlistCount(eventId: string): Promise<number>;
  
  // Messaging operations
  createOrGetConversation(eventId: string, organizerId: string, attendeeId: string): Promise<Conversation>;
  getUserConversations(userId: string): Promise<any[]>;
  sendMessage(conversationId: string, senderId: string, content: string): Promise<Message>;
  getConversationMessages(conversationId: string): Promise<Message[]>;
  markMessagesAsRead(conversationId: string, userId: string): Promise<void>;
  getTotalUnreadCount(userId: string): Promise<number>;
  deleteMessage(messageId: string, userId: string): Promise<boolean>;
  deleteConversation(conversationId: string, userId: string): Promise<boolean>;
  
  // Rating operations
  upsertOrganizerRating(rating: InsertOrganizerRating): Promise<OrganizerRating>;
  getOrganizerRatingSummary(organizerId: string): Promise<OrganizerRatingSummary>;
  getUserEventRating(userId: string, eventId: string): Promise<OrganizerRating | undefined>;
  checkRatingEligibility(userId: string, eventId: string): Promise<{ eligible: boolean; reason?: string }>;
  
  // Subscription and usage tracking operations (for freemium tier)
  getMonthlyUsage(userId: string, month: string): Promise<MonthlyUsage>;
  incrementMonthlyUsage(userId: string, type: 'create' | 'attend'): Promise<void>;
  updateUserSubscription(userId: string, tier: string, subscriptionData?: { 
    status?: string; 
    startDate?: Date; 
    endDate?: Date; 
    stripeCustomerId?: string; 
    stripeSubscriptionId?: string;
  }): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(sql`${users.email} = ${email}`);
    return user;
  }

  async getUserByAppleId(appleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.appleId, appleId));
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async createUserWithPassword(userData: { email: string; passwordHash: string; firstName?: string | null; lastName?: string | null; role: string; verificationToken?: string | null; verificationTokenExpiry?: Date | null }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        email: userData.email,
        passwordHash: userData.passwordHash,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        role: userData.role,
        verificationToken: userData.verificationToken || null,
        verificationTokenExpiry: userData.verificationTokenExpiry || null,
      })
      .returning();
    return user;
  }

  async createUserWithAppleId(userData: { appleId: string; email?: string | null; firstName?: string | null; lastName?: string | null; role: string; emailVerified?: boolean }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        appleId: userData.appleId,
        email: userData.email || null,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        role: userData.role,
        emailVerified: userData.emailVerified ?? true, // Default to true for OAuth users
      })
      .returning();
    return user;
  }

  async createUserWithGoogleId(userData: { googleId: string; email?: string | null; firstName?: string | null; lastName?: string | null; role: string; emailVerified?: boolean }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        googleId: userData.googleId,
        email: userData.email || null,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        role: userData.role,
        emailVerified: userData.emailVerified ?? true, // Default to true for OAuth users
      })
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Check if a user with this email already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(sql`${users.email} = ${userData.email}`);

    if (existingUser) {
      // User exists with this email - update it but keep the existing ID
      const [updatedUser] = await db
        .update(users)
        .set({
          ...userData,
          id: existingUser.id, // Keep the existing ID
          updatedAt: new Date(),
        })
        .where(sql`${users.email} = ${userData.email}`)
        .returning();
      return updatedUser;
    }

    // No existing user - insert new one
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserLocation(userId: string, latitude: number, longitude: number): Promise<void> {
    await db
      .update(users)
      .set({
        currentLatitude: latitude.toString(),
        currentLongitude: longitude.toString(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async updateUserSearchRadius(userId: string, radius: number): Promise<void> {
    await db
      .update(users)
      .set({
        searchRadius: radius,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async updateUserProfile(userId: string, firstName: string, lastName: string): Promise<void> {
    await db
      .update(users)
      .set({
        firstName: firstName,
        lastName: lastName,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async getUserStats(userId: string): Promise<{ eventsCreated: number; eventsAttended: number; averageRating: number }> {
    // Get events created
    const [createdResult] = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(events)
      .where(eq(events.organizerId, userId));

    const eventsCreated = createdResult?.count || 0;

    // Get events attended (marked as "going")
    const [attendedResult] = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(eventInteractions)
      .where(
        and(
          eq(eventInteractions.userId, userId),
          eq(eventInteractions.type, 'going')
        )
      );

    const eventsAttended = attendedResult?.count || 0;

    // Get average rating received from attendees
    const [ratingResult] = await db
      .select({
        average: sql<number>`AVG(${organizerRatings.rating})::NUMERIC`,
      })
      .from(organizerRatings)
      .where(eq(organizerRatings.organizerId, userId));

    const averageRating = ratingResult?.average ? Number(ratingResult.average) : 0;

    return {
      eventsCreated,
      eventsAttended,
      averageRating,
    };
  }

  async updateUserCurrency(userId: string, currencyCode: string, checkLatitude: number, checkLongitude: number): Promise<void> {
    await db
      .update(users)
      .set({
        defaultCurrencyCode: currencyCode,
        lastCurrencyCheck: new Date(),
        lastCurrencyCheckLatitude: checkLatitude.toString(),
        lastCurrencyCheckLongitude: checkLongitude.toString(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  async deleteUser(userId: string): Promise<void> {
    // Delete all user data in a transaction to ensure atomicity
    await db.transaction(async (tx) => {
      // Get all events organized by this user
      const userEvents = await tx
        .select({ id: events.id })
        .from(events)
        .where(eq(events.organizerId, userId));
      
      const eventIds = userEvents.map(e => e.id);
      
      // Get all conversations involving this user
      const userConversations = await tx
        .select({ id: conversations.id })
        .from(conversations)
        .where(
          or(
            eq(conversations.organizerId, userId),
            eq(conversations.attendeeId, userId)
          )
        );
      
      const conversationIds = userConversations.map(c => c.id);
      
      // 1. Delete all messages in conversations involving this user
      if (conversationIds.length > 0) {
        await tx.delete(messages).where(
          inArray(messages.conversationId, conversationIds)
        );
      }
      
      // 2. Delete all organizer ratings for user's events and ratings given by user
      if (eventIds.length > 0) {
        await tx.delete(organizerRatings).where(
          or(
            inArray(organizerRatings.eventId, eventIds),
            eq(organizerRatings.attendeeId, userId)
          )
        );
      } else {
        await tx.delete(organizerRatings).where(
          eq(organizerRatings.attendeeId, userId)
        );
      }
      
      // 3. Delete all conversations involving this user
      if (conversationIds.length > 0) {
        await tx.delete(conversations).where(
          inArray(conversations.id, conversationIds)
        );
      }
      
      // 4. Delete all waitlist entries for user's events and entries by user
      if (eventIds.length > 0) {
        await tx.delete(eventWaitlist).where(
          or(
            inArray(eventWaitlist.eventId, eventIds),
            eq(eventWaitlist.userId, userId)
          )
        );
      } else {
        await tx.delete(eventWaitlist).where(
          eq(eventWaitlist.userId, userId)
        );
      }
      
      // 5. Delete all interactions with user's events and interactions by user
      if (eventIds.length > 0) {
        await tx.delete(eventInteractions).where(
          or(
            inArray(eventInteractions.eventId, eventIds),
            eq(eventInteractions.userId, userId)
          )
        );
      } else {
        await tx.delete(eventInteractions).where(
          eq(eventInteractions.userId, userId)
        );
      }
      
      // 6. Delete all events created by user
      if (eventIds.length > 0) {
        await tx.delete(events).where(
          inArray(events.id, eventIds)
        );
      }
      
      // 7. Delete user
      await tx.delete(users).where(eq(users.id, userId));
    });
  }

  async saveAccountDeletionFeedback(
    userId: string,
    userEmail: string,
    userName: string,
    reason?: string,
    feedback?: string
  ): Promise<void> {
    await db.insert(accountDeletions).values({
      userId,
      userEmail,
      userName,
      reason: reason || null,
      feedback: feedback || null,
    });
  }

  // Currency operations
  async getAllCurrencies(): Promise<Currency[]> {
    return await db.select().from(currencies);
  }

  // Event operations
  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db.insert(events).values(event).returning();
    return newEvent;
  }

  async getEventById(id: string): Promise<EventWithDetails | undefined> {
    const result = await db
      .select({
        event: events,
        organizer: users,
      })
      .from(events)
      .leftJoin(users, eq(events.organizerId, users.id))
      .where(eq(events.id, id));

    if (!result[0]) return undefined;

    const { event, organizer } = result[0];
    
    // Get interaction counts
    const interactionCounts = await this.getEventInteractionCounts(id);
    
    // Get organizer rating summary
    const ratingSummary = await this.getOrganizerRatingSummary(event.organizerId);
    const organizerRating = ratingSummary.totalRatings > 0 ? {
      average: ratingSummary.averageRating,
      count: ratingSummary.totalRatings,
    } : undefined;
    
    return {
      ...event,
      organizer: organizer!,
      interactionCounts,
      organizerRating,
    };
  }

  async getEventsByCategory(
    category: string, 
    userId?: string, 
    userLat?: number, 
    userLng?: number,
    hidePast?: boolean,
    userRadius?: number,
    searchQuery?: string,
    dateFrom?: Date,
    dateTo?: Date,
    sortBy?: 'date' | 'distance' | 'popularity'
  ): Promise<EventWithDetails[]> {
    let query = db
      .select({
        event: events,
        organizer: users,
        userInteraction: eventInteractions,
      })
      .from(events)
      .leftJoin(users, eq(events.organizerId, users.id))
      .leftJoin(
        eventInteractions,
        userId 
          ? and(
              eq(eventInteractions.eventId, events.id),
              eq(eventInteractions.userId, userId)
            )
          : sql`false` // This will always make the join return null when no userId
      )
      .$dynamic();

    // Build all WHERE conditions together
    // NOTE: Temporal filters (dateFrom, dateTo, hidePast) are intentionally NOT included here
    // They are applied AFTER recurring event expansion to each individual occurrence
    const conditions = [];
    
    // Apply category filter
    if (category !== "all") {
      conditions.push(eq(events.category, category as any));
    }

    // Apply search query filter (case-insensitive search in title and description)
    if (searchQuery && searchQuery.trim()) {
      const searchPattern = `%${searchQuery.trim()}%`;
      conditions.push(
        or(
          sql`${events.title} ILIKE ${searchPattern}`,
          sql`${events.description} ILIKE ${searchPattern}`
        )
      );
    }

    // Exclude user's own events from discovery and events they've interacted with
    if (userId) {
      conditions.push(ne(events.organizerId, userId)); // Not user's own events
      conditions.push(isNull(eventInteractions.type)); // No interaction yet (going, like, or pass)
    }

    // Apply all conditions together
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Note: SQL ordering removed because we need to sort AFTER expansion
    // Each recurring event generates multiple instances with different dates
    // Final sorting happens after all instances are generated and filtered

    const result = await query;

    // Helper function to calculate distance in km using Haversine formula
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    // Helper function to expand recurring events into multiple instances
    const expandRecurringEvent = (event: Event, index: number): Event[] => {
      if (!event.isRecurring || !event.recurrenceType || !event.recurrenceEndDate) {
        return [event]; // Return single event if not recurring
      }

      const instances: Event[] = [];
      const startDate = new Date(event.date);
      const endDate = new Date(event.recurrenceEndDate);
      let currentDate = new Date(startDate);
      let occurrenceIndex = 0;

      // Generate instances based on recurrence type
      while (currentDate <= endDate) {
        instances.push({
          ...event,
          // Generate unique ID for each occurrence (composite of parent ID + occurrence date)
          // This prevents React key conflicts while still allowing parent ID for interactions
          id: `${event.id}_${currentDate.toISOString().split('T')[0]}`,
          date: new Date(currentDate),
        });

        occurrenceIndex++;
        // Increment date based on recurrence type
        switch (event.recurrenceType) {
          case 'daily':
            currentDate.setDate(currentDate.getDate() + 1);
            break;
          case 'weekly':
            currentDate.setDate(currentDate.getDate() + 7);
            break;
          case 'biweekly':
            currentDate.setDate(currentDate.getDate() + 14);
            break;
          case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
        }
      }

      return instances;
    };

    // Get interaction counts and organizer ratings for each event
    const eventsWithDetails: EventWithDetails[] = [];
    let eventIndex = 0;
    for (const row of result) {
      if (!row.event || !row.organizer) continue;
      
      // Expand recurring events into multiple instances
      const eventInstances = expandRecurringEvent(row.event, eventIndex++);
      
      for (const eventInstance of eventInstances) {
        // Apply date/time filters to each instance (not just the parent event)
        const instanceDate = new Date(eventInstance.date);
        const instanceTime = eventInstance.time;
        
        // Apply dateFrom filter
        if (dateFrom && instanceDate < dateFrom) {
          continue;
        }
        
        // Apply dateTo filter (inclusive)
        if (dateTo) {
          const endOfDay = new Date(dateTo);
          endOfDay.setHours(23, 59, 59, 999);
          if (instanceDate > endOfDay) {
            continue;
          }
        }
        
        // Apply hidePast filter to instance date
        if (hidePast) {
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const eventDay = new Date(instanceDate.getFullYear(), instanceDate.getMonth(), instanceDate.getDate());
          
          if (eventDay < today) {
            continue; // Past date
          } else if (eventDay.getTime() === today.getTime()) {
            // Check time if same day
            const [hours, minutes] = instanceTime.split(':').map(Number);
            const eventMinutes = hours * 60 + minutes;
            const nowMinutes = now.getHours() * 60 + now.getMinutes();
            if (eventMinutes < nowMinutes) {
              continue; // Past time today
            }
          }
        }
        
        // Calculate distance if user location is provided
        let eventDistance: number | undefined;
        if (userLat !== undefined && userLng !== undefined) {
          const eventLat = parseFloat(eventInstance.latitude);
          const eventLng = parseFloat(eventInstance.longitude);
          eventDistance = calculateDistance(userLat, userLng, eventLat, eventLng);
          
          // Filter by radius if provided
          if (userRadius !== undefined && eventDistance > userRadius) {
            continue;
          }
        }
        
        // Use parent event ID for interaction counts (all instances share interactions)
        const parentEventId = eventInstance.id.includes('_') ? eventInstance.id.split('_')[0] : eventInstance.id;
        const interactionCounts = await this.getEventInteractionCounts(parentEventId);
        
        // Get organizer rating summary
        const ratingSummary = await this.getOrganizerRatingSummary(row.event.organizerId);
        const organizerRating = ratingSummary.totalRatings > 0 ? {
          average: ratingSummary.averageRating,
          count: ratingSummary.totalRatings,
        } : undefined;
        
        eventsWithDetails.push({
          ...eventInstance,
          organizer: row.organizer,
          userInteraction: row.userInteraction || undefined,
          interactionCounts,
          organizerRating,
          distance: eventDistance,
        });
      }
    }

    // Apply sorting based on sortBy parameter
    // Note: Since we removed SQL ordering for recurring event support,
    // we must sort the expanded instances explicitly
    if (sortBy === 'distance' && userLat !== undefined && userLng !== undefined) {
      // Sort by distance (closest first)
      eventsWithDetails.sort((a, b) => {
        const distA = calculateDistance(userLat, userLng, parseFloat(a.latitude), parseFloat(a.longitude));
        const distB = calculateDistance(userLat, userLng, parseFloat(b.latitude), parseFloat(b.longitude));
        return distA - distB;
      });
    } else if (sortBy === 'popularity') {
      // Sort by popularity (most popular first = highest going + like counts)
      eventsWithDetails.sort((a, b) => {
        const popA = (a.interactionCounts?.going || 0) + (a.interactionCounts?.like || 0);
        const popB = (b.interactionCounts?.going || 0) + (b.interactionCounts?.like || 0);
        return popB - popA; // Descending order
      });
    } else {
      // Default: Sort by date and time in ascending order (soonest first)
      eventsWithDetails.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        
        // First compare dates
        const dateDiff = dateA.getTime() - dateB.getTime();
        if (dateDiff !== 0) return dateDiff;
        
        // If same date, compare times
        const [hoursA, minutesA] = a.time.split(':').map(Number);
        const [hoursB, minutesB] = b.time.split(':').map(Number);
        const timeA = hoursA * 60 + minutesA;
        const timeB = hoursB * 60 + minutesB;
        return timeA - timeB;
      });
    }

    return eventsWithDetails;
  }

  async getEventsByOrganizer(organizerId: string): Promise<EventWithDetails[]> {
    const result = await db
      .select({
        event: events,
        organizer: users,
      })
      .from(events)
      .leftJoin(users, eq(events.organizerId, users.id))
      .where(eq(events.organizerId, organizerId))
      .orderBy(desc(events.createdAt));

    // Get interaction counts and organizer ratings for each event
    const eventsWithDetails: EventWithDetails[] = [];
    for (const row of result) {
      if (!row.event || !row.organizer) continue;
      
      const interactionCounts = await this.getEventInteractionCounts(row.event.id);
      
      // Get organizer rating summary
      const ratingSummary = await this.getOrganizerRatingSummary(row.event.organizerId);
      const organizerRating = ratingSummary.totalRatings > 0 ? {
        average: ratingSummary.averageRating,
        count: ratingSummary.totalRatings,
      } : undefined;
      
      eventsWithDetails.push({
        ...row.event,
        organizer: row.organizer,
        userInteraction: undefined, // Organizer doesn't have interactions with their own events
        interactionCounts,
        organizerRating,
      });
    }

    return eventsWithDetails;
  }

  async updateEvent(id: string, updates: Partial<InsertEvent>): Promise<Event | undefined> {
    const [updatedEvent] = await db
      .update(events)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(events.id, id))
      .returning();
    return updatedEvent;
  }

  async cancelEvent(id: string): Promise<Event | undefined> {
    const [cancelledEvent] = await db
      .update(events)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(events.id, id))
      .returning();
    return cancelledEvent;
  }

  async deleteEvent(id: string): Promise<boolean> {
    const result = await db.delete(events).where(eq(events.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Event interaction operations
  async createOrUpdateInteraction(interaction: InsertEventInteraction): Promise<EventInteraction> {
    // Use a transaction to prevent race conditions when checking capacity
    return await db.transaction(async (tx) => {
      // Check if user already has an interaction for this event
      const [existing] = await tx
        .select()
        .from(eventInteractions)
        .where(
          and(
            eq(eventInteractions.userId, interaction.userId),
            eq(eventInteractions.eventId, interaction.eventId)
          )
        );

      // Check capacity limit if marking as "going" 
      if (interaction.type === 'going') {
        // Lock the event row to prevent concurrent capacity checks
        const [event] = await tx
          .select({ id: events.id, capacity: events.capacity })
          .from(events)
          .where(eq(events.id, interaction.eventId))
          .for('update');

        if (!event) {
          throw new Error("Event not found");
        }

        // If event has a capacity limit (explicitly check for null/undefined, not falsy)
        if (event.capacity != null) {
          // Count current "going" interactions
          const [result] = await tx
            .select({ count: sql<number>`count(*)::int` })
            .from(eventInteractions)
            .where(
              and(
                eq(eventInteractions.eventId, interaction.eventId),
                eq(eventInteractions.type, 'going')
              )
            );

          const currentGoingCount = result?.count || 0;
          
          // Check if event is at capacity
          // If user already has a "going" status, they're not adding to the count
          if (!existing || existing.type !== 'going') {
            if (currentGoingCount >= event.capacity) {
              throw new Error("Event is at full capacity");
            }
          }
        }
      }

      // Update existing interaction or create new one
      if (existing) {
        const [updated] = await tx
          .update(eventInteractions)
          .set({ type: interaction.type })
          .where(eq(eventInteractions.id, existing.id))
          .returning();
        return updated;
      } else {
        const [created] = await tx
          .insert(eventInteractions)
          .values(interaction)
          .returning();
        return created;
      }
    });
  }

  async getUserInteractionForEvent(userId: string, eventId: string): Promise<EventInteraction | undefined> {
    const [interaction] = await db
      .select()
      .from(eventInteractions)
      .where(
        and(
          eq(eventInteractions.userId, userId),
          eq(eventInteractions.eventId, eventId)
        )
      );
    return interaction;
  }

  async getEventsByUserInteraction(userId: string, interactionType: string): Promise<EventWithDetails[]> {
    const result = await db
      .select({
        event: events,
        organizer: users,
        interaction: eventInteractions,
      })
      .from(eventInteractions)
      .innerJoin(events, eq(eventInteractions.eventId, events.id))
      .leftJoin(users, eq(events.organizerId, users.id))
      .where(
        and(
          eq(eventInteractions.userId, userId),
          eq(eventInteractions.type, interactionType)
        )
      )
      .orderBy(desc(eventInteractions.createdAt));

    const eventsWithDetails: EventWithDetails[] = [];
    for (const row of result) {
      if (!row.event || !row.organizer) continue;
      
      const interactionCounts = await this.getEventInteractionCounts(row.event.id);
      
      // Check if user has rated this event
      const userRating = await this.getUserEventRating(userId, row.event.id);
      
      eventsWithDetails.push({
        ...row.event,
        organizer: row.organizer,
        userInteraction: row.interaction,
        interactionCounts,
        userRating: userRating || null,
      });
    }

    return eventsWithDetails;
  }

  private async getEventInteractionCounts(eventId: string) {
    const counts = await db
      .select({
        type: eventInteractions.type,
        count: sql<number>`count(*)::int`,
      })
      .from(eventInteractions)
      .where(eq(eventInteractions.eventId, eventId))
      .groupBy(eventInteractions.type);

    const result = {
      going: 0,
      like: 0,
      pass: 0,
    };

    counts.forEach((count) => {
      if (count.type in result) {
        result[count.type as keyof typeof result] = count.count;
      }
    });

    return result;
  }

  // Waitlist operations
  async joinWaitlist(userId: string, eventId: string): Promise<Waitlist> {
    // Check if user is already on waitlist
    const existing = await this.getUserWaitlistStatus(userId, eventId);
    if (existing) {
      return existing;
    }

    const [waitlistEntry] = await db
      .insert(eventWaitlist)
      .values({ userId, eventId })
      .returning();
    return waitlistEntry;
  }

  async leaveWaitlist(userId: string, eventId: string): Promise<boolean> {
    const result = await db
      .delete(eventWaitlist)
      .where(
        and(
          eq(eventWaitlist.userId, userId),
          eq(eventWaitlist.eventId, eventId)
        )
      );
    return (result.rowCount ?? 0) > 0;
  }

  async getUserWaitlistStatus(userId: string, eventId: string): Promise<Waitlist | undefined> {
    const [entry] = await db
      .select()
      .from(eventWaitlist)
      .where(
        and(
          eq(eventWaitlist.userId, userId),
          eq(eventWaitlist.eventId, eventId)
        )
      );
    return entry;
  }

  async getWaitlistPosition(userId: string, eventId: string): Promise<number> {
    // Get all waitlist entries for this event, ordered by creation time
    const waitlistEntries = await db
      .select()
      .from(eventWaitlist)
      .where(eq(eventWaitlist.eventId, eventId))
      .orderBy(asc(eventWaitlist.createdAt));

    // Find the user's position (1-indexed)
    const position = waitlistEntries.findIndex(entry => entry.userId === userId);
    return position === -1 ? 0 : position + 1;
  }

  async getWaitlistCount(eventId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(eventWaitlist)
      .where(eq(eventWaitlist.eventId, eventId));
    return result?.count || 0;
  }

  // Messaging operations
  async createOrGetConversation(eventId: string, organizerId: string, attendeeId: string): Promise<Conversation> {
    // First try to find existing conversation
    const [existing] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.eventId, eventId),
          eq(conversations.organizerId, organizerId),
          eq(conversations.attendeeId, attendeeId)
        )
      );

    if (existing) {
      return existing;
    }

    // Create new conversation
    const [conversation] = await db
      .insert(conversations)
      .values({
        eventId,
        organizerId,
        attendeeId,
      })
      .returning();

    return conversation;
  }

  async getUserConversations(userId: string): Promise<any[]> {
    // Get conversations where user is either organizer or attendee
    // Exclude conversations where user has archived them (deletedAt timestamp is set)
    const result = await db
      .select({
        conversation: conversations,
        event: events,
        organizer: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(conversations)
      .leftJoin(events, eq(conversations.eventId, events.id))
      .leftJoin(users, eq(conversations.organizerId, users.id))
      .where(
        or(
          and(
            eq(conversations.organizerId, userId),
            isNull(conversations.organizerDeletedAt)
          ),
          and(
            eq(conversations.attendeeId, userId),
            isNull(conversations.attendeeDeletedAt)
          )
        )
      )
      .orderBy(desc(conversations.lastMessageAt));

    // Process results to include otherUser
    const conversationsWithDetails = result.map(row => {
      const { conversation, event, organizer } = row;
      
      // Determine who the "other user" is based on the current user
      const isOrganizer = conversation.organizerId === userId;
      const otherUserId = isOrganizer ? conversation.attendeeId : conversation.organizerId;
      
      // For now, we'll need to fetch the attendee separately if user is organizer
      // But if user is attendee, organizer is already fetched
      const otherUser = isOrganizer ? null : organizer;
      
      return {
        ...conversation,
        event,
        otherUser,
        needsAttendeeDetails: isOrganizer ? otherUserId : null,
      };
    });

    // Fetch attendee details where needed
    const conversationsNeedingAttendee = conversationsWithDetails.filter(c => c.needsAttendeeDetails);
    if (conversationsNeedingAttendee.length > 0) {
      const attendeeIds = conversationsNeedingAttendee.map(c => c.needsAttendeeDetails).filter(Boolean) as string[];
      const attendees = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        })
        .from(users)
        .where(inArray(users.id, attendeeIds));
      
      const attendeeMap = new Map(attendees.map(a => [a.id, a]));
      
      // Update conversations with attendee details
      conversationsWithDetails.forEach(conv => {
        if (conv.needsAttendeeDetails) {
          conv.otherUser = attendeeMap.get(conv.needsAttendeeDetails) || null;
        }
      });
    }

    // Get unread message counts for each conversation
    const conversationIds = conversationsWithDetails.map(c => c.id);
    if (conversationIds.length > 0) {
      const unreadCounts = await db
        .select({
          conversationId: messages.conversationId,
          count: sql<number>`count(*)::int`,
        })
        .from(messages)
        .where(
          and(
            inArray(messages.conversationId, conversationIds),
            eq(messages.isRead, false),
            ne(messages.senderId, userId) // Only count messages not from current user
          )
        )
        .groupBy(messages.conversationId);
      
      const unreadMap = new Map(unreadCounts.map(u => [u.conversationId, u.count]));
      
      // Add unread count to conversations
      conversationsWithDetails.forEach((conv: any) => {
        conv.unreadCount = unreadMap.get(conv.id) || 0;
      });
    }

    // Return conversations without the temporary field
    return conversationsWithDetails.map(conv => {
      const { needsAttendeeDetails, ...cleanConv } = conv;
      return cleanConv;
    });
  }

  async sendMessage(conversationId: string, senderId: string, content: string): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values({
        conversationId,
        senderId,
        content,
      })
      .returning();

    // Update conversation's lastMessageAt
    await db
      .update(conversations)
      .set({
        lastMessageAt: new Date(),
      })
      .where(eq(conversations.id, conversationId));

    return message;
  }

  async getConversationMessages(conversationId: string): Promise<Message[]> {
    const result = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt));

    return result;
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    await db
      .update(messages)
      .set({
        isRead: true,
      })
      .where(
        and(
          eq(messages.conversationId, conversationId),
          ne(messages.senderId, userId) // Don't mark own messages as read
        )
      );
  }

  async getTotalUnreadCount(userId: string): Promise<number> {
    // Get all conversations for this user (exclude archived conversations)
    const userConversations = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(
        or(
          and(
            eq(conversations.organizerId, userId),
            isNull(conversations.organizerDeletedAt)
          ),
          and(
            eq(conversations.attendeeId, userId),
            isNull(conversations.attendeeDeletedAt)
          )
        )
      );

    if (userConversations.length === 0) {
      return 0;
    }

    const conversationIds = userConversations.map(c => c.id);

    // Count all unread messages in user's conversations
    const [result] = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(messages)
      .where(
        and(
          inArray(messages.conversationId, conversationIds),
          eq(messages.isRead, false),
          ne(messages.senderId, userId) // Only count messages not from current user
        )
      );

    return result?.count || 0;
  }

  async deleteMessage(messageId: string, userId: string): Promise<boolean> {
    // First check if the message exists and belongs to the user
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId));

    if (!message) {
      return false;
    }

    // Only allow user to delete their own messages
    if (message.senderId !== userId) {
      return false;
    }

    // Delete the message
    const result = await db
      .delete(messages)
      .where(eq(messages.id, messageId))
      .returning();

    return result.length > 0;
  }

  async deleteConversation(conversationId: string, userId: string): Promise<boolean> {
    // Get the conversation
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId));

    if (!conversation) {
      return false;
    }

    // Check if user is a participant (organizer or attendee)
    const isOrganizer = conversation.organizerId === userId;
    const isAttendee = conversation.attendeeId === userId;

    if (!isOrganizer && !isAttendee) {
      return false;
    }

    // Determine which timestamp to set
    const now = new Date();
    const updateData: any = {};

    if (isOrganizer) {
      updateData.organizerDeletedAt = now;
    } else {
      updateData.attendeeDeletedAt = now;
    }

    // Update the conversation with the deleted timestamp
    const [updated] = await db
      .update(conversations)
      .set(updateData)
      .where(eq(conversations.id, conversationId))
      .returning();

    // Check if both parties have deleted the conversation
    const bothDeleted = updated.organizerDeletedAt && updated.attendeeDeletedAt;

    if (bothDeleted) {
      // Hard delete: remove all messages and the conversation
      await db
        .delete(messages)
        .where(eq(messages.conversationId, conversationId));

      await db
        .delete(conversations)
        .where(eq(conversations.id, conversationId));
    }

    return true;
  }

  // Rating operations
  async upsertOrganizerRating(rating: InsertOrganizerRating): Promise<OrganizerRating> {
    // Check if rating already exists
    const [existing] = await db
      .select()
      .from(organizerRatings)
      .where(
        and(
          eq(organizerRatings.eventId, rating.eventId),
          eq(organizerRatings.attendeeId, rating.attendeeId)
        )
      );

    if (existing) {
      // Update existing rating
      const [updated] = await db
        .update(organizerRatings)
        .set({
          rating: rating.rating,
          comment: rating.comment,
          updatedAt: new Date(),
        })
        .where(eq(organizerRatings.id, existing.id))
        .returning();
      return updated;
    } else {
      // Create new rating
      const [created] = await db
        .insert(organizerRatings)
        .values(rating)
        .returning();
      return created;
    }
  }

  async getOrganizerRatingSummary(organizerId: string): Promise<OrganizerRatingSummary> {
    const [result] = await db
      .select({
        averageRating: sql<number>`AVG(${organizerRatings.rating})::NUMERIC`,
        totalRatings: sql<number>`COUNT(*)::INTEGER`,
      })
      .from(organizerRatings)
      .where(eq(organizerRatings.organizerId, organizerId));

    return {
      organizerId,
      averageRating: result ? Number(result.averageRating) : 0,
      totalRatings: result ? result.totalRatings : 0,
    };
  }

  async getUserEventRating(userId: string, eventId: string): Promise<OrganizerRating | undefined> {
    const [rating] = await db
      .select()
      .from(organizerRatings)
      .where(
        and(
          eq(organizerRatings.eventId, eventId),
          eq(organizerRatings.attendeeId, userId)
        )
      );

    return rating;
  }

  async checkRatingEligibility(userId: string, eventId: string): Promise<{ eligible: boolean; reason?: string }> {
    // Get event details
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId));

    if (!event) {
      return { eligible: false, reason: "Event not found" };
    }

    // Check if user is the organizer
    if (event.organizerId === userId) {
      return { eligible: false, reason: "Cannot rate your own event" };
    }

    // Check if user marked "going" to the event
    const [interaction] = await db
      .select()
      .from(eventInteractions)
      .where(
        and(
          eq(eventInteractions.eventId, eventId),
          eq(eventInteractions.userId, userId),
          eq(eventInteractions.type, "going")
        )
      );

    if (!interaction) {
      return { eligible: false, reason: "Must mark 'Going' to rate this event" };
    }

    // Check if 8 hours have passed since event start
    const eventStartTime = new Date(event.date);
    const now = new Date();
    const eightHoursInMs = 8 * 60 * 60 * 1000;
    const timeSinceEvent = now.getTime() - eventStartTime.getTime();

    if (timeSinceEvent < eightHoursInMs) {
      const hoursRemaining = Math.ceil((eightHoursInMs - timeSinceEvent) / (60 * 60 * 1000));
      return { 
        eligible: false, 
        reason: `Rating available in ${hoursRemaining} hour(s) after event starts` 
      };
    }

    return { eligible: true };
  }

  // Subscription and usage tracking operations
  async getMonthlyUsage(userId: string, month: string): Promise<MonthlyUsage> {
    const [usage] = await db
      .select()
      .from(monthlyUsage)
      .where(
        and(
          eq(monthlyUsage.userId, userId),
          eq(monthlyUsage.month, month)
        )
      );

    // If no record exists, return default values
    if (!usage) {
      return {
        id: '',
        userId,
        month,
        eventsCreated: 0,
        eventsAttended: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return usage;
  }

  async incrementMonthlyUsage(userId: string, type: 'create' | 'attend'): Promise<void> {
    const currentMonth = new Date().toISOString().slice(0, 7); // Format: "2025-10"
    
    // Try to increment existing record
    const existing = await this.getMonthlyUsage(userId, currentMonth);
    
    if (existing.id) {
      // Update existing record
      const updateField = type === 'create' ? 'eventsCreated' : 'eventsAttended';
      await db
        .update(monthlyUsage)
        .set({
          [updateField]: sql`${monthlyUsage[updateField]} + 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(monthlyUsage.userId, userId),
            eq(monthlyUsage.month, currentMonth)
          )
        );
    } else {
      // Create new record
      const insertData: InsertMonthlyUsage = {
        userId,
        month: currentMonth,
        eventsCreated: type === 'create' ? 1 : 0,
        eventsAttended: type === 'attend' ? 1 : 0,
      };
      await db.insert(monthlyUsage).values(insertData);
    }
  }

  async updateUserSubscription(
    userId: string, 
    tier: string, 
    subscriptionData?: { 
      status?: string; 
      startDate?: Date; 
      endDate?: Date; 
      stripeCustomerId?: string; 
      stripeSubscriptionId?: string;
    }
  ): Promise<User> {
    const updateData: any = {
      subscriptionTier: tier,
      updatedAt: new Date(),
    };

    if (subscriptionData) {
      if (subscriptionData.status) updateData.subscriptionStatus = subscriptionData.status;
      if (subscriptionData.startDate) updateData.subscriptionStartDate = subscriptionData.startDate;
      if (subscriptionData.endDate) updateData.subscriptionEndDate = subscriptionData.endDate;
      if (subscriptionData.stripeCustomerId) updateData.stripeCustomerId = subscriptionData.stripeCustomerId;
      if (subscriptionData.stripeSubscriptionId) updateData.stripeSubscriptionId = subscriptionData.stripeSubscriptionId;
    }

    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    return updated;
  }
}

export const storage = new DatabaseStorage();
