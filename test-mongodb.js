const { MongoClient } = require('mongodb');

// Note: The @ symbol in the password needs to be URL encoded as %40
const uri = "mongodb+srv://vaishnavibhavsar496:Vaishudb%4003@cluster03.yiihk.mongodb.net/matchbox?retryWrites=true&w=majority";

async function testConnection() {
  const client = new MongoClient(uri);

  try {
    console.log("Attempting to connect to MongoDB Atlas...");
    await client.connect();
    console.log("Successfully connected to MongoDB Atlas!");

    // Connect to the matchbox database specifically
    const db = client.db('matchbox');
    
    // List collections in the matchbox database
    console.log("\nListing collections in matchbox database:");
    const collections = await db.listCollections().toArray();
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });

  } catch (err) {
    console.error("\nConnection error details:");
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    if (err.stack) {
      console.error("\nStack trace:");
      console.error(err.stack);
    }
  } finally {
    console.log("\nClosing connection...");
    await client.close();
  }
}

console.log("Starting MongoDB Atlas connection test...");
testConnection(); 