"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Match {
  metadata: {
    name: string;
  };
  score: number;
}

interface JobMatch {
  jobId: string;
  matches: Match[];
  jobMetadata?: {
    title: string;
    description: string;
  };
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMatches();
  }, []);

  async function fetchMatches() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/match");
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setMatches(data);
      } else {
        throw new Error("Invalid data format received");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={loadingStyle}>
          <span className="spinner" style={spinnerStyle}></span>
          Loading matches...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <div style={errorStyle}>
          <p>Error: {error}</p>
          <button onClick={fetchMatches} style={retryButtonStyle}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <Link href="/" style={backLinkStyle}>
          ← Back to Home
        </Link>
        <h1 style={titleStyle}>Resume Matches</h1>
      </div>

      <div style={contentStyle}>
        {matches.length === 0 ? (
          <div style={emptyStateStyle}>
            <h2>No matches found</h2>
            <p>Upload some resumes and post jobs to see matches here.</p>
          </div>
        ) : (
          matches.map((job) => (
            <div key={job.jobId} style={jobCardStyle}>
              <h2 style={jobTitleStyle}>
                {job.jobMetadata?.title || `Job ID: ${job.jobId}`}
              </h2>
              {job.jobMetadata?.description && (
                <p style={jobDescriptionStyle}>{job.jobMetadata.description}</p>
              )}
              <div style={matchesListStyle}>
                {job.matches.length === 0 ? (
                  <p style={noMatchesStyle}>
                    No strong resume matches found for this job.
                  </p>
                ) : (
                  job.matches.map((match, i) => (
                    <div key={i} style={matchItemStyle}>
                      <div>
                        <span style={matchNameStyle}>
                          {match.metadata.name}
                        </span>
                        <span style={matchScoreStyle}>
                          Score: {(match.score * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  padding: "2rem",
};

const headerStyle: React.CSSProperties = {
  maxWidth: "1200px",
  margin: "0 auto 2rem",
};

const backLinkStyle: React.CSSProperties = {
  color: "white",
  textDecoration: "none",
  fontSize: "1rem",
  marginBottom: "1rem",
  display: "inline-block",
};

const titleStyle: React.CSSProperties = {
  fontSize: "2.5rem",
  color: "white",
  margin: "0",
  fontWeight: "600",
};

const contentStyle: React.CSSProperties = {
  maxWidth: "1200px",
  margin: "0 auto",
};

const jobCardStyle: React.CSSProperties = {
  background: "white",
  borderRadius: "12px",
  padding: "1.5rem",
  marginBottom: "1.5rem",
  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
};

const jobTitleStyle: React.CSSProperties = {
  fontSize: "1.25rem",
  fontWeight: "600",
  color: "#374151",
  margin: "0 0 0.5rem 0",
};

const jobDescriptionStyle: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "0.875rem",
  margin: "0 0 1rem 0",
  lineHeight: "1.5",
};

const matchesListStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.75rem",
};

const matchItemStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.25rem",
  justifyContent: "space-between",
  alignItems: "flex-start",
  padding: "0.75rem",
  background: "#f8fafc",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
};

const matchNameStyle: React.CSSProperties = {
  fontWeight: "500",
  color: "#374151",
  marginRight: "1rem",
};

const matchScoreStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  color: "white",
  padding: "0.25rem 0.75rem",
  borderRadius: "20px",
  fontSize: "0.875rem",
  fontWeight: "500",
  marginLeft: "0.5rem",
};

const noMatchesStyle: React.CSSProperties = {
  color: "#6b7280",
  fontStyle: "italic",
  textAlign: "center",
  padding: "1rem",
};

const emptyStateStyle: React.CSSProperties = {
  background: "white",
  borderRadius: "12px",
  padding: "3rem",
  textAlign: "center",
  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
};

const loadingStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "50vh",
  color: "white",
  fontSize: "1.25rem",
};

const spinnerStyle: React.CSSProperties = {
  width: "32px",
  height: "32px",
  border: "4px solid #e0e7ff",
  borderTop: "4px solid #764ba2",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
  marginBottom: "1rem",
};

const errorStyle: React.CSSProperties = {
  background: "white",
  borderRadius: "12px",
  padding: "2rem",
  textAlign: "center",
  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
  color: "#dc2626",
};

const retryButtonStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  color: "white",
  border: "none",
  padding: "0.5rem 1rem",
  borderRadius: "6px",
  cursor: "pointer",
  marginTop: "1rem",
};

const keywordsRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  margin: "0.5rem 0 0.5rem 0",
  flexWrap: "wrap",
};

const keywordsLabelStyle: React.CSSProperties = {
  fontWeight: 500,
  color: "#764ba2",
  fontSize: "0.95rem",
};

const keywordStyle: React.CSSProperties = {
  background: "#ede9fe",
  color: "#5b21b6",
  borderRadius: "6px",
  padding: "0.2rem 0.7rem",
  fontSize: "0.95rem",
  fontWeight: 500,
  marginRight: "0.25rem",
};
