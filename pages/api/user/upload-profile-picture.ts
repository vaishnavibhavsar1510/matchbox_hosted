import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import formidable from 'formidable';
import { promises as fs } from 'fs';
import path from 'path';
import clientPromise from '../../../lib/mongodb';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check authentication
    const session = await getSession({ req });
    if (!session || !session.user?.email) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    try {
      await fs.access(uploadsDir);
    } catch {
      await fs.mkdir(uploadsDir, { recursive: true });
    }

    // Parse form data
    const form = formidable({
      uploadDir: uploadsDir,
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB limit
      multiples: false,
    });

    return new Promise((resolve, reject) => {
      form.parse(req, async (err, fields, files) => {
        if (err) {
          console.error('Form parsing error:', err);
          return resolve(res.status(500).json({ message: 'Error processing file upload' }));
        }

        const file = files.image?.[0] || files.image;
        if (!file || !('filepath' in file)) {
          return resolve(res.status(400).json({ message: 'No image file provided' }));
        }

        try {
          // Generate relative path for the uploaded file
          const fileName = path.basename(file.filepath);
          const relativePath = `/uploads/${fileName}`;

          // Update user profile in database
          const client = await clientPromise;
          const db = client.db();
          await db.collection('users').updateOne(
            { email: session.user.email },
            { $set: { profileImage: relativePath } }
          );

          return resolve(res.status(200).json({ 
            message: 'Profile picture uploaded successfully',
            imageUrl: relativePath
          }));
        } catch (error) {
          console.error('Database error:', error);
          return resolve(res.status(500).json({ message: 'Error saving profile picture' }));
        }
      });
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ message: 'Error uploading profile picture' });
  }
} 