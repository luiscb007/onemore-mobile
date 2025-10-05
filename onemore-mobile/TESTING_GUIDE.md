# Mobile App Testing Guide

## Testing Waitlist & Rating Flows

### Prerequisites
- Backend server running with all API endpoints active
- Mobile app connected to backend (`EXPO_PUBLIC_API_URL` configured)
- At least 2 test user accounts for interaction testing

---

## Waitlist Flow Testing

### Setup
1. Create a test event with limited capacity (e.g., max 2 attendees)
2. Have users interact with the event until capacity is reached

### Test Scenarios

#### ✅ Scenario 1: Join Waitlist (Event Full)
**Steps:**
1. Open an event that has reached max capacity
2. Verify "Join Waitlist" button is displayed
3. Tap "Join Waitlist"
4. Verify success alert: "You have been added to the waitlist!"
5. Verify waitlist position is displayed (e.g., "Position: 1")

**Expected API Call:**
```
POST /api/events/{eventId}/waitlist/join
Response: 200 OK
```

#### ✅ Scenario 2: View Waitlist Status
**Steps:**
1. Open an event you're waitlisted for
2. Verify waitlist info shows:
   - Current position number
   - "Leave Waitlist" button

**Expected API Call:**
```
GET /api/events/{eventId}/waitlist/status
Response: {
  isOnWaitlist: true,
  position: 1,
  totalWaitlisted: 3
}
```

#### ✅ Scenario 3: Leave Waitlist
**Steps:**
1. Open an event you're waitlisted for
2. Tap "Leave Waitlist"
3. Verify success alert: "You have been removed from the waitlist."
4. Verify "Join Waitlist" button reappears

**Expected API Call:**
```
DELETE /api/events/{eventId}/waitlist/leave
Response: 200 OK
```

#### ✅ Scenario 4: Waitlist Not Shown (Event Not Full)
**Steps:**
1. Open an event with available capacity
2. Verify NO waitlist controls are shown
3. Verify regular interaction buttons (Going/Like/Pass) are visible

---

## Rating Flow Testing

### Setup
1. Create a test event
2. Mark yourself as "Going" to that event
3. Ensure event date has passed (for eligibility)

### Test Scenarios

#### ✅ Scenario 1: Check Rating Eligibility (Eligible)
**Steps:**
1. Open a past event you attended
2. Verify "Rate This Event" button is displayed
3. Button should show star icon

**Expected API Call:**
```
GET /api/events/{eventId}/rating/eligibility
Response: {
  canRate: true
}
```

#### ✅ Scenario 2: Submit Rating
**Steps:**
1. Tap "Rate This Event" button
2. Verify modal opens with:
   - Title: "Rate the Organizer"
   - 5 star selection
   - Optional comment field
   - Cancel and Submit buttons
3. Select star rating (e.g., 4 stars)
4. Add optional comment: "Great event, well organized!"
5. Tap "Submit"
6. Verify success alert: "Thank you for your rating!"
7. Verify modal closes

**Expected API Call:**
```
POST /api/events/{eventId}/rating
Body: {
  rating: 4,
  comment: "Great event, well organized!"
}
Response: 200 OK
```

#### ✅ Scenario 3: View Organizer Rating
**Steps:**
1. Open an event
2. Verify organizer rating is displayed if available:
   - Format: "⭐ Organizer: 4.5 (12 ratings)"
   - Shows average rating and total count

**Expected API Call:**
```
GET /api/organizers/{organizerId}/rating
Response: {
  averageRating: 4.5,
  totalRatings: 12
}
```

#### ✅ Scenario 4: Rating Not Available (Ineligible)
**Steps:**
1. Open an event you haven't attended or is upcoming
2. Verify "Rate This Event" button is NOT displayed

**Expected API Call:**
```
GET /api/events/{eventId}/rating/eligibility
Response: {
  canRate: false,
  reason: "You must attend the event to rate it"
}
```

---

## Integration Testing Checklist

### Event Detail Screen Integration
- [ ] Event details display correctly (title, description, date, location)
- [ ] Map preview loads and shows event location
- [ ] Tap map preview opens device maps app
- [ ] Attendee count shows: "X / Y attending"
- [ ] Full event shows "(FULL)" indicator
- [ ] Organizer rating displays when available
- [ ] Interaction buttons work (Going/Like/Pass)
- [ ] Active interaction state persists and highlights correctly

### Messaging Integration (Already Tested)
- [x] Conversation list loads
- [x] Unread counts display
- [x] Chat threads open and display messages
- [x] Messages send successfully
- [x] Mark as read works (unread count clears)

### Navigation Flow
- [ ] Home screen event cards navigate to EventDetail
- [ ] EventDetail back button returns to Home
- [ ] All tab navigation works correctly
- [ ] Deep linking to specific events works

---

## API Endpoints Reference

### Waitlist Endpoints
```
POST   /api/events/:eventId/waitlist/join     - Join waitlist
DELETE /api/events/:eventId/waitlist/leave    - Leave waitlist  
GET    /api/events/:eventId/waitlist/status   - Get waitlist status
```

### Rating Endpoints
```
POST /api/events/:eventId/rating              - Submit rating
GET  /api/organizers/:organizerId/rating      - Get organizer rating
GET  /api/events/:eventId/rating/me           - Get user's rating
GET  /api/events/:eventId/rating/eligibility  - Check if user can rate
```

### Map Endpoint
```
GET /api/geocode/static-map?lat={lat}&lng={lng}&width={w}&height={h}
```

---

## Troubleshooting

### Waitlist Issues
- **"Join Waitlist" not showing**: Verify event is at full capacity
- **Position not updating**: Check backend waitlist queue ordering
- **API errors**: Verify rate limiting (60 interactions/min)

### Rating Issues  
- **"Rate Event" not showing**: Check eligibility (must attend + event passed)
- **Rating not saving**: Verify user attended event (marked as "going")
- **Duplicate rating error**: User can only rate each event once

### Map Issues
- **Map not loading**: Verify `EXPO_PUBLIC_API_URL` is set correctly
- **Deep link fails**: Check device has maps app installed
- **Static map error**: Verify backend geocode endpoint is accessible

---

## Performance Testing

### Load Testing Scenarios
1. **Rapid interactions**: Tap Going/Like/Pass quickly (test rate limiting)
2. **Concurrent waitlist joins**: Multiple users joining same event
3. **Large conversation list**: Test with 50+ conversations
4. **Message polling**: Verify 3-second polling doesn't cause performance issues

### Expected Behavior
- Rate limiters should prevent abuse (HTTP 429 responses)
- UI should show loading states during API calls
- Queries should use React Query caching effectively
- No memory leaks from polling or real-time updates

---

## Success Criteria

The mobile app is ready for production when:
- ✅ All waitlist flows work without errors
- ✅ All rating flows work without errors
- ✅ Maps display and deep linking functions
- ✅ No console errors during normal usage
- ✅ Performance remains smooth with realistic data loads
- ✅ All navigation flows work correctly
- ✅ API error handling displays user-friendly messages
