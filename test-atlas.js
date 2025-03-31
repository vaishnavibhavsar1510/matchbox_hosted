const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://vaishnavibhavsar496:Vaishudb%4003@cluster03.yiihk.mongodb.net/matchbox?retryWrites=true&w=majority";

async function testAtlasConnection() {
    const client = new MongoClient(uri, {
        // Using latest recommended options
        maxPoolSize: 10,
        serverApi: {
            version: '1',
            strict: true,
            deprecationErrors: true
        }
    });

    try {
        console.log('Connecting to MongoDB Atlas...');
        await client.connect();
        
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Successfully connected to MongoDB Atlas!");

        const db = client.db('matchbox');
        const collections = await db.listCollections().toArray();
        console.log('\nAvailable collections:');
        collections.forEach(col => console.log(`- ${col.name}`));

    } catch (err) {
        console.error('Connection error:', err);
    } finally {
        await client.close();
        console.log('Connection closed');
    }
}

testAtlasConnection(); 