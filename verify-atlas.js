const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://vaishnavibhavsar496:Vaishudb03@cluster03.yiihk.mongodb.net/matchbox?retryWrites=true&w=majority";

async function verifyData() {
    const client = new MongoClient(uri);

    try {
        console.log('Connecting to MongoDB Atlas...');
        await client.connect();
        console.log('Connected successfully!');

        const db = client.db('matchbox');
        
        // Check all collections
        const collections = ['users', 'events', 'rsvps', 'chats', 'tests'];
        
        for (const collectionName of collections) {
            const count = await db.collection(collectionName).countDocuments();
            console.log(`${collectionName}: ${count} documents`);
            
            // Show a sample document from each collection
            if (count > 0) {
                const sample = await db.collection(collectionName).findOne();
                console.log(`Sample ${collectionName} document:`, JSON.stringify(sample, null, 2), '\n');
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
        console.log('Connection closed');
    }
}

verifyData(); 