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

    // Parse form data using the latest formidable API
    const form = formidable({
      uploadDir: uploadsDir,
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB limit
      filename: (name, ext, part, form) => {
        // Generate a unique filename
        return `${Date.now()}-${part.originalFilename}`;
      },
    });

    const [fields, files] = await form.parse(req);
    
    // Get the uploaded file
    const fileArray = files.image;
    if (!fileArray || fileArray.length === 0) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const file = fileArray[0];
    if (!file || !file.filepath) {
      return res.status(400).json({ message: 'Invalid file upload' });
    }

    // Generate relative path for the uploaded file
    const fileName = path.basename(file.filepath);
    const relativePath = `/uploads/${fileName}`;

    try {
      // Update user profile in database
      const client = await clientPromise;
      const db = client.db();
      
      // Delete old profile picture if it exists
      const user = await db.collection('users').findOne({ email: session.user.email });
      if (user?.profileImage) {
        const oldImagePath = path.join(process.cwd(), 'public', user.profileImage);
        try {
          await fs.unlink(oldImagePath);
        } catch (error) {
          console.warn('Could not delete old profile picture:', error);
        }
      }

      // Update with new profile picture
      await db.collection('users').updateOne(
        { email: session.user.email },
        { $set: { profileImage: relativePath } }
      );

      return res.status(200).json({ 
        message: 'Profile picture uploaded successfully',
        imageUrl: relativePath
      });
    } catch (error) {
      console.error('Database error:', error);
      // Try to clean up the uploaded file if database update fails
      try {
        await fs.unlink(file.filepath);
      } catch (unlinkError) {
        console.error('Failed to clean up uploaded file:', unlinkError);
      }
      return res.status(500).json({ message: 'Error saving profile picture' });
    }
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ 
      message: 'Error uploading profile picture',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 