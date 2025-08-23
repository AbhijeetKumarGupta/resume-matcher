"use client";
import { useState } from "react";
import Link from "next/link";

export default function UploadResumePage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [chunkingMethod, setChunkingMethod] = useState("agentic");

  async function upload() {
    if (!file) {
      alert("Please select a file first");
      return;
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      alert("Please select a PDF file");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("resume", file);

      const response = await fetch(`/api/resume?chunking=${chunkingMethod}`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        alert(
          `Resume uploaded successfully! Created ${result.chunks} chunks using ${result.chunkingMethod} method.`
        );
        setFile(null);
        // Reset file input
        const fileInput = document.getElementById(
          "file-input"
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        alert("Failed to upload resume");
      }
    } catch (error) {
      alert("Error uploading resume");
    } finally {
      setIsUploading(false);
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <Link href="/" style={backLinkStyle}>
          ← Back to Home
        </Link>
        <h1 style={titleStyle}>Upload Resume</h1>
      </div>

      <div style={formStyle}>
        <div style={uploadAreaStyle}>
          <div
            style={{
              ...dropZoneStyle,
              ...(dragActive ? dragActiveStyle : {}),
              ...(file ? fileSelectedStyle : {}),
            }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              id="file-input"
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              style={fileInputStyle}
            />

            {file ? (
              <div style={fileInfoStyle}>
                <div style={fileIconStyle}>📄</div>
                <div>
                  <div style={fileNameStyle}>{file.name}</div>
                  <div style={fileSizeStyle}>
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              </div>
            ) : (
              <div style={uploadPromptStyle}>
                <div style={uploadIconStyle}>📁</div>
                <p style={uploadTextStyle}>
                  Drag and drop your PDF resume here, or click to browse
                </p>
                <p style={uploadHintStyle}>Only PDF files are supported</p>
              </div>
            )}
          </div>
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
            <option value="semantic">Semantic-Based Chunking</option>
            <option value="agentic">Agentic Chunking (Recommended)</option>
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

        <button
          onClick={upload}
          disabled={!file || isUploading}
          style={buttonStyle}
        >
          {isUploading ? "Uploading..." : "Upload Resume"}
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

const uploadAreaStyle: React.CSSProperties = {
  marginBottom: "2rem",
};

const dropZoneStyle: React.CSSProperties = {
  border: "2px dashed #d1d5db",
  borderRadius: "12px",
  padding: "3rem 2rem",
  textAlign: "center",
  cursor: "pointer",
  transition: "all 0.2s ease",
  position: "relative",
  background: "#f9fafb",
};

const dragActiveStyle: React.CSSProperties = {
  borderColor: "#667eea",
  background: "#f0f4ff",
};

const fileSelectedStyle: React.CSSProperties = {
  borderColor: "#10b981",
  background: "#f0fdf4",
};

const fileInputStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  opacity: 0,
  cursor: "pointer",
};

const uploadPromptStyle: React.CSSProperties = {
  pointerEvents: "none",
};

const uploadIconStyle: React.CSSProperties = {
  fontSize: "3rem",
  marginBottom: "1rem",
};

const uploadTextStyle: React.CSSProperties = {
  fontSize: "1.125rem",
  color: "#374151",
  margin: "0 0 0.5rem 0",
  fontWeight: "500",
};

const uploadHintStyle: React.CSSProperties = {
  fontSize: "0.875rem",
  color: "#6b7280",
  margin: 0,
};

const fileInfoStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "1rem",
  pointerEvents: "none",
};

const fileIconStyle: React.CSSProperties = {
  fontSize: "2rem",
};

const fileNameStyle: React.CSSProperties = {
  fontSize: "1.125rem",
  fontWeight: "500",
  color: "#374151",
  margin: 0,
};

const fileSizeStyle: React.CSSProperties = {
  fontSize: "0.875rem",
  color: "#6b7280",
  margin: 0,
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
  marginBottom: "2rem",
  padding: "1rem",
  background: "#f9fafb",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
};

const labelStyle: React.CSSProperties = {
  fontSize: "0.875rem",
  color: "#374151",
  marginBottom: "0.5rem",
  display: "block",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.75rem 1rem",
  borderRadius: "6px",
  border: "1px solid #d1d5db",
  fontSize: "0.875rem",
  color: "#374151",
  background: "white",
  cursor: "pointer",
  appearance: "none",
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%234b5563' %3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd' /%3E%3C/svg%3E\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 1rem center",
  backgroundSize: "1.5em",
};

const methodDescriptionStyle: React.CSSProperties = {
  fontSize: "0.75rem",
  color: "#6b7280",
  marginTop: "0.5rem",
  lineHeight: "1.25",
};
