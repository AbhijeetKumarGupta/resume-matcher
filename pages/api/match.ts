import { NextApiRequest, NextApiResponse } from "next";
import { index } from "../../lib/pinecone";

const SCORE_THRESHOLD = 0.5; // Show all matches above 50%

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const matchesPerJob: any[] = [];

    // Get chunking method filter from query params
    const chunkingMethod = req.query.chunking as string;
    const showChunks = req.query.showChunks === "true";

    // Get all vectors from the index to find job IDs
    const indexStats = await index.describeIndexStats();
    const totalVectors = indexStats.totalRecordCount || 0;

    if (totalVectors === 0) {
      return res.status(200).json([]);
    }

    // Query to get all vectors and find job IDs
    const allVectorsResponse = await index.query({
      vector: Array.from({ length: 384 }, () => 0.1), // Simple vector to get all records
      topK: totalVectors,
      includeMetadata: true,
    });

    const allVectors = allVectorsResponse.matches || [];

    // Filter by chunking method if specified
    const filteredVectors = chunkingMethod
      ? allVectors.filter(
          (vector) => vector.metadata?.chunkingMethod === chunkingMethod
        )
      : allVectors;

    // Group vectors by job (extract job ID from chunk ID)
    const jobGroups = new Map<string, any[]>();
    const resumeGroups = new Map<string, any[]>();

    filteredVectors.forEach((vector) => {
      if (vector.id?.startsWith("job-")) {
        const jobId = vector.id.split("-chunk-")[0]; // Extract base job ID
        if (!jobGroups.has(jobId)) {
          jobGroups.set(jobId, []);
        }
        jobGroups.get(jobId)!.push(vector);
      } else if (vector.id?.startsWith("resume-")) {
        const resumeId = vector.id.split("-chunk-")[0]; // Extract base resume ID
        if (!resumeGroups.has(resumeId)) {
          resumeGroups.set(resumeId, []);
        }
        resumeGroups.get(resumeId)!.push(vector);
      }
    });

    // For each job, find matching resumes
    for (const [jobId, jobChunks] of Array.from(jobGroups.entries())) {
      const jobMatches: any[] = [];

      // Get job metadata from first chunk
      const jobMetadata = jobChunks[0]?.metadata;

      // For each resume, calculate match score
      for (const [resumeId, resumeChunks] of Array.from(
        resumeGroups.entries()
      )) {
        let totalScore = 0;
        let chunkMatches = 0;
        const chunkDetails: any[] = [];

        // Calculate similarity between each job chunk and each resume chunk
        for (const jobChunk of jobChunks) {
          let bestResumeChunkScore = 0;
          let bestResumeChunk: any = null;

          for (const resumeChunk of resumeChunks) {
            // Calculate cosine similarity between job and resume chunks
            const similarity = calculateCosineSimilarity(
              jobChunk.values as number[],
              resumeChunk.values as number[]
            );

            if (similarity > bestResumeChunkScore) {
              bestResumeChunkScore = similarity;
              bestResumeChunk = resumeChunk;
            }
          }

          if (bestResumeChunkScore >= SCORE_THRESHOLD) {
            totalScore += bestResumeChunkScore;
            chunkMatches++;

            if (showChunks) {
              chunkDetails.push({
                jobChunkIndex: jobChunk.metadata?.chunkIndex,
                resumeChunkIndex: bestResumeChunk?.metadata?.chunkIndex,
                score: bestResumeChunkScore,
                jobChunkText:
                  jobChunk.metadata?.content?.substring(0, 100) + "...",
                resumeChunkText:
                  bestResumeChunk?.metadata?.content?.substring(0, 100) + "...",
              });
            }
          }
        }

        // Calculate average score across chunks
        const averageScore = chunkMatches > 0 ? totalScore / chunkMatches : 0;

        if (averageScore >= SCORE_THRESHOLD) {
          const resumeMetadata = resumeChunks[0]?.metadata;
          jobMatches.push({
            resumeId,
            resumeName: resumeMetadata?.name || "Unknown",
            score: averageScore,
            chunkMatches,
            totalJobChunks: jobChunks.length,
            totalResumeChunks: resumeChunks.length,
            chunkingMethod: jobMetadata?.chunkingMethod || "unknown",
            ...(showChunks && { chunkDetails }),
          });
        }
      }

      // Sort matches by score and take top 2
      const topMatches = jobMatches
        .sort((a, b) => b.score - a.score)
        .slice(0, 2);

      matchesPerJob.push({
        jobId: jobId.replace("job-", ""),
        matches: topMatches,
        jobMetadata: {
          title: jobMetadata?.title || "Unknown Job",
          description: jobMetadata?.description || "No description available",
          chunkingMethod: jobMetadata?.chunkingMethod || "unknown",
          totalChunks: jobChunks.length,
        },
      });
    }

    res.status(200).json(matchesPerJob);
  } catch (error) {
    console.error("Error in match API:", error);
    res.status(500).json({ error: "Failed to fetch matches" });
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
function calculateCosineSimilarity(
  vectorA: number[],
  vectorB: number[]
): number {
  if (vectorA.length !== vectorB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}
