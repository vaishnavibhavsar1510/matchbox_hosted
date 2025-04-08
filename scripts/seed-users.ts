const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/matchbox';

const sampleUsers = [
  {
    name: 'James Will',
    email: 'james@gmail.com',
    interests: ['Art & Culture', 'Sports & Fitness', 'Food & Cooking', 'Travel & Adventure', 'Technology', 'Hiking'],
    birthdate: '1990-01-01',
    gender: 'male',
    location: 'Los Angeles, CA',
    bio: 'Passionate about art and outdoor activities',
  },
  {
    name: 'James Druff',
    email: 'jamesdruff@gmail.com',
    interests: ['Sports & Fitness', 'Art & Culture'],
    birthdate: '1992-05-15',
    gender: 'male',
    location: 'New York, NY',
    bio: 'Sports enthusiast and art lover',
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah@gmail.com',
    interests: ['Music', 'Photography', 'Travel & Adventure', 'Food & Cooking'],
    birthdate: '1993-08-20',
    gender: 'female',
    location: 'San Francisco, CA',
    bio: 'Love exploring new places and trying new foods',
  }
];

async function seedUsers() {
  try {
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    
    // Hash a common password for all test users
    const password = await bcrypt.hash('password123', 10);
    
    // Prepare users with additional fields
    const usersToInsert = sampleUsers.map(user => ({
      ...user,
      password,
      createdAt: new Date(),
      updatedAt: new Date(),
      userType: 'attendee',
      personality: '',
      activityLevel: '',
      socialStyle: '',
      relationshipGoals: '',
    }));

    // Insert users
    const result = await db.collection('users').insertMany(usersToInsert);
    console.log(`Successfully inserted ${result.insertedCount} users`);

    await client.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding users:', error);
  }
}

seedUsers(); 