import { NextApiRequest, NextApiResponse } from "next";
import { formidable } from "formidable";
import fs from "fs";
import pdf from "pdf-parse";
import { createEmbedding } from "../../lib/xenova";
import { index } from "../../lib/pinecone";

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
        const safeName = sanitizeFilename(
          file.originalFilename || "resume.pdf"
        );
        const dataBuffer = fs.readFileSync(file.filepath);
        const parsed = await pdf(dataBuffer);

        const fullText = parsed.text;
        const vector = await createEmbedding(fullText);
        await index.upsert([
          {
            id: `resume-${file.newFilename}`,
            values: vector as number[],
            metadata: {
              name: safeName,
              content: fullText,
            },
          },
        ]);
        res.status(200).json({ success: true });
      } catch (error) {
        console.error("Error processing file:", error);
        res.status(500).json({ error: "Failed to process file" });
      }
    });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
