"use client";
import { useState } from "react";
import Link from "next/link";

export default function JobListingPage() {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chunkingMethod, setChunkingMethod] = useState("semantic");

  async function submitJob() {
    if (!title.trim() || !desc.trim()) {
      alert("Please fill in both title and description");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/job?chunking=${chunkingMethod}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: Date.now().toString(),
          title,
          description: desc,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(
          `Job posted successfully! Created ${result.chunks} chunks using ${result.chunkingMethod} method.`
        );
        setTitle("");
        setDesc("");
      } else {
        alert("Failed to post job");
      }
    } catch (error) {
      alert("Error posting job");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <Link href="/" style={backLinkStyle}>
          ← Back to Home
        </Link>
        <h1 style={titleStyle}>Post New Job</h1>
      </div>

      <div style={formStyle}>
        <div style={inputGroupStyle}>
          <label style={labelStyle}>Job Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Senior Software Engineer"
            style={inputStyle}
          />
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle}>Job Description</label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Enter detailed job description..."
            style={textareaStyle}
            rows={6}
          />
        </div>

        <div style={chunkingSelectorStyle}>
          <label style={labelStyle}>Chunking Method:</label>
          <select
            value={chunkingMethod}
            onChange={(e) => setChunkingMethod(e.target.value)}
            style={selectStyle}
          >
            <option value="fixed">Fixed-Size Chunking</option>
            <option value="sentence">Sentence-Based Chunking</option>
            <option value="paragraph">Paragraph-Based Chunking</option>
            <option value="semantic">
              Semantic-Based Chunking (Recommended)
            </option>
            <option value="agentic">Agentic Chunking</option>
          </select>
          <div style={methodDescriptionStyle}>
            {chunkingMethod === "fixed" &&
              "Splits text into chunks of fixed size with overlap"}
            {chunkingMethod === "sentence" &&
              "Splits text at sentence boundaries"}
            {chunkingMethod === "paragraph" &&
              "Splits text at paragraph boundaries"}
            {chunkingMethod === "semantic" &&
              "Creates semantically coherent chunks"}
            {chunkingMethod === "agentic" &&
              "Uses intelligent rules for contextually aware chunks"}
          </div>
        </div>

        <button onClick={submitJob} disabled={isSubmitting} style={buttonStyle}>
          {isSubmitting ? "Posting..." : "Post Job"}
        </button>
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
  maxWidth: "800px",
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

const formStyle: React.CSSProperties = {
  maxWidth: "800px",
  margin: "0 auto",
  background: "white",
  borderRadius: "12px",
  padding: "2rem",
  boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
};

const inputGroupStyle: React.CSSProperties = {
  marginBottom: "1.5rem",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "0.5rem",
  fontWeight: "500",
  color: "#374151",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.75rem",
  border: "2px solid #e5e7eb",
  borderRadius: "8px",
  fontSize: "1rem",
  transition: "border-color 0.2s",
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.75rem",
  border: "2px solid #e5e7eb",
  borderRadius: "8px",
  fontSize: "1rem",
  resize: "vertical",
  fontFamily: "inherit",
  transition: "border-color 0.2s",
};

const buttonStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  color: "white",
  border: "none",
  padding: "0.75rem 2rem",
  borderRadius: "8px",
  fontSize: "1rem",
  fontWeight: "500",
  cursor: "pointer",
  transition: "transform 0.2s",
  width: "100%",
};

const chunkingSelectorStyle: React.CSSProperties = {
  marginBottom: "1.5rem",
  padding: "0.75rem",
  border: "2px solid #e5e7eb",
  borderRadius: "8px",
  fontSize: "1rem",
  transition: "border-color 0.2s",
  backgroundColor: "#f9fafb",
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.75rem",
  border: "2px solid #e5e7eb",
  borderRadius: "8px",
  fontSize: "1rem",
  transition: "border-color 0.2s",
  backgroundColor: "white",
};

const methodDescriptionStyle: React.CSSProperties = {
  fontSize: "0.875rem",
  color: "#6b7280",
  marginTop: "0.5rem",
};
