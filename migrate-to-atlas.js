const { MongoClient } = require('mongodb');

const localUri = "mongodb://localhost:27017/matchbox";
const atlasUri = "mongodb+srv://vaishnavibhavsar496:Vaishudb%4003@cluster03.yiihk.mongodb.net/matchbox?retryWrites=true&w=majority";

async function migrateToAtlas() {
    const localClient = new MongoClient(localUri);
    const atlasClient = new MongoClient(atlasUri);

    try {
        await localClient.connect();
        console.log("Connected to local MongoDB");
        
        await atlasClient.connect();
        console.log("Connected to MongoDB Atlas");

        const localDb = localClient.db('matchbox');
        const atlasDb = atlasClient.db('matchbox');

        // Get all collections
        const collections = await localDb.listCollections().toArray();

        // Migrate each collection
        for (const collection of collections) {
            const collectionName = collection.name;
            console.log(`\nMigrating collection: ${collectionName}`);

            // Get all documents from local collection
            const documents = await localDb.collection(collectionName).find({}).toArray();
            console.log(`Found ${documents.length} documents to migrate`);

            if (documents.length > 0) {
                // Insert documents into Atlas collection
                const result = await atlasDb.collection(collectionName).insertMany(documents);
                console.log(`Successfully migrated ${result.insertedCount} documents`);
            }
        }

        console.log("\nMigration completed successfully!");

    } catch (err) {
        console.error("Migration error:", err);
    } finally {
        await localClient.close();
        await atlasClient.close();
        console.log("\nConnections closed");
    }
}

console.log("Starting migration from local MongoDB to Atlas...");
migrateToAtlas(); 