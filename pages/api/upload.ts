import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { IncomingForm, Files, Fields, File } from 'formidable';
import { v2 as cloudinary } from 'cloudinary';
import { MongoClient } from 'mongodb';
import clientPromise from '../../lib/mongodb';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

    // Parse form data
    const form = new IncomingForm();
    const [fields, files]: [Fields, Files] = await new Promise((resolve, reject) => {
      form.parse(req, (err: Error | null, fields: Fields, files: Files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    // Handle both single file and array of files cases
    const imageFiles = files.image as File[] | File | undefined;
    const imageFile = Array.isArray(imageFiles) ? imageFiles[0] : imageFiles;

    if (!imageFile || !imageFile.filepath) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(imageFile.filepath, {
      folder: 'matchbox-profiles',
      transformation: [
        { width: 400, height: 400, crop: 'fill' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });

    // Update user profile in database
    const client = await clientPromise;
    const db = client.db();
    await db.collection('users').updateOne(
      { email: session.user.email },
      { $set: { profileImage: result.secure_url } }
    );

    return res.status(200).json({ 
      message: 'Image uploaded successfully',
      imageUrl: result.secure_url 
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ message: 'Error uploading image' });
  }
} 