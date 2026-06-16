const { ChatOpenAI, OpenAIEmbeddings } = require("@langchain/openai");
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
const { Document } = require("@langchain/core/documents");

require('dotenv').config();

// OpenRouter LLM for response generation
const llm = new ChatOpenAI({
  model: "google/gemini-2.5-flash",
  temperature: 0, 
  maxTokens: 1000,
  openAIApiKey: process.env.GOOGLE_API_KEY,
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
  }
});

// Text splitter from LangChain
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

// OpenRouter embedding model
const embeddingsModel = new OpenAIEmbeddings({
  model: "openai/text-embedding-3-small", 
  openAIApiKey: process.env.GOOGLE_API_KEY,
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
  }
});

// Function to create document chunks
const createDocumentChunks = async (text) => {
  const chunks = await textSplitter.splitText(text);
  return chunks.map(chunk => new Document({ pageContent: chunk }));
};

// Function to generate embeddings for document chunks
const generateEmbeddings = async (documents) => {
  const embeddings = [];
  for (const doc of documents) {
    const embedding = await embeddingsModel.embedQuery(doc.pageContent);
    embeddings.push(embedding);
  }
  return embeddings;
};

const findSimilarDocuments = async (query, documents, topK = 3) => {
  const queryEmbedding = await embeddingsModel.embedQuery(query);

  // Calculate cosine similarity between query and documents
  const similarities = documents.map((doc, index) => ({
    document: doc,
    score: cosineSimilarity(queryEmbedding, doc.embedding)
  }));

  // Sort by similarity score and return top K results
  return similarities
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
};

// Utility function to calculate cosine similarity
const cosineSimilarity = (vecA, vecB) => {
  const dotProduct = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
  const normB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
  return dotProduct / (normA * normB);
};

module.exports = {
  llm,
  textSplitter,
  embeddingsModel,
  generateEmbeddings,
  findSimilarDocuments,
  createDocumentChunks
};
