import { NextApiRequest, NextApiResponse } from "next";
import { index } from "../../lib/pinecone";

const SCORE_THRESHOLD = 0.5; // Show all matches above 50%

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
      vector: Array.from({ length: 384 }, () => 0.1), // Simple vector to get all records
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

          const resumeMatches = (resumeQueryResponse.matches || [])
            .filter(
              (match) =>
                match.id?.startsWith("resume-") &&
                (match.score || 0) >= SCORE_THRESHOLD
            )
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .slice(0, 2);

          matchesPerJob.push({
            jobId: jobId,
            matches: resumeMatches,
            jobMetadata: jobVector.metadata,
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
