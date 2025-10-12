import { sql } from "drizzle-orm";
import { 
  pgTable, 
  varchar, 
  text, 
  timestamp, 
  decimal, 
  integer,
  boolean,
  pgEnum,
  jsonb,
  index,
  uniqueIndex
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Currencies table
export const currencies = pgTable("currencies", {
  code: varchar("code", { length: 3 }).primaryKey(), // ISO 4217 code (EUR, PLN, GBP)
  symbol: varchar("symbol", { length: 10 }).notNull(), // Currency symbol (€, zł, £)
  name: varchar("name").notNull(), // Display name (Euro, Polish Zloty, British Pound)
  countryCodes: text("country_codes").array(), // ISO country codes where this currency is used
});

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  passwordHash: varchar("password_hash"), // For mobile JWT auth (null for OAuth users)
  appleId: varchar("apple_id").unique(), // For Apple Sign In (null for non-Apple users)
  googleId: varchar("google_id").unique(), // For Google Sign In (null for non-Google users)
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("attendee"), // attendee or organizer
  emailVerified: boolean("email_verified").notNull().default(false), // Email verification status
  verificationToken: varchar("verification_token"), // Token for email verification (null after verified)
  verificationTokenExpiry: timestamp("verification_token_expiry"), // Token expiry time
  currentLatitude: decimal("current_latitude", { precision: 10, scale: 7 }),
  currentLongitude: decimal("current_longitude", { precision: 10, scale: 7 }),
  searchRadius: integer("search_radius").notNull().default(100), // Search radius in km (0-100)
  defaultCurrencyCode: varchar("default_currency_code", { length: 3 }).default("EUR").references(() => currencies.code), // Default to EUR
  lastCurrencyCheck: timestamp("last_currency_check"), // Last time currency was auto-detected
  lastCurrencyCheckLatitude: decimal("last_currency_check_latitude", { precision: 10, scale: 7 }), // Latitude when currency was last checked
  lastCurrencyCheckLongitude: decimal("last_currency_check_longitude", { precision: 10, scale: 7 }), // Longitude when currency was last checked
  subscriptionTier: varchar("subscription_tier").notNull().default("free"), // "free" or "premium"
  subscriptionStatus: varchar("subscription_status").default("active"), // "active", "cancelled", "expired"
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  stripeCustomerId: varchar("stripe_customer_id"), // For future Stripe integration
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Event categories enum
export const eventCategoryEnum = pgEnum("event_category", [
  "arts", 
  "community", 
  "culture", 
  "sports", 
  "workshops"
]);

// Event recurrence type enum
export const recurrenceTypeEnum = pgEnum("recurrence_type", [
  "daily",
  "weekly",
  "biweekly",
  "monthly"
]);

// Events table
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  category: eventCategoryEnum("category").notNull(),
  organizerId: varchar("organizer_id").notNull().references(() => users.id),
  date: timestamp("date").notNull(),
  time: varchar("time").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  address: text("address").notNull(),
  priceAmount: decimal("price_amount", { precision: 10, scale: 2 }), // Nullable for free events
  priceCurrencyCode: varchar("price_currency_code", { length: 3 }).default("EUR").references(() => currencies.code),
  capacity: integer("capacity"),
  durationHours: decimal("duration_hours", { precision: 4, scale: 2 }), // Event duration in hours (e.g., 2.5 for 2.5 hours)
  imageUrl: varchar("image_url"),
  status: varchar("status").notNull().default("active"), // active, cancelled, completed
  isRecurring: boolean("is_recurring").notNull().default(false),
  recurrenceType: recurrenceTypeEnum("recurrence_type"), // Null for non-recurring events
  recurrenceEndDate: timestamp("recurrence_end_date"), // Null for non-recurring events, max 2 months from start date
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Event interactions (going, like, pass)
export const eventInteractions = pgTable("event_interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  eventId: varchar("event_id").notNull().references(() => events.id),
  type: varchar("type").notNull(), // going, like, pass
  createdAt: timestamp("created_at").defaultNow(),
});

// Event waitlist - users waiting for spots when event is full
export const eventWaitlist = pgTable("event_waitlist", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  eventId: varchar("event_id").notNull().references(() => events.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("event_waitlist_event_user_unique").on(table.eventId, table.userId), // Unique waitlist per user per event
]);

// Conversations table - tracks organizer-attendee conversations for events
export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id),
  organizerId: varchar("organizer_id").notNull().references(() => users.id),
  attendeeId: varchar("attendee_id").notNull().references(() => users.id),
  lastMessageAt: timestamp("last_message_at"),
  organizerDeletedAt: timestamp("organizer_deleted_at"),
  attendeeDeletedAt: timestamp("attendee_deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages table - individual messages within conversations
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Organizer ratings table - attendees can rate organizers after events
export const organizerRatings = pgTable(
  "organizer_ratings",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    eventId: varchar("event_id").notNull().references(() => events.id),
    organizerId: varchar("organizer_id").notNull().references(() => users.id),
    attendeeId: varchar("attendee_id").notNull().references(() => users.id),
    rating: integer("rating").notNull(), // 1-5 stars
    comment: text("comment"), // Optional comment
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_organizer_ratings_organizer").on(table.organizerId),
    index("idx_organizer_ratings_event").on(table.eventId),
    index("idx_organizer_ratings_unique").on(table.eventId, table.attendeeId), // Unique rating per event per attendee
  ],
);

