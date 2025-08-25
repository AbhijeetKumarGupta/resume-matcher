"use client";
import { useState } from "react";
import Link from "next/link";
import { chunkingMethods, sampleTexts } from "./helper";

export default function ChunkingTestPage() {
  const [text, setText] = useState("");
  const [chunkingMethod, setChunkingMethod] = useState("agentic");
  const [chunks, setChunks] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  async function testChunking() {
    if (!text.trim()) {
      alert("Please enter some text to test chunking");
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch("/api/get-chunks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          method: chunkingMethod,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setChunks(data.chunks);
        setStats(data.stats);
      } else {
        alert("Failed to test chunking");
      }
    } catch (error) {
      alert("Error testing chunking");
    } finally {
      setIsProcessing(false);
    }
  }

  function loadSampleText(type: string) {
    setText(sampleTexts[type as keyof typeof sampleTexts]);
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <Link href="/" style={backLinkStyle}>
          ← Back to Home
        </Link>
        <h1 style={titleStyle}>Chunking Method Tester</h1>
        <p style={subtitleStyle}>
          Test different text chunking strategies to see how they break down
          your content
        </p>
      </div>

      <div style={contentStyle}>
        <div style={controlsStyle}>
          <div style={methodSelectorStyle}>
            <label style={labelStyle}>Chunking Method:</label>
            <select
              value={chunkingMethod}
              onChange={(e) => setChunkingMethod(e.target.value)}
              style={selectStyle}
            >
              {chunkingMethods.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
            <div style={methodDescriptionStyle}>
              {
                chunkingMethods.find((m) => m.value === chunkingMethod)
                  ?.description
              }
            </div>
          </div>

          <div style={sampleTextsStyle}>
            <label style={labelStyle}>Load Sample Text:</label>
            <div style={buttonGroupStyle}>
              <button
                onClick={() => loadSampleText("resume")}
                style={sampleButtonStyle}
              >
                Resume
              </button>
              <button
                onClick={() => loadSampleText("job")}
                style={sampleButtonStyle}
              >
                Job Description
              </button>
              <button
                onClick={() => loadSampleText("longDocument")}
                style={sampleButtonStyle}
              >
                Long Document
              </button>
            </div>
          </div>
        </div>

        <div style={textInputStyle}>
          <label style={labelStyle}>Text to Chunk:</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter or paste text here to test chunking..."
            style={textareaStyle}
            rows={12}
          />
        </div>

        <button
          onClick={testChunking}
          disabled={!text.trim() || isProcessing}
          style={testButtonStyle}
        >
          {isProcessing ? "Processing..." : "Test Chunking"}
        </button>

        {stats && (
          <div style={statsStyle}>
            <h3>Chunking Statistics</h3>
            <div style={statsGridStyle}>
              <div style={statItemStyle}>
                <strong>Total Chunks:</strong> {stats.totalChunks}
              </div>
              <div style={statItemStyle}>
                <strong>Average Chunk Size:</strong> {stats.averageChunkSize}{" "}
                characters
              </div>
              <div style={statItemStyle}>
                <strong>Min Chunk Size:</strong> {stats.minChunkSize} characters
              </div>
              <div style={statItemStyle}>
                <strong>Max Chunk Size:</strong> {stats.maxChunkSize} characters
              </div>
              <div style={statItemStyle}>
                <strong>Total Text Length:</strong> {stats.totalTextLength}{" "}
                characters
              </div>
            </div>
          </div>
        )}

        {chunks.length > 0 && (
          <div style={chunksStyle}>
            <h3>Generated Chunks ({chunks.length})</h3>
            {chunks.map((chunk, index) => (
              <div key={index} style={chunkItemStyle}>
                <div style={chunkHeaderStyle}>
                  <span style={chunkNumberStyle}>Chunk {index + 1}</span>
                  <span style={chunkSizeStyle}>
                    {chunk.text.length} characters
                  </span>
                  {chunk.metadata?.chunkType && (
                    <span style={chunkTypeStyle}>
                      {chunk.metadata.chunkType}
                    </span>
                  )}
                  {chunk.metadata?.section && (
                    <span style={chunkSectionStyle}>
                      {chunk.metadata.section}
                    </span>
                  )}
                </div>
                <div style={chunkTextStyle}>{chunk.text}</div>
                <div style={chunkMetadataStyle}>
                  <small>
                    Position: {chunk.startIndex} - {chunk.endIndex}
                    {chunk.metadata?.importance &&
                      ` | Importance: ${chunk.metadata.importance}`}
                  </small>
                </div>
              </div>
            ))}
          </div>
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
  margin: "0 0 0.5rem 0",
  fontWeight: "600",
};

const subtitleStyle: React.CSSProperties = {
  color: "rgba(255,255,255,0.9)",
  fontSize: "1.1rem",
  margin: 0,
};

const contentStyle: React.CSSProperties = {
  maxWidth: "1200px",
  margin: "0 auto",
};

const controlsStyle: React.CSSProperties = {
  background: "white",
  borderRadius: "12px",
  padding: "1.5rem",
  marginBottom: "1.5rem",
  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
};

const methodSelectorStyle: React.CSSProperties = {
  marginBottom: "1.5rem",
};

const sampleTextsStyle: React.CSSProperties = {
  marginBottom: "1rem",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "0.5rem",
  fontWeight: "500",
  color: "#374151",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.75rem",
  border: "2px solid #e5e7eb",
  borderRadius: "8px",
  fontSize: "1rem",
  marginBottom: "0.5rem",
};

const methodDescriptionStyle: React.CSSProperties = {
  fontSize: "0.875rem",
  color: "#6b7280",
  fontStyle: "italic",
};

const buttonGroupStyle: React.CSSProperties = {
  display: "flex",
  gap: "0.5rem",
  flexWrap: "wrap",
};

const sampleButtonStyle: React.CSSProperties = {
  padding: "0.5rem 1rem",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  background: "#f9fafb",
  color: "#374151",
  cursor: "pointer",
  fontSize: "0.875rem",
  transition: "all 0.2s",
};

const textInputStyle: React.CSSProperties = {
  background: "white",
  borderRadius: "12px",
  padding: "1.5rem",
  marginBottom: "1.5rem",
  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
};

const textareaStyle: React.CSSProperties = {
  width: "98%",
  padding: "0.75rem",
  border: "2px solid #e5e7eb",
  borderRadius: "8px",
  fontSize: "1rem",
  resize: "vertical",
  fontFamily: "inherit",
};

const testButtonStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  color: "white",
  border: "none",
  padding: "1rem 2rem",
  borderRadius: "8px",
  fontSize: "1.1rem",
  fontWeight: "500",
  cursor: "pointer",
  transition: "transform 0.2s",
  marginBottom: "2rem",
  width: "100%",
};

const statsStyle: React.CSSProperties = {
  background: "white",
  borderRadius: "12px",
  padding: "1.5rem",
  marginBottom: "1.5rem",
  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
};

const statsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "1rem",
  marginTop: "1rem",
};

const statItemStyle: React.CSSProperties = {
  padding: "0.75rem",
  background: "#f8fafc",
  borderRadius: "6px",
  border: "1px solid #e2e8f0",
};

const chunksStyle: React.CSSProperties = {
  background: "white",
  borderRadius: "12px",
  padding: "1.5rem",
  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
};

const chunkItemStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "1rem",
  marginBottom: "1rem",
  background: "#f9fafb",
};

const chunkHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.75rem",
  marginBottom: "0.75rem",
  flexWrap: "wrap",
};

const chunkNumberStyle: React.CSSProperties = {
  fontWeight: "600",
  color: "#374151",
  fontSize: "1.1rem",
};

const chunkSizeStyle: React.CSSProperties = {
  background: "#e0e7ff",
  color: "#3730a3",
  padding: "0.25rem 0.5rem",
  borderRadius: "4px",
  fontSize: "0.875rem",
  fontWeight: "500",
};

const chunkTypeStyle: React.CSSProperties = {
  background: "#d1fae5",
  color: "#065f46",
  padding: "0.25rem 0.5rem",
  borderRadius: "4px",
  fontSize: "0.875rem",
  fontWeight: "500",
};

const chunkSectionStyle: React.CSSProperties = {
  background: "#fef3c7",
  color: "#92400e",
  padding: "0.25rem 0.5rem",
  borderRadius: "4px",
  fontSize: "0.875rem",
  fontWeight: "500",
};

const chunkTextStyle: React.CSSProperties = {
  color: "#374151",
  lineHeight: "1.6",
  marginBottom: "0.75rem",
  whiteSpace: "pre-wrap",
};

const chunkMetadataStyle: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "0.875rem",
  borderTop: "1px solid #e5e7eb",
  paddingTop: "0.75rem",
};
