const mongoose = require('mongoose');
require('dotenv').config();

const checkSearchIndexes = async () => {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Connected.");

    const collectionName = 'documentchunks';
    console.log(`Checking search indexes for collection '${collectionName}'...`);
    
    const collection = mongoose.connection.db.collection(collectionName);
    const searchIndexes = await collection.listSearchIndexes().toArray();
    
    console.log("\nSearch Indexes Found:", searchIndexes.length);
    if (searchIndexes.length > 0) {
      console.log(JSON.stringify(searchIndexes, null, 2));
    } else {
      console.log("NO Search Indexes or Vector Search Indexes were found on this collection!");
    }

    process.exit(0);
  } catch (error) {
    console.error("Error checking search indexes:", error);
    process.exit(1);
  }
};

checkSearchIndexes();
