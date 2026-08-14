import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/index';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { ensureDatabaseSchema } from '../db/bootstrap';

const JWT_SECRET = process.env.JWT_SECRET || 'codemind_fallback_jwt_secret_12345';

export const authController = {
  login: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email and password are required parameters'
          }
        });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const isDemoAccount = normalizedEmail.includes('demo') || normalizedEmail === 'demo.developer@codemind.ai';

      let userRecord: any = null;
      try {
        await ensureDatabaseSchema();
        const results = await db.select().from(users).where(eq(users.email, normalizedEmail));
        userRecord = results[0];
      } catch (dbErr: any) {
        console.error('[CodeMind Auth] Database query failed:', dbErr?.message);
        if (isDemoAccount) {
          console.log('[CodeMind Auth] Demo account login requested - using fallback demo user record.');
          userRecord = {
            id: '11111111-2222-3333-4444-555555555555',
            email: normalizedEmail,
            name: 'Demo Developer',
            passwordHash: '$2b$10$abcdefghijklmnopqrstuu',
            createdAt: new Date(),
          };
        } else {
          return res.status(500).json({
            success: false,
            error: {
              code: 'DATABASE_ERROR',
              message: `Database connection error: ${dbErr?.message || 'Could not reach PostgreSQL'}. Check DATABASE_URL in Vercel settings.`
            }
          });
        }
      }

      // Auto-provision Demo Developer Account if not existing
      if (!userRecord && (normalizedEmail.includes('demo') || normalizedEmail === 'demo.developer@codemind.ai')) {
        try {
          const hashedPassword = await bcrypt.hash(password || 'password123', 10);
          const [createdDemoUser] = await db.insert(users).values({
            name: 'Demo Developer',
            email: normalizedEmail,
            passwordHash: hashedPassword,
          }).returning();
          userRecord = createdDemoUser;
        } catch (demoCreateErr: any) {
          console.warn('[CodeMind Auth] Demo user auto-creation warning:', demoCreateErr?.message);
        }
      }

      if (!userRecord) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Invalid email or password'
          }
        });
      }

      // Skip password match check for demo accounts or compare hash
      if (!normalizedEmail.includes('demo')) {
        const passwordMatch = await bcrypt.compare(password, userRecord.passwordHash);
        if (!passwordMatch) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'UNAUTHENTICATED',
              message: 'Invalid email or password'
            }
          });
        }
      }

      const token = jwt.sign(
        { userId: userRecord.id, email: userRecord.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const safeUser = {
        id: userRecord.id,
        email: userRecord.email,
        name: userRecord.name,
        createdAt: userRecord.createdAt,
      };

      return res.json({
        success: true,
        user: safeUser,
        token
      });
    } catch (error: any) {
      console.error('[CodeMind Auth] Login failed:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: error?.message || 'An unexpected internal server error occurred'
        }
      });
    }
  },

  register: async (req: Request, res: Response) => {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Name, email, and password are required'
          }
        });
      }

      const normalizedEmail = email.toLowerCase().trim();

      await ensureDatabaseSchema();

      let existingUser;
      try {
        const results = await db.select().from(users).where(eq(users.email, normalizedEmail));
        existingUser = results[0];
      } catch (dbErr: any) {
        console.error('[CodeMind Auth] Database lookup failed:', dbErr);
        return res.status(500).json({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Database connection failed. Please ensure DATABASE_URL is configured correctly.'
          }
        });
      }

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'Email is already registered. Please log in instead.'
          }
        });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      let newUser;
      try {
        const results = await db.insert(users)
          .values({
            name,
            email: normalizedEmail,
            passwordHash,
          })
          .returning();
        newUser = results[0];
      } catch (insertErr: any) {
        console.error('[CodeMind Auth] User insertion failed:', insertErr);
        return res.status(500).json({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to save user to the database.'
          }
        });
      }

      const token = jwt.sign(
        { userId: newUser.id, email: newUser.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const safeUser = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        createdAt: newUser.createdAt,
      };

      return res.status(201).json({
        success: true,
        user: safeUser,
        token
      });
    } catch (error: any) {
      console.error('[CodeMind Auth] Registration failed:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'An unexpected internal server error occurred'
        }
      });
    }
  },

  getMe: async (req: Request, res: Response) => {
    try {
      const tokenUser = (req as any).user;
      if (!tokenUser) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHENTICATED',
            message: 'Unauthenticated session'
          }
        });
      }

      let userRecord;
      try {
        const results = await db.select().from(users).where(eq(users.id, tokenUser.userId));
        userRecord = results[0];
      } catch (dbErr: any) {
        console.error('[CodeMind Auth] Database fetch failed:', dbErr);
        return res.status(500).json({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Database query failed'
          }
        });
      }

      if (!userRecord) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User profile not found'
          }
        });
      }

      return res.json({
        success: true,
        user: {
          id: userRecord.id,
          email: userRecord.email,
          name: userRecord.name,
          createdAt: userRecord.createdAt,
        }
      });
    } catch (error: any) {
      console.error('[CodeMind Auth] getMe failed:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'An unexpected internal server error occurred'
        }
      });
    }
  },
};
