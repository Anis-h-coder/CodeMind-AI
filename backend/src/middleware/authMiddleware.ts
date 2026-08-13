import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'codemind_fallback_jwt_secret_12345';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const hasHeader = Boolean(authHeader && authHeader.startsWith('Bearer '));

  if (!hasHeader) {
    console.warn(`[CodeMind Auth] Verification failed: Authorization header present? ${Boolean(authHeader)}`);
    return res.status(401).json({
      success: false,
      error: 'Authorization header is missing or invalid'
    });
  }

  const token = authHeader!.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    (req as any).user = decoded;
    console.log(`[CodeMind Auth] Authentication successful for userId: ${decoded.userId}`);
    return next();
  } catch (error: any) {
    console.error('[CodeMind Auth] Token verification failed:', error.message);
    return res.status(401).json({
      success: false,
      error: 'Token has expired or is invalid'
    });
  }
}
