import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import clientPromise from '../../../lib/mongodb';
import bcrypt from 'bcryptjs';

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      userType?: string;
    }
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials');
        }

        try {
          const client = await clientPromise;
          const db = client.db('matchbox');
          const user = await db.collection('users').findOne({ email: credentials.email });

          if (!user) {
            throw new Error('No user found');
          }

          // Use bcrypt to compare passwords
          const isValid = await bcrypt.compare(credentials.password, user.password);
          
          if (!isValid) {
            throw new Error('Invalid password');
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name || null,
          };
        } catch (error) {
          console.error('Authorization error:', error);
          throw error;
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
    async signIn({ user, account }) {
      try {
        const client = await clientPromise;
        const db = client.db();

        // Check if user exists
        const existingUser = await db.collection('users').findOne({ email: user.email });

        if (!existingUser) {
          // Create new user with host type
          await db.collection('users').insertOne({
            email: user.email,
            name: user.name,
            image: user.image,
            userType: 'host',
            interests: [],
            createdAt: new Date(),
            updatedAt: new Date()
          });
        } else if (!existingUser.userType) {
          // Update existing user to be a host if userType is not set
          await db.collection('users').updateOne(
            { email: user.email },
            { 
              $set: { 
                userType: 'host',
                updatedAt: new Date()
              }
            }
          );
        }

        return true;
      } catch (error) {
        console.error('Error in signIn callback:', error);
        return false;
      }
    },
    async session({ session }) {
      if (session?.user?.email) {
        try {
          const client = await clientPromise;
          const db = client.db();
          
          const user = await db.collection('users').findOne(
            { email: session.user.email },
            { projection: { userType: 1 } }
          );

          if (user) {
            session.user.userType = user.userType;
          }
        } catch (error) {
          console.error('Error in session callback:', error);
        }
      }
      return session;
    }
  },
};

export default NextAuth(authOptions); 