import type { Express } from 'express';
import { storage } from './storage';
import { hashPassword, verifyPassword, generateToken } from './jwtAuth';
import type { JWTPayload } from './jwtAuth';
import { sendEmail } from './utils/replitmail';
import crypto from 'crypto';
import { db } from './db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';

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

      // Check if email is verified
      if (!user.emailVerified) {
        return res.status(403).json({ 
          message: 'Please verify your email address before logging in. Check your inbox for the verification link.',
          code: 'EMAIL_NOT_VERIFIED'
        });
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

      if (!firstName || firstName.trim() === '') {
        return res.status(400).json({ message: 'First name is required' });
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

      // Generate verification token (32 random bytes as hex string)
      const verificationToken = crypto.randomBytes(32).toString('hex');
      
      // Token expires in 24 hours
      const verificationTokenExpiry = new Date();
      verificationTokenExpiry.setHours(verificationTokenExpiry.getHours() + 24);

      // Create user with email verification pending
      const newUser = await storage.createUserWithPassword({
        email,
        passwordHash,
        firstName: firstName.trim(),
        lastName: lastName?.trim() || null,
        role: 'attendee',
        verificationToken,
        verificationTokenExpiry,
      });

      // Get the base URL for the verification link
      const baseUrl = process.env.REPLIT_DOMAINS 
        ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
        : 'http://localhost:5000';
      
      const verificationLink = `${baseUrl}/api/auth/verify-email?token=${verificationToken}`;

      // Send verification email
      try {
        await sendEmail({
          to: email,
          subject: 'Verify your OneMore account',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #dc2626;">Welcome to OneMore, ${firstName}!</h2>
              <p>Thank you for signing up. Please verify your email address to complete your registration.</p>
              <p>Click the button below to verify your email:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationLink}" style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
              </div>
              <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
              <p style="color: #666; font-size: 14px; word-break: break-all;">${verificationLink}</p>
              <p style="color: #666; font-size: 14px;">This link will expire in 24 hours.</p>
            </div>
          `,
          text: `Welcome to OneMore, ${firstName}!\n\nPlease verify your email address by clicking this link:\n${verificationLink}\n\nThis link will expire in 24 hours.`,
        });
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Continue anyway - user can request resend
      }

      // Return success message (do NOT return token - user must verify first)
      res.json({
        message: 'Registration successful! Please check your email to verify your account.',
        email: newUser.email,
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Resend verification email endpoint
  app.post('/api/auth/resend-verification', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);

      if (!user || user.emailVerified) {
        // Don't reveal if email exists or verification status for security
        // Return success message even if email doesn't exist or is already verified
        return res.json({ message: 'If an unverified account exists with this email, a verification link has been sent.' });
      }

      // Generate new verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationTokenExpiry = new Date();
      verificationTokenExpiry.setHours(verificationTokenExpiry.getHours() + 24);

      // Update user with new token
      await db
        .update(users)
        .set({
          verificationToken,
          verificationTokenExpiry,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      // Get the base URL for the verification link
      const baseUrl = process.env.REPLIT_DOMAINS 
        ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
        : 'http://localhost:5000';
      
      const verificationLink = `${baseUrl}/api/auth/verify-email?token=${verificationToken}`;

      // Send verification email
      try {
        await sendEmail({
          to: email,
          subject: 'Verify your OneMore account',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #dc2626;">Verify your OneMore account</h2>
              <p>You requested a new verification link. Click the button below to verify your email:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationLink}" style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
              </div>
              <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
              <p style="color: #666; font-size: 14px; word-break: break-all;">${verificationLink}</p>
              <p style="color: #666; font-size: 14px;">This link will expire in 24 hours.</p>
            </div>
          `,
          text: `Verify your OneMore account\n\nYou requested a new verification link. Click this link to verify your email:\n${verificationLink}\n\nThis link will expire in 24 hours.`,
        });
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        return res.status(500).json({ message: 'Failed to send verification email' });
      }

      // Use same generic message as early return to prevent email enumeration
      res.json({ message: 'If an unverified account exists with this email, a verification link has been sent.' });
    } catch (error) {
      console.error('Resend verification error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Email verification endpoint
  app.get('/api/auth/verify-email', async (req, res) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        return res.status(400).send(`
          <html>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h2 style="color: #dc2626;">Invalid Verification Link</h2>
              <p>The verification link is invalid or malformed.</p>
            </body>
          </html>
        `);
      }

      // Find user with this verification token
      const userList = await db.select().from(users).where(eq(users.verificationToken, token));
      const user = userList[0];

      if (!user) {
        return res.status(400).send(`
          <html>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h2 style="color: #dc2626;">Invalid or Expired Link</h2>
              <p>This verification link is invalid or has already been used.</p>
            </body>
          </html>
        `);
      }

      // Check if token has expired
      if (user.verificationTokenExpiry && new Date() > new Date(user.verificationTokenExpiry)) {
        return res.status(400).send(`
          <html>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h2 style="color: #dc2626;">Link Expired</h2>
              <p>This verification link has expired. Please request a new one from the app.</p>
            </body>
          </html>
        `);
      }

      // Verify the user's email
      await db
        .update(users)
        .set({
          emailVerified: true,
          verificationToken: null,
          verificationTokenExpiry: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      res.send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #16a34a;">✓ Email Verified!</h2>
            <p>Your email has been successfully verified.</p>
            <p>You can now close this window and log in to the OneMore app.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #dc2626;">Verification Failed</h2>
            <p>An error occurred while verifying your email. Please try again later.</p>
          </body>
        </html>
      `);
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
      // Apple returns email_verified as boolean or string, so check both
      const emailVerified = jwtClaims.email_verified as boolean | string;
      const verifiedEmail = (emailVerified === true || emailVerified === 'true') 
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
            // Link Apple ID to existing email account and auto-verify
            await storage.upsertUser({
              ...user,
              appleId: appleUserId,
              emailVerified: true, // Auto-verify OAuth users
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
            emailVerified: true, // Auto-verify OAuth users
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

  // Google Sign In endpoint for mobile
  app.post('/api/auth/google', async (req, res) => {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        return res.status(400).json({ message: 'Google ID token is required' });
      }

      // Verify the Google ID token
      const { OAuth2Client } = await import('google-auth-library');
      const client = new OAuth2Client();
      
      let ticket;
      try {
        ticket = await client.verifyIdToken({
          idToken,
          // Accept both Expo Go (for testing) and OneMore (for production) client IDs
          audience: [
            '861823949799-benbjhbbkbd7lnu2p0mknv6uutfp6ieu.apps.googleusercontent.com', // Web client ID (used by expo-auth-session)
            'com.googleusercontent.apps.861823949799-benbjhbbkbd7lnu2p0mknv6uutfp6ieu', // Alternative format
          ],
        });
      } catch (verifyError) {
        console.error('Google token verification failed:', verifyError);
        return res.status(401).json({ message: 'Invalid Google ID token' });
      }

      const payload = ticket.getPayload();
      if (!payload) {
        return res.status(401).json({ message: 'Invalid Google token payload' });
      }

      // Extract user info from verified token
      const googleUserId = payload.sub;
      const verifiedEmail = payload.email_verified ? payload.email : null;
      const firstName = payload.given_name || null;
      const lastName = payload.family_name || null;

      // Check if user already exists with this Google ID
      let user = await storage.getUserByGoogleId(googleUserId);

      if (!user) {
        // If no user with Google ID and we have a verified email, check if email exists
        // (user might have signed up with email before)
        if (verifiedEmail) {
          user = await storage.getUserByEmail(verifiedEmail);
          if (user) {
            // Link Google ID to existing email account and auto-verify
            await storage.upsertUser({
              ...user,
              googleId: googleUserId,
              emailVerified: true, // Auto-verify OAuth users
            });
          }
        }

        // Create new user if still doesn't exist
        if (!user) {
          user = await storage.createUserWithGoogleId({
            googleId: googleUserId,
            email: verifiedEmail || null,
            firstName,
            lastName,
            role: 'attendee',
            emailVerified: true, // Auto-verify OAuth users
          });
        }
      }

      // Generate JWT token
      const payload_jwt: JWTPayload = {
        userId: user.id,
        email: user.email || '',
        role: user.role,
      };

      const token = generateToken(payload_jwt);

      // Remove sensitive data from response
      const { passwordHash, appleId, googleId, ...userResponse } = user;

      res.json({
        token,
        user: userResponse,
      });
    } catch (error) {
      console.error('Google Sign In error:', error);
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
