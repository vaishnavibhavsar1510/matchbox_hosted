const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/matchbox';

async function testConnection() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Successfully connected to MongoDB.');
    
    // Create a test document
    const Test = mongoose.model('Test', new mongoose.Schema({ name: String }));
    await Test.create({ name: 'test' });
    console.log('Successfully created test document.');
    
    // Read the test document
    const doc = await Test.findOne({ name: 'test' });
    console.log('Successfully read test document:', doc);
    
    // Clean up
    await Test.deleteMany({});
    console.log('Successfully cleaned up test documents.');
    
    await mongoose.connection.close();
    console.log('Connection closed.');
  } catch (error) {
    console.error('Database test failed:', error);
  }
}

testConnection(); 