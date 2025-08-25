import { NextApiRequest, NextApiResponse } from "next";
import {
  chunkText,
  getChunkingStats,
  ChunkingConfig,
} from "../../lib/chunking";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const { text, method } = req.body;

      if (!text || !method) {
        return res.status(400).json({
          error: "Text and method are required",
        });
      }

      // Configure chunking based on method
      const chunkingConfig: ChunkingConfig = {
        method: method as any,
        ...(method === "fixed" && { maxChunkSize: 350, overlapSize: 100 }),
        ...(method === "sentence" && { maxChunkSize: 350 }),
        ...(method === "paragraph" && { maxChunkSize: 350 }),
        ...(method === "semantic" && { maxChunkSize: 350, minChunkSize: 150 }),
        ...(method === "agentic" && { maxChunkSize: 600, minChunkSize: 150 }),
      };

      // Apply chunking
      const chunks = await chunkText(text, chunkingConfig);

      // Get statistics
      const stats = getChunkingStats(chunks);

      res.status(200).json({
        success: true,
        chunks,
        stats,
        config: chunkingConfig,
      });
    } catch (error) {
      console.error("Error in chunking test:", error);
      res.status(500).json({
        error: "Failed to process chunking test",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
