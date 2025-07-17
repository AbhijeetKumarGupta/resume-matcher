"use client";
import { useState } from "react";
import Link from "next/link";

export default function JobListingPage() {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitJob() {
    if (!title.trim() || !desc.trim()) {
      alert("Please fill in both title and description");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: Date.now().toString(),
          title,
          description: desc,
        }),
      });

      if (response.ok) {
        alert("Job posted successfully!");
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
