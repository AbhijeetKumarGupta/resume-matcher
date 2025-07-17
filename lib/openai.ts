import OpenAI from "openai";

// Initialize OpenAI client with API key from environment
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Enhanced preprocessing for better matching:
 * - Remove common resume/job noise words
 * - Focus on skills, technologies, and key terms
 * - Normalize common variations
 */
function preprocess(text: string) {
  // Common noise words in resumes and job postings
  const noiseWords = [
    "resume",
    "cv",
    "curriculum vitae",
    "contact",
    "email",
    "phone",
    "address",
    "objective",
    "summary",
    "experience",
    "education",
    "skills",
    "certifications",
    "references",
    "available upon request",
    "page",
    "of",
    "total",
    "continued",
    "job",
    "position",
    "role",
    "title",
    "company",
    "organization",
    "employer",
    "responsibilities",
    "duties",
    "requirements",
    "qualifications",
    "preferred",
    "minimum",
    "years",
    "experience",
    "degree",
    "bachelor",
    "master",
    "phd",
    "university",
    "college",
    "school",
    "graduated",
    "gpa",
    "grade",
    "point",
    "average",
    "certificate",
    "certification",
    "license",
    "licensed",
  ];

  let processed = text
    .toLowerCase()
    // Remove email addresses
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, " ")
    // Remove phone numbers
    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, " ")
    // Remove URLs
    .replace(/https?:\/\/[^\s]+/g, " ")
    // Remove special characters but keep hyphens in tech terms
    .replace(/[^a-z0-9\s-]/g, " ")
    // Normalize whitespace
    .replace(/\s+/g, " ")
    .trim();

  // Remove noise words
  const words = processed.split(" ");
  const filteredWords = words.filter(
    (word) => word.length > 2 && !noiseWords.includes(word)
  );

  return filteredWords.join(" ");
}

/**
 * Split text into semantic chunks based on sentences and paragraphs.
 * This preserves context better than fixed character chunks.
 */
function chunkText(text: string, maxChunkSize: number = 1000): string[] {
  // Split by sentences first (period, exclamation, question mark)
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

  const chunks: string[] = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();

    // If adding this sentence would exceed max size, start a new chunk
    if (
      currentChunk.length + trimmedSentence.length > maxChunkSize &&
      currentChunk.length > 0
    ) {
      chunks.push(currentChunk.trim());
      currentChunk = trimmedSentence;
    } else {
      currentChunk += (currentChunk ? " " : "") + trimmedSentence;
    }
  }

  // Add the last chunk if it has content
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  // If we have no chunks or chunks are too small, fall back to character-based chunking
  // if (chunks.length === 0 || chunks.every((chunk) => chunk.length < 100)) {
  //   const fallbackChunks: string[] = [];
  //   for (let i = 0; i < text.length; i += maxChunkSize) {
  //     fallbackChunks.push(text.slice(i, i + maxChunkSize));
  //   }
  //   return fallbackChunks;
  // }

  return chunks;
}

/**
 * Average multiple embedding vectors into a single vector.
 */
function averageEmbeddings(embeddings: number[][]): number[] {
  if (embeddings.length === 0) return [];
  const length = embeddings[0].length;
  const avg = new Array(length).fill(0);
  for (const emb of embeddings) {
    for (let i = 0; i < length; i++) {
      avg[i] += emb[i];
    }
  }
  for (let i = 0; i < length; i++) {
    avg[i] /= embeddings.length;
  }
  return avg;
}

// Generate a mock embedding for testing or fallback
const createMockEmbedding = (input: string) => {
  const mockVector = new Array(1536).fill(0).map(() => Math.random() - 0.5);
  return mockVector;
};

/**
 * Create an embedding for the given input text.
 * - Preprocesses and chunks the text
 * - Calls OpenAI API (or returns mock if in mock mode)
 * - Averages chunk embeddings
 */
export const createEmbedding = async (input: string) => {
  const USE_MOCK_ONLY = process.env.USE_MOCK_EMBEDDINGS === "true";
  const cleanInput = preprocess(input);
  const chunks = chunkText(cleanInput, 1000);

  if (USE_MOCK_ONLY) {
    console.log("Using mock embeddings (OpenAI disabled)");
    return createMockEmbedding(cleanInput);
  }

  try {
    const res = await openai.embeddings.create({
      model: "text-embedding-3-small", //"text-embedding-ada-002", //"text-embedding-3-small",
      input: chunks,
    });
    // OpenAI v4+ returns an array of embeddings directly
    const embeddings = Array.isArray(res)
      ? res.map((r: any) => r.embedding)
      : res.data?.map((r: any) => r.embedding) || [];
    return averageEmbeddings(embeddings);
  } catch (error) {
    console.warn("OpenAI quota exceeded, using mock embedding:", error);
    return createMockEmbedding(cleanInput);
  }
};
