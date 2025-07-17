import { NextApiRequest, NextApiResponse } from "next";
import { formidable } from "formidable";
import fs from "fs";
import pdf from "pdf-parse";
import { createEmbedding } from "../../lib/openai";
import { index } from "../../lib/pinecone";

export const config = { api: { bodyParser: false } };

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

/**
 * Enhance resume text by prioritizing key sections and removing noise
 */
function enhanceResumeText(text: string): string {
  // Common section headers in resumes
  const sections = [
    "skills",
    "technical skills",
    "technologies",
    "programming languages",
    "experience",
    "work experience",
    "employment",
    "professional experience",
    "education",
    "academic",
    "certifications",
    "certificates",
    "licenses",
    "projects",
    "personal projects",
    "portfolio",
    "achievements",
    "accomplishments",
  ];

  const lines = text.split("\n");
  let enhancedText = "";
  let inKeySection = false;

  for (const line of lines) {
    const lowerLine = line.toLowerCase().trim();

    // Check if this line is a section header
    const isSectionHeader = sections.some(
      (section) =>
        lowerLine.includes(section) ||
        lowerLine.match(new RegExp(`^${section}`, "i"))
    );

    if (isSectionHeader) {
      inKeySection = true;
      enhancedText += line + "\n";
    } else if (inKeySection && line.trim().length > 0) {
      // Add content from key sections
      enhancedText += line + "\n";
    } else if (!inKeySection && line.trim().length > 0) {
      // Add some content from other sections but with lower priority
      if (Math.random() < 0.3) {
        // 30% chance to include non-key section content
        enhancedText += line + "\n";
      }
    }
  }

  // If no key sections found, use the original text but limit length
  if (enhancedText.trim().length < 200) {
    enhancedText = text.slice(0, 3000); // Use more text if no sections identified
  }

  return enhancedText.trim();
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

        // Enhanced text extraction with section prioritization
        const fullText = parsed.text;
        const enhancedText = enhanceResumeText(fullText);

        const vector = await createEmbedding(enhancedText);
        await index.upsert([
          {
            id: `resume-${file.newFilename}`,
            values: vector,
            metadata: {
              name: safeName,
              content: enhancedText, // Store the enhanced PDF content for keyword extraction
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
