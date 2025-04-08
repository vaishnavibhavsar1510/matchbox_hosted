const { MongoClient } = require('mongodb');

// Using the exact connection string format from MongoDB Compass
const uri = "mongodb+srv://vaishnavibhavsar496:Vaishudb%4003@cluster03.yiihk.mongodb.net/matchbox?retryWrites=true&w=majority";

async function testConnection() {
    const client = new MongoClient(uri);

    try {
        console.log('Attempting to connect...');
        await client.connect();
        console.log('Connected successfully!');
        
        const db = client.db('matchbox');
        const collections = await db.listCollections().toArray();
        console.log('\nCollections in matchbox database:');
        for (const collection of collections) {
            console.log(`- ${collection.name}`);
        }
    } catch (error) {
        console.error('Connection error:', error);
    } finally {
        await client.close();
        console.log('Connection closed');
    }
}

testConnection(); 