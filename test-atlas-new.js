const { MongoClient } = require('mongodb');

// Using the exact password: Vaishudb03
const uri = "mongodb+srv://vaishnavibhavsar496:Vaishudb03@cluster03.yiihk.mongodb.net/matchbox?retryWrites=true&w=majority";

async function testConnection() {
    const client = new MongoClient(uri);

    try {
        console.log('Attempting to connect to MongoDB Atlas...');
        await client.connect();
        console.log('Connected successfully to MongoDB Atlas!');
        
        const db = client.db('matchbox');
        console.log('\nTesting database access...');
        const collections = await db.listCollections().toArray();
        console.log('Available collections:');
        collections.forEach(collection => {
            console.log(`- ${collection.name}`);
        });
    } catch (error) {
        console.error('Connection error:', error);
        console.error('\nError details:');
        console.error('Name:', error.name);
        console.error('Message:', error.message);
        if (error.code) console.error('Code:', error.code);
    } finally {
        await client.close();
        console.log('\nConnection closed');
    }
}

testConnection(); 