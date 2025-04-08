import jwt from 'jsonwebtoken';
import clientPromise from './mongodb';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface TokenPayload {
  email: string;
  id: string;
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    
    // Verify user exists in database
    const client = await clientPromise;
    const db = client.db();
    const user = await db.collection('users').findOne({ email: decoded.email });

    if (!user) {
      return null;
    }

    return {
      email: decoded.email,
      id: decoded.id,
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
} 