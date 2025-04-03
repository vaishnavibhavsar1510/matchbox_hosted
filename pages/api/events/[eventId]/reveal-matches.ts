import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import clientPromise from '../../../../lib/mongodb';
import { ObjectId } from 'mongodb';

interface User {
  _id: string;
  email: string;
  name: string;
  interests: string[];
}

interface Match {
  userId: string;
  matchId: string;
  score: number;
  sharedInterests: string[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req });
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { eventId } = req.query;

    const client = await clientPromise;
    const db = client.db();

    // Verify the event exists and the user is the host
    const event = await db.collection('events').findOne({
      _id: new ObjectId(eventId as string),
      hostId: session.user.email
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found or you are not the host' });
    }

    if (event.matchesRevealed) {
      return res.status(400).json({ message: 'Matches have already been revealed' });
    }

    // Get all attendees with their interests
    const attendees = await db.collection('users')
      .find({ email: { $in: event.attendees } })
      .project({ email: 1, name: 1, interests: 1 })
      .toArray() as User[];

    // Calculate matches for each attendee
    const matches: Match[] = [];
    for (let i = 0; i < attendees.length; i++) {
      for (let j = i + 1; j < attendees.length; j++) {
        const user1 = attendees[i];
        const user2 = attendees[j];

        // Find shared interests
        const sharedInterests = user1.interests.filter(interest => 
          user2.interests.includes(interest)
        );

        // Calculate match score based on shared interests
        const score = sharedInterests.length / Math.max(user1.interests.length, user2.interests.length);

        matches.push({
          userId: user1._id,
          matchId: user2._id,
          score,
          sharedInterests
        });
      }
    }

    // Sort matches by score in descending order
    matches.sort((a, b) => b.score - a.score);

    // Create match notifications
    const notifications = matches.flatMap(match => ([
      {
        userId: match.userId,
        type: 'match_revealed',
        eventId: event._id,
        matchId: match.matchId,
        score: match.score,
        sharedInterests: match.sharedInterests,
        read: false,
        createdAt: new Date()
      },
      {
        userId: match.matchId,
        type: 'match_revealed',
        eventId: event._id,
        matchId: match.userId,
        score: match.score,
        sharedInterests: match.sharedInterests,
        read: false,
        createdAt: new Date()
      }
    ]));

    // Update event to mark matches as revealed
    await db.collection('events').updateOne(
      { _id: new ObjectId(eventId as string) },
      {
        $set: {
          matchesRevealed: true,
          matches,
          updatedAt: new Date()
        }
      }
    );

    // Insert notifications
    await db.collection('notifications').insertMany(notifications);

    // Create chat rooms for matches
    const chatRooms = await Promise.all(matches.map(async (match) => {
      const user1 = attendees.find(a => a._id === match.userId);
      const user2 = attendees.find(a => a._id === match.matchId);

      if (!user1 || !user2) return null;

      const chatRoom = {
        eventId: event._id,
        participants: [user1.email, user2.email],
        messages: [{
          sender: 'system',
          content: `You've been matched! You share ${match.sharedInterests.length} interests: ${match.sharedInterests.join(', ')}`,
          timestamp: new Date(),
          type: 'match'
        }],
        matchScore: match.score,
        sharedInterests: match.sharedInterests,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await db.collection('chats').insertOne(chatRoom);
      return {
        chatId: result.insertedId,
        participants: [user1.email, user2.email],
        matchScore: match.score
      };
    }));

    return res.status(200).json({
      message: 'Matches revealed successfully',
      matches,
      chatRooms: chatRooms.filter(Boolean)
    });

  } catch (error) {
    console.error('Error revealing matches:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 