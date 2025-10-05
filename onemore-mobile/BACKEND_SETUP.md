# Backend Setup Guide for OneMore Mobile

The mobile app is **fully functional on the client side** and ready to work with your backend. You need to add JWT authentication endpoints to your Express server.

## What the Mobile App Already Has

✅ **Complete authentication system**
- Login form with email/password
- Secure token storage using Expo SecureStore
- Axios interceptors that automatically attach `Authorization: Bearer <token>` headers
- Token refresh handling
- Logout functionality

✅ **All API endpoints wired and ready**
- Event discovery
- Event interactions
- User profile
- Settings updates

**The mobile app will work immediately once you add the backend endpoints below.**

---

## Required Backend Changes

### 1. Add JWT Authentication Endpoints

#### `POST /api/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "userpassword"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "optional_refresh_token_here",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    ...full user object matching your schema
  }
}
```

**Errors:**
- `401` for invalid credentials
- `400` for missing email/password

---

#### `GET /api/auth/user`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id": "user-id",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  ...full user object
}
```

**Errors:**
- `401` for invalid/expired token

---

#### `POST /api/auth/logout` (Optional but recommended)

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

---

#### `POST /api/auth/refresh` (Optional - for token refresh)

**Request:**
```json
{
  "refreshToken": "refresh_token_string"
}
```

**Response (200 OK):**
```json
{
  "token": "new_access_token"
}
```

---

### 2. Update Existing Endpoints to Accept JWT

All your existing endpoints already work, but they need to accept JWT tokens instead of only session cookies.

#### Update Authentication Middleware

**Current (Replit Auth with sessions):**
```typescript
app.get('/api/events', async (req, res) => {
  const userId = req.user?.id; // From Replit Auth session
  // ...
});
```

**Add JWT support:**
```typescript
import jwt from 'jsonwebtoken';

// JWT middleware
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // Now req.user has the user data
      next();
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  } else if (req.user) {
    // Still support Replit Auth sessions for web app
    next();
  } else {
    res.status(401).json({ message: 'No authentication provided' });
  }
};

// Use on protected routes
app.get('/api/events', authenticateJWT, async (req, res) => {
  const userId = req.user.id;
  // ... rest of your existing code works the same
});
```

This way your backend supports **both**:
- Web app (Replit Auth sessions)  
- Mobile app (JWT tokens)

---

## Implementation Example

Here's a complete example for the login endpoint:

```typescript
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const JWT_EXPIRES_IN = '7d';

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    // Find user by email
    const user = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (!user.rows[0]) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const userData = user.rows[0];

    // Verify password (assuming you have hashed passwords)
    const isValid = await bcrypt.compare(password, userData.password_hash);

    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: userData.id,
        email: userData.email,
        role: userData.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Remove password from response
    delete userData.password_hash;

    res.json({
      token,
      user: userData,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
```

---

## Quick Setup Checklist

- [ ] Install JWT library: `npm install jsonwebtoken bcrypt`
- [ ] Add `JWT_SECRET` environment variable to `.env`
- [ ] Create `POST /api/auth/login` endpoint
- [ ] Create `GET /api/auth/user` endpoint (or update existing)
- [ ] Create `POST /api/auth/logout` endpoint
- [ ] Update authentication middleware to accept JWT tokens
- [ ] Test with mobile app

---

## Environment Variables

Add to your `.env`:

```
JWT_SECRET=your-super-secret-key-change-this-in-production
```

---

## Testing

Once backend is updated:

1. **Open mobile app** - you'll see the login screen
2. **Enter credentials** - email/password for an existing user
3. **Tap "Log In"** - app will call `POST /api/auth/login`
4. **Token stored securely** - in device SecureStore
5. **All API calls work** - token automatically attached to requests

---

## What Happens Next

After adding these endpoints:

✅ Mobile login works immediately  
✅ All events/interactions work  
✅ Profile screen loads user data  
✅ Token automatically refreshes when needed  
✅ Logout clears tokens  

**No further mobile app changes needed** - everything is ready on the mobile side.

---

## Optional: Keep Replit Auth for Web

You can keep Replit Auth for your web app and use JWT only for mobile:

```typescript
const authenticateJWT = (req, res, next) => {
  // Check for JWT token first (mobile)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      req.user = jwt.verify(token, JWT_SECRET);
      return next();
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  }
  
  // Fall back to Replit Auth session (web)
  if (req.user) {
    return next();
  }
  
  // No authentication
  res.status(401).json({ message: 'Authentication required' });
};
```

This supports both authentication methods simultaneously.
