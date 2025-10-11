import type { Express } from 'express';
import { storage } from './storage';
import { hashPassword, verifyPassword, generateToken } from './jwtAuth';
import type { JWTPayload } from './jwtAuth';

export function setupJWTRoutes(app: Express) {
  // Login endpoint for mobile
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);

      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check if user has a password (might be OAuth-only user)
      if (!user.passwordHash) {
        return res.status(401).json({ 
          message: 'This account uses web login. Please log in through the website first to set up mobile access.' 
        });
      }

      // Verify password
      const isValid = await verifyPassword(password, user.passwordHash);

      if (!isValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate JWT token
      const payload: JWTPayload = {
        userId: user.id,
        email: user.email || '',
        role: user.role,
      };

      const token = generateToken(payload);

      // Remove password hash from response
      const { passwordHash, ...userResponse } = user;

      res.json({
        token,
        user: userResponse,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Register endpoint for mobile
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);

      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user
      const newUser = await storage.createUserWithPassword({
        email,
        passwordHash,
        firstName: firstName || null,
        lastName: lastName || null,
        role: 'attendee',
      });

      // Generate JWT token
      const payload: JWTPayload = {
        userId: newUser.id,
        email: newUser.email || '',
        role: newUser.role,
      };

      const token = generateToken(payload);

      // Remove password hash from response
      const { passwordHash: _, ...userResponse } = newUser;

      res.json({
        token,
        user: userResponse,
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Apple Sign In endpoint for mobile
  app.post('/api/auth/apple', async (req, res) => {
    try {
      const { identityToken, email, fullName } = req.body;

      if (!identityToken) {
        return res.status(400).json({ message: 'Apple identity token is required' });
      }

      // Verify the Apple identity token with Apple's public keys
      // Use dynamic import for CommonJS module in ESM context
      let jwtClaims;
      try {
        const { default: verifyAppleToken } = await import('verify-apple-id-token');
        jwtClaims = await verifyAppleToken({
          idToken: identityToken,
          // Accept both Expo Go (for testing) and OneMore (for production) bundle IDs
          clientId: ['host.exp.Exponent', 'com.onemore.app'],
        });
      } catch (verifyError) {
        console.error('Apple token verification failed:', verifyError);
        return res.status(401).json({ message: 'Invalid Apple identity token' });
      }

      // Extract the verified Apple user ID from the token (sub claim)
      const appleUserId = jwtClaims.sub;
      // Only use email from Apple's verified token, never trust client-supplied email
      // Apple returns email_verified as string "true"/"false", so check explicitly
      const verifiedEmail = (jwtClaims.email_verified === true || jwtClaims.email_verified === 'true') 
        ? jwtClaims.email 
        : null;

      // Check if user already exists with this Apple ID
      let user = await storage.getUserByAppleId(appleUserId);

      if (!user) {
        // If no user with Apple ID and we have a verified email, check if email exists
        // (user might have signed up with email before)
        if (verifiedEmail) {
          user = await storage.getUserByEmail(verifiedEmail);
          if (user) {
            // Link Apple ID to existing email account
            await storage.upsertUser({
              ...user,
              appleId: appleUserId,
            });
          }
        }

        // Create new user if still doesn't exist
        if (!user) {
          const firstName = fullName?.givenName || null;
          const lastName = fullName?.familyName || null;
          
          user = await storage.createUserWithAppleId({
            appleId: appleUserId,
            email: verifiedEmail || null,
            firstName,
            lastName,
            role: 'attendee',
          });
        }
      }

      // Generate JWT token
      const payload: JWTPayload = {
        userId: user.id,
        email: user.email || '',
        role: user.role,
      };

      const token = generateToken(payload);

      // Remove sensitive data from response
      const { passwordHash, appleId, ...userResponse } = user;

      res.json({
        token,
        user: userResponse,
      });
    } catch (error) {
      console.error('Apple Sign In error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Logout endpoint (for mobile - just returns success, token is cleared client-side)
  app.post('/api/auth/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
  });

  // Token refresh endpoint (optional - returns new token)
  app.post('/api/auth/refresh', async (req, res) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token required' });
      }

      // For now, we'll just verify the token and issue a new one
      // In a production app, you'd store refresh tokens separately
      const decoded = require('./jwtAuth').verifyToken(refreshToken) as JWTPayload;
      
      const user = await storage.getUser(decoded.userId);

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      const payload: JWTPayload = {
        userId: user.id,
        email: user.email || '',
        role: user.role,
      };

      const token = generateToken(payload);

      res.json({ token });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(401).json({ message: 'Invalid refresh token' });
    }
  });
}
