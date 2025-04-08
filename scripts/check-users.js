const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = 'matchbox';

async function checkUsers() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(dbName);
    const users = db.collection('users');

    // Get all users
    const allUsers = await users.find({}).toArray();
    console.log('\nAll users:');
    allUsers.forEach(user => {
      console.log('\nUser:', {
        email: user.email,
        name: user.name,
        interests: user.interests,
        interestsType: typeof user.interests,
        isArray: Array.isArray(user.interests)
      });
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('Connection closed');
  }
}

checkUsers(); 