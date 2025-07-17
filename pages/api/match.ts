import { NextApiRequest, NextApiResponse } from "next";
import { index } from "../../lib/pinecone";

const SCORE_THRESHOLD = 0.05; // Show all matches above 5%

function extractKeywords(text: string, topN: number = 5): string[] {
  if (!text) return [];

  // Enhanced stop words list for tech/job context
  const stopWords = new Set([
    "the",
    "and",
    "for",
    "with",
    "you",
    "are",
    "but",
    "not",
    "all",
    "any",
    "can",
    "has",
    "have",
    "had",
    "was",
    "were",
    "from",
    "that",
    "this",
    "will",
    "your",
    "our",
    "out",
    "use",
    "job",
    "work",
    "role",
    "who",
    "how",
    "why",
    "what",
    "when",
    "where",
    "which",
    "their",
    "them",
    "his",
    "her",
    "she",
    "him",
    "its",
    "they",
    "get",
    "let",
    "may",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "year",
    "years",
    "month",
    "months",
    "day",
    "days",
    "time",
    "times",
    "new",
    "old",
    "good",
    "great",
    "best",
    "better",
    "well",
    "much",
    "many",
    "some",
    "few",
    "each",
    "every",
    "both",
    "either",
    "neither",
    "first",
    "last",
    "next",
    "previous",
    "current",
    "recent",
    "past",
    "future",
    "now",
    "then",
    "here",
    "there",
    "where",
    "everywhere",
    "anywhere",
    "nowhere",
    "up",
    "down",
    "in",
    "out",
    "on",
    "off",
    "over",
    "under",
    "above",
    "below",
    "between",
    "among",
    "through",
    "during",
    "before",
    "after",
    "since",
    "until",
    "while",
    "because",
    "although",
    "unless",
    "if",
    "then",
    "else",
    "when",
    "where",
    "why",
    "how",
    "what",
    "which",
    "who",
    "whom",
    "whose",
  ]);

  // Common tech terms that should be prioritized
  const techTerms = new Set([
    "javascript",
    "python",
    "java",
    "react",
    "node",
    "angular",
    "vue",
    "typescript",
    "html",
    "css",
    "sql",
    "mongodb",
    "postgresql",
    "mysql",
    "redis",
    "docker",
    "kubernetes",
    "aws",
    "azure",
    "gcp",
    "git",
    "github",
    "agile",
    "scrum",
    "api",
    "rest",
    "graphql",
    "microservices",
    "serverless",
    "machine learning",
    "ai",
    "data science",
    "analytics",
    "devops",
    "ci/cd",
    "testing",
    "tdd",
    "bdd",
    "frontend",
    "backend",
    "fullstack",
    "mobile",
    "ios",
    "android",
    "cloud",
    "security",
    "performance",
    "scalability",
    "architecture",
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(
      (word) => word.length > 2 && !stopWords.has(word) && !word.match(/^\d+$/) // Remove pure numbers
    );

  const freq: Record<string, number> = {};
  for (const word of words) {
    // Give bonus weight to tech terms
    const weight = techTerms.has(word) ? 2 : 1;
    freq[word] = (freq[word] || 0) + weight;
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word]) => word);
}

function safeString(val: any): string {
  return typeof val === "string" ? val : "";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const matchesPerJob: any[] = [];

    // Get all vectors from the index to find job IDs
    const indexStats = await index.describeIndexStats();
    const totalVectors = indexStats.totalRecordCount || 0;

    if (totalVectors === 0) {
      return res.status(200).json([]);
    }

    // Query to get all vectors and find job IDs
    const allVectorsResponse = await index.query({
      vector: Array.from({ length: 1536 }, () => 0.1), // Simple vector to get all records
      topK: totalVectors,
      includeMetadata: true,
    });

    const allVectors = allVectorsResponse.matches || [];
    const jobIds = allVectors
      .filter((vector) => vector.id?.startsWith("job-"))
      .map((vector) => vector.id);

    // Fetch job vectors directly from Pinecone using their IDs
    if (jobIds.length > 0) {
      const jobVectorsResponse = await index.fetch(jobIds);
      const jobVectors = jobVectorsResponse.records || {};

      // For each job, use its actual vector to find matching resumes
      for (const [jobId, jobVector] of Object.entries(jobVectors)) {
        if (jobVector.values) {
          // Use the actual job vector to find similar resumes - get more candidates for better selection
          const resumeQueryResponse = await index.query({
            vector: jobVector.values, // This is the actual job embedding vector
            topK: 20, // Get more candidates to select the best 2
            includeMetadata: true,
          });

          // Enhanced scoring with keyword overlap bonus
          const resumeMatches = (resumeQueryResponse.matches || [])
            .map((match) => {
              const baseScore = Math.max(0, Math.min(1, match.score || 0));
              const resumeKeywords = extractKeywords(
                safeString(match.metadata?.content),
                10
              );
              const jobKeywords = extractKeywords(
                safeString(jobVector.metadata?.description),
                10
              );

              // Calculate keyword overlap bonus
              const keywordOverlap = resumeKeywords.filter((k) =>
                jobKeywords.includes(k)
              ).length;
              const overlapBonus = Math.min(0.2, keywordOverlap * 0.05); // Max 20% bonus

              const finalScore = Math.min(1, baseScore + overlapBonus) * 100; // 0–100%

              return {
                ...match,
                score: finalScore,
                keywords: resumeKeywords.slice(0, 5), // Show top 5 keywords
                keywordOverlap: keywordOverlap,
              };
            })
            .filter(
              (match) =>
                match.id?.startsWith("resume-") &&
                match.score >= SCORE_THRESHOLD * 100
            )
            .sort((a, b) => b.score - a.score) // Sort by score descending (highest first)
            .slice(0, 2); // Take top 2 matches with highest scores

          matchesPerJob.push({
            jobId: jobId,
            matches: resumeMatches,
            jobMetadata: jobVector.metadata,
            jobKeywords: extractKeywords(
              safeString(jobVector.metadata?.description),
              5
            ),
          });
        }
      }
    }

    res.status(200).json(matchesPerJob);
  } catch (error) {
    console.error("Error in match API:", error);
    res.status(500).json({ error: "Failed to fetch matches" });
  }
}
