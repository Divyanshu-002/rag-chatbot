const mongoose = require('mongoose');
const { Document, DocumentChunk } = require('./models/Document');
require('dotenv').config();

const runDiag = async () => {
  try {
    console.log("Connecting to:", process.env.MONGODB_URL);
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Connected successfully.");

    const docCount = await Document.countDocuments({});
    console.log("Total Documents in database:", docCount);

    const chunkCount = await DocumentChunk.countDocuments({});
    console.log("Total Document Chunks in database:", chunkCount);

    const chunksWithEmbedding = await DocumentChunk.countDocuments({ embedding: { $exists: true, $ne: [] } });
    console.log("Document Chunks with populated embeddings:", chunksWithEmbedding);

    if (chunkCount > 0) {
      const sample = await DocumentChunk.findOne({ embedding: { $exists: true, $ne: [] } });
      if (sample) {
        console.log("Sample Chunk Content (first 100 chars):", sample.content.substring(0, 100));
        console.log("Sample Chunk Embedding Length:", sample.embedding.length);
        console.log("Sample Chunk Embedding Preview:", sample.embedding.slice(0, 5));
      } else {
        console.log("No chunks found with embeddings!");
      }
    }

    process.exit(0);
  } catch (error) {
    console.error("Diagnosis error:", error);
    process.exit(1);
  }
};

runDiag();
