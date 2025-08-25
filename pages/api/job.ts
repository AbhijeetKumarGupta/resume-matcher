// Uses local embeddings via @xenova/transformers (see lib/xenova.ts)
import { NextApiRequest, NextApiResponse } from "next";
import { createEmbedding } from "../../lib/xenova";
import { index } from "../../lib/pinecone";
import {
  chunkText,
  CHUNKING_PRESETS,
  ChunkingConfig,
} from "../../lib/chunking";
import { PineconeRecord, RecordMetadata } from "@pinecone-database/pinecone";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { id, title, description } = req.body;

    // Get chunking method from query params or use default
    const chunkingMethod = (req.query.chunking as string) || "semantic";
    const chunkingConfig: ChunkingConfig = {
      ...CHUNKING_PRESETS.JOB_DESCRIPTION_OPTIMIZED,
      method: chunkingMethod as any,
      ...(chunkingMethod === "fixed" && {
        maxChunkSize: 1000,
        overlapSize: 100,
      }),
      ...(chunkingMethod === "sentence" && { maxChunkSize: 1000 }),
      ...(chunkingMethod === "paragraph" && { maxChunkSize: 1000 }),
      ...(chunkingMethod === "semantic" && {
        maxChunkSize: 600,
        minChunkSize: 150,
      }),
      ...(chunkingMethod === "agentic" && {
        maxChunkSize: 600,
        minChunkSize: 150,
      }),
    };

    const jobText = title + "\n" + description;

    // Apply chunking strategy
    const chunks = await chunkText(jobText, chunkingConfig);

    // Create embeddings for each chunk
    const chunkEmbeddings = await Promise.all(
      chunks.map((chunk) => createEmbedding(chunk.text))
    );

    // Store each chunk as a separate vector with metadata
    const vectors = chunks.map((chunk, index) => ({
      id: `job-${id}-chunk-${index}`,
      values: chunkEmbeddings[index] as number[],
      metadata: {
        title,
        description,
        chunkIndex: index,
        totalChunks: chunks.length,
        chunkType: chunk.metadata?.chunkType || "unknown",
        section: chunk.metadata?.section || "content",
        importance: chunk.metadata?.importance || 1.0,
        chunkingMethod: chunkingMethod,
        startIndex: chunk.startIndex,
        endIndex: chunk.endIndex,
      },
    })) as PineconeRecord<RecordMetadata>[];

    await index.upsert(vectors);
    return res.status(200).json({
      success: true,
      chunks: chunks.length,
      chunkingMethod: chunkingMethod,
      chunkingConfig: chunkingConfig,
    });
  }
  if (req.method === "GET") {
    return res.status(200).json({ message: "Job API endpoint" });
  }
}