// Monthly usage tracking - for freemium tier limits
export const monthlyUsage = pgTable("monthly_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  month: varchar("month").notNull(), // Format: "2025-10" (YYYY-MM)
  eventsCreated: integer("events_created").notNull().default(0),
  eventsAttended: integer("events_attended").notNull().default(0), // Count of "going" interactions
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  uniqueIndex("monthly_usage_user_month_unique").on(table.userId, table.month),
]);

// Account deletions - track user feedback when deleting accounts
export const accountDeletions = pgTable("account_deletions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"), // User ID before deletion (no FK since user is deleted)
  userEmail: varchar("user_email"),
  userName: varchar("user_name"),
  reason: varchar("reason"), // Predefined reason from app
  feedback: text("feedback"), // Optional user-provided feedback
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const currenciesRelations = relations(currencies, ({ many }) => ({
  users: many(users),
  events: many(events),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  defaultCurrency: one(currencies, {
    fields: [users.defaultCurrencyCode],
    references: [currencies.code],
  }),
  organizedEvents: many(events),
  eventInteractions: many(eventInteractions),
  organizerConversations: many(conversations, { relationName: "organizer" }),
  attendeeConversations: many(conversations, { relationName: "attendee" }),
  sentMessages: many(messages),
  receivedRatings: many(organizerRatings, { relationName: "organizer" }),
  givenRatings: many(organizerRatings, { relationName: "attendee" }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  organizer: one(users, {
    fields: [events.organizerId],
    references: [users.id],
  }),
  priceCurrency: one(currencies, {
    fields: [events.priceCurrencyCode],
    references: [currencies.code],
  }),
  interactions: many(eventInteractions),
  conversations: many(conversations),
  organizerRatings: many(organizerRatings),
}));

export const eventInteractionsRelations = relations(eventInteractions, ({ one }) => ({
  user: one(users, {
    fields: [eventInteractions.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [eventInteractions.eventId],
    references: [events.id],
  }),
}));

export const eventWaitlistRelations = relations(eventWaitlist, ({ one }) => ({
  user: one(users, {
    fields: [eventWaitlist.userId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [eventWaitlist.eventId],
    references: [events.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  event: one(events, {
    fields: [conversations.eventId],
    references: [events.id],
  }),
  organizer: one(users, {
    fields: [conversations.organizerId],
    references: [users.id],
    relationName: "organizer",
  }),
  attendee: one(users, {
    fields: [conversations.attendeeId],
    references: [users.id],
    relationName: "attendee",
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

export const organizerRatingsRelations = relations(organizerRatings, ({ one }) => ({
  event: one(events, {
    fields: [organizerRatings.eventId],
    references: [events.id],
  }),
  organizer: one(users, {
    fields: [organizerRatings.organizerId],
    references: [users.id],
    relationName: "organizer",
  }),
  attendee: one(users, {
    fields: [organizerRatings.attendeeId],
    references: [users.id],
    relationName: "attendee",
  }),
}));

// Insert schemas
export const insertCurrencySchema = createInsertSchema(currencies);

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

const baseInsertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEventSchema = baseInsertEventSchema.refine((data) => {
  // If event is recurring, validate that recurrenceType and recurrenceEndDate are provided
  if (data.isRecurring) {
    if (!data.recurrenceType) return false;
    if (!data.recurrenceEndDate) return false;
    
    // Validate that recurrenceEndDate is not more than 2 months from start date
    const startDate = new Date(data.date);
    const endDate = new Date(data.recurrenceEndDate);
    const twoMonthsFromStart = new Date(startDate);
    twoMonthsFromStart.setMonth(twoMonthsFromStart.getMonth() + 2);
    
    if (endDate > twoMonthsFromStart) return false;
    if (endDate < startDate) return false;
  }
  return true;
}, {
  message: "Recurring events must have a recurrence type and end date within 2 months of the start date"
});

// Export the base schema for use in forms that need to extend it
export const baseEventFormSchema = baseInsertEventSchema;

export const insertEventInteractionSchema = createInsertSchema(eventInteractions).omit({
  id: true,
  createdAt: true,
});

export const insertWaitlistSchema = createInsertSchema(eventWaitlist).omit({
  id: true,
  createdAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  lastMessageAt: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertOrganizerRatingSchema = createInsertSchema(organizerRatings)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    rating: z.number().min(1).max(5),
    comment: z.string().optional(),
  });

export const insertMonthlyUsageSchema = createInsertSchema(monthlyUsage).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAccountDeletionSchema = createInsertSchema(accountDeletions).omit({
  id: true,
  createdAt: true,
});

// Types
export type Currency = typeof currencies.$inferSelect;
export type InsertCurrency = z.infer<typeof insertCurrencySchema>;
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEventInteraction = z.infer<typeof insertEventInteractionSchema>;
export type EventInteraction = typeof eventInteractions.$inferSelect;
export type InsertWaitlist = z.infer<typeof insertWaitlistSchema>;
export type Waitlist = typeof eventWaitlist.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertOrganizerRating = z.infer<typeof insertOrganizerRatingSchema>;
export type OrganizerRating = typeof organizerRatings.$inferSelect;
export type InsertMonthlyUsage = z.infer<typeof insertMonthlyUsageSchema>;
export type MonthlyUsage = typeof monthlyUsage.$inferSelect;
export type InsertAccountDeletion = z.infer<typeof insertAccountDeletionSchema>;
export type AccountDeletion = typeof accountDeletions.$inferSelect;

// Event with organizer and interaction info
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
  distance?: number; // Distance in kilometers from user to event
};

// Organizer rating summary
export type OrganizerRatingSummary = {
  organizerId: string;
  averageRating: number;
  totalRatings: number;
};
