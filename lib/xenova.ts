// Embedding function using @xenova/transformers (all-MiniLM-L6-v2)
// No API key or payment required. First run will download the model (~90MB).
import { pipeline } from "@xenova/transformers";

let embedderPromise: Promise<any> | null = null;

export const createEmbedding = async (input: string) => {
  // Lazy-load the model (singleton)
  if (!embedderPromise) {
    embedderPromise = pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  const embedder = await embedderPromise;
  // Get the embedding (mean pooled, normalized)
  const output = await embedder(input, { pooling: "mean", normalize: true });
  // output.data is a Float32Array; convert to regular array for compatibility
  return Array.from(output.data);
};
