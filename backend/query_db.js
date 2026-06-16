const mongoose = require('mongoose');
const { Document, DocumentChunk } = require('./models/Document');
const { embeddingsModel } = require('./config/langchain');
require('dotenv').config();

const runQuery = async () => {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Connected.");

    // Fetch a sample document to get a valid userId
    const doc = await Document.findOne({});
    if (!doc) {
      console.log("No documents found in database. Please upload a document first.");
      process.exit(0);
    }
    const userId = doc.userId;
    console.log("Using User ID:", userId);

    const query = "system design";
    console.log(`Generating embedding for query: "${query}"`);
    const queryEmbedding = await embeddingsModel.embedQuery(query);
    console.log("Query embedding generated. Length:", queryEmbedding.length);

    console.log("Running raw $vectorSearch aggregation...");
    try {
      const rawResults = await DocumentChunk.aggregate([
        {
          $vectorSearch: {
            index: "vector_index",
            path: "embedding",
            queryVector: queryEmbedding,
            numCandidates: 100,
            limit: 5
          }
        }
      ]);

      console.log("Raw Vector Search results count:", rawResults.length);
      if (rawResults.length > 0) {
        rawResults.forEach((res, index) => {
          console.log(`\nRaw Result ${index + 1}:`);
          console.log(`- ID: ${res._id}`);
          console.log(`- Document ID: ${res.documentId}`);
          console.log(`- Content (preview): ${res.content.substring(0, 150)}`);
        });
      } else {
        console.log("Raw Vector Search returned 0 results! The index may still be building (INITIALIZING status) or is empty.");
      }
    } catch (rawErr) {
      console.error("Raw search failed:", rawErr.message);
    }

    process.exit(0);
  } catch (error) {
    console.error("Query test failed:", error);
    process.exit(1);
  }
};

runQuery();
