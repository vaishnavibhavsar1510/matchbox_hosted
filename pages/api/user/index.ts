import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get session for all requests
    const session = await getServerSession(req, res, authOptions);
    console.log('Session in API:', session);

    // Verify authentication for all requests
    if (!session?.user?.email) {
      console.log('No authenticated session found');
      return res.status(401).json({ error: 'You must be logged in to perform this action' });
    }

    const client = await clientPromise;
    const db = client.db("matchbox");
    const users = db.collection("users");

    if (req.method === 'GET') {
      try {
        // If email query param is provided, fetch that user's data
        const targetEmail = req.query.email as string || session.user.email;
        const user = await users.findOne({ email: targetEmail });

        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        // Remove sensitive data
        const { password, ...userData } = user;
        res.status(200).json(userData);
      } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Error fetching user data' });
      }
    } else if (req.method === 'PUT') {
      try {
        const { email, password, ...updateData } = req.body;

        // Don't allow updating email or password through this endpoint
        if (email || password) {
          return res.status(400).json({ error: 'Cannot update email or password through this endpoint' });
        }

        // Validate required fields
        if (!updateData || Object.keys(updateData).length === 0) {
          return res.status(400).json({ error: 'No update data provided' });
        }

        console.log('Updating user data for:', session.user.email);

        // Format the data for update
        const formattedData = {
          ...updateData,
          email: session.user.email, // Keep the email in the document
          updatedAt: new Date()
        };

        // Update the user document
        const result = await users.findOneAndUpdate(
          { email: session.user.email },
          { 
            $set: formattedData,
            $setOnInsert: { createdAt: new Date() }
          },
          { 
            returnDocument: 'after',
            upsert: true // Create if doesn't exist
          }
        );

        // MongoDB driver returns the document differently in newer versions
        const updatedUser = result?.value || result;

        if (!updatedUser) {
          console.error('Failed to update user document');
          return res.status(500).json({ error: 'Failed to update user preferences' });
        }

        console.log('User data updated successfully');

        // Remove sensitive data and return
        const { password: _, ...userData } = updatedUser;
        return res.status(200).json(userData);
      } catch (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({ 
          error: 'Failed to update preferences',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    } else {
      res.setHeader('Allow', ['GET', 'PUT']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Unhandled error in API route:', error);
    return res.status(500).json({ 
      error: 'An unexpected error occurred',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 