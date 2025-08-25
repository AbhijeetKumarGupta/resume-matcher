import { NextApiRequest, NextApiResponse } from "next";
import { formidable } from "formidable";
import fs from "fs";
import pdf from "pdf-parse";
import { createEmbedding } from "../../lib/xenova";
import { index } from "../../lib/pinecone";
import {
  chunkText,
  CHUNKING_PRESETS,
  ChunkingConfig,
} from "../../lib/chunking";
import { PineconeRecord, RecordMetadata } from "@pinecone-database/pinecone";

export const config = { api: { bodyParser: false } };

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const form = formidable();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Formidable error:", err);
        return res.status(500).json({ error: "Failed to parse form" });
      }
      try {
        const file = files.resume?.[0];
        if (!file) {
          return res.status(400).json({ error: "No file uploaded" });
        }

        // Get chunking method from query params or use default
        const chunkingMethod = (req.query.chunking as string) || "agentic";
        const chunkingConfig: ChunkingConfig = {
          ...CHUNKING_PRESETS.RESUME_OPTIMIZED,
          method: chunkingMethod as any,
          ...(chunkingMethod === "fixed" && {
            maxChunkSize: 1000,
            overlapSize: 100,
          }),
          ...(chunkingMethod === "sentence" && { maxChunkSize: 1000 }),
          ...(chunkingMethod === "paragraph" && { maxChunkSize: 1000 }),
          ...(chunkingMethod === "semantic" && {
            maxChunkSize: 800,
            minChunkSize: 200,
          }),
          ...(chunkingMethod === "agentic" && {
            maxChunkSize: 800,
            minChunkSize: 200,
          }),
        };

        const safeName = sanitizeFilename(
          file.originalFilename || "resume.pdf"
        );
        const dataBuffer = fs.readFileSync(file.filepath);
        const parsed = await pdf(dataBuffer);

        const fullText = parsed.text;

        // Apply chunking strategy
        const chunks = await chunkText(fullText, chunkingConfig);

        // Create embeddings for each chunk
        const chunkEmbeddings = await Promise.all(
          chunks.map((chunk) => createEmbedding(chunk.text))
        );

        // Store each chunk as a separate vector with metadata
        const vectors = chunks.map((chunk, index) => ({
          id: `resume-${file.newFilename}-chunk-${index}`,
          values: chunkEmbeddings[index] as number[],
          metadata: {
            name: safeName,
            content: chunk.text,
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

        res.status(200).json({
          success: true,
          chunks: chunks.length,
          chunkingMethod: chunkingMethod,
          chunkingConfig: chunkingConfig,
        });
      } catch (error) {
        console.error("Error processing file:", error);
        res.status(500).json({ error: "Failed to process file" });
      }
    });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
