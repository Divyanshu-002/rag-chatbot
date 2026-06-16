const { Document, DocumentChunk } = require('../models/Document');
const { embeddingsModel } = require('./langchain');
require('dotenv').config();

// Add document chunks to MongoDB Atlas Vector Search (save embeddings to mongo collection)
const addDocumentChunks = async (chunks) => {
  if (!chunks || chunks.length === 0) return;

  try {
    const texts = chunks.map(chunk => chunk.content);
    // Batch generate embeddings using OpenRouter/OpenAI API
    const embeddings = await embeddingsModel.embedDocuments(texts);

    // Prepare bulk write operations to update DocumentChunk documents with their embeddings
    const bulkOps = chunks.map((chunk, index) => ({
      updateOne: {
        filter: { _id: chunk._id },
        update: { $set: { embedding: embeddings[index] } }
      }
    }));

    await DocumentChunk.bulkWrite(bulkOps);
    console.log(`Successfully generated and stored ${chunks.length} embeddings in MongoDB.`);
  } catch (error) {
    console.error('Error adding document chunks/embeddings to MongoDB:', error);
    throw error;
  }
};

// Query similar chunks from MongoDB Atlas Vector Search
const querySimilarChunks = async (query, userId, n = 5) => {
  try {
    const queryEmbedding = await embeddingsModel.embedQuery(query);

    // MongoDB Atlas Vector Search pipeline stage
    const results = await DocumentChunk.aggregate([
      {
        $vectorSearch: {
          index: "vector_index", // Name of the Atlas Vector Search Index
          path: "embedding",     // Field holding the vector
          queryVector: queryEmbedding,
          numCandidates: 100,    // Recommended to be between 10x and 20x the limit
          limit: n
        }
      },
      {
        // Join document collection to retrieve document metadata and authorize by userId
        $lookup: {
          from: "documents",
          localField: "documentId",
          foreignField: "_id",
          as: "documentInfo"
        }
      },
      {
        $unwind: "$documentInfo"
      },
      {
        // Filter results by userId so users can only search their own documents
        $match: {
          "documentInfo.userId": userId
        }
      },
      {
        $project: {
          content: 1,
          documentId: 1,
          position: 1,
          "documentInfo.filename": 1,
          // Atlas Vector Search score
          score: { $meta: "vectorSearchScore" }
        }
      }
    ]);

    // Format output to match LangChain style interface expected by controller
    return results.map(item => ({
      pageContent: item.content,
      metadata: {
        documentId: item.documentId.toString(),
        position: item.position,
        filename: item.documentInfo.filename
      },
      score: item.score
    }));
  } catch (error) {
    console.error('Error querying similar chunks from MongoDB:', error);
    return [];
  }
};

module.exports = {
  addDocumentChunks,
  querySimilarChunks,
};