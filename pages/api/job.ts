// Uses local embeddings via @xenova/transformers (see lib/openai.ts)
import { NextApiRequest, NextApiResponse } from "next";
import { createEmbedding } from "../../lib/xenova";
import { index } from "../../lib/pinecone";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { id, title, description } = req.body;

    const jobText = title + "\n" + description;
    const vector = await createEmbedding(jobText);
    await index.upsert([
      {
        id: `job-${id}`,
        values: vector as number[],
        metadata: { title, description },
      },
    ]);
    return res.status(200).json({ success: true });
  }
  if (req.method === "GET") {
    return res.status(200).json({ message: "Job API endpoint" });
  }
}
