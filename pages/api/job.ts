import { NextApiRequest, NextApiResponse } from "next";
import { createEmbedding } from "../../lib/openai";
import { index } from "../../lib/pinecone";

/**
 * Enhance job text by prioritizing requirements, skills, and key qualifications
 */
function enhanceJobText(title: string, description: string): string {
  const lines = description.split("\n");
  let enhancedText = title + "\n"; // Always include the job title

  // Keywords that indicate important sections
  const priorityKeywords = [
    "requirements",
    "qualifications",
    "skills",
    "technologies",
    "experience",
    "responsibilities",
    "duties",
    "must have",
    "should have",
    "preferred",
    "proficiency",
    "expertise",
    "knowledge",
    "familiarity",
    "understanding",
  ];

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    // Check if this line contains priority keywords
    const hasPriorityKeywords = priorityKeywords.some((keyword) =>
      lowerLine.includes(keyword)
    );

    // Always include lines with priority keywords
    if (hasPriorityKeywords) {
      enhancedText += line + "\n";
    } else if (line.trim().length > 0) {
      // Include other lines with some probability to maintain context
      if (Math.random() < 0.4) {
        // 40% chance to include non-priority content
        enhancedText += line + "\n";
      }
    }
  }

  return enhancedText.trim();
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { id, title, description } = req.body;

    // Enhanced job text processing - prioritize requirements and skills
    const enhancedJobText = enhanceJobText(title, description);
    const vector = await createEmbedding(enhancedJobText);
    await index.upsert([
      { id: `job-${id}`, values: vector, metadata: { title, description } },
    ]);
    return res.status(200).json({ success: true });
  }
  if (req.method === "GET") {
    return res.status(200).json({ message: "Job API endpoint" });
  }
}
