const {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings
} = require("@langchain/google-genai");

const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
const { Document } = require("@langchain/core/documents");

require("dotenv").config();

// Gemini LLM for response generation
const llm = new ChatGoogleGenerativeAI({
model: "gemini-3.8-flash",
  temperature: 0,
  maxOutputTokens: 1000,
  apiKey: process.env.GOOGLE_API_KEY,
});

// Text splitter from LangChain
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

// Gemini embedding model
const embeddingsModel = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-001",
  apiKey: process.env.GOOGLE_API_KEY,
});

// Function to create document chunks
const createDocumentChunks = async (text) => {
  const chunks = await textSplitter.splitText(text);

  return chunks.map(
    (chunk) => new Document({ pageContent: chunk })
  );
};

// Function to generate embeddings
const generateEmbeddings = async (documents) => {
  const embeddings = [];

  for (const doc of documents) {
    const embedding = await embeddingsModel.embedQuery(
      doc.pageContent
    );

    embeddings.push(embedding);
  }

  return embeddings;
};

const findSimilarDocuments = async (query, documents, topK = 3) => {
  const queryEmbedding = await embeddingsModel.embedQuery(query);

  const similarities = documents.map((doc) => ({
    document: doc,
    score: cosineSimilarity(
      queryEmbedding,
      doc.embedding
    ),
  }));

  return similarities
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
};

// Cosine similarity
const cosineSimilarity = (vecA, vecB) => {
  const dotProduct = vecA.reduce(
    (acc, val, i) => acc + val * vecB[i],
    0
  );

  const normA = Math.sqrt(
    vecA.reduce((acc, val) => acc + val * val, 0)
  );

  const normB = Math.sqrt(
    vecB.reduce((acc, val) => acc + val * val, 0)
  );

  return dotProduct / (normA * normB);
};

module.exports = {
  llm,
  textSplitter,
  embeddingsModel,
  generateEmbeddings,
  findSimilarDocuments,
  createDocumentChunks,
};