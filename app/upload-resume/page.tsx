"use client";
import { useState } from "react";
import Link from "next/link";

export default function UploadResumePage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

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

      const response = await fetch("/api/resume", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert("Resume uploaded successfully!");
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
  opacity: 1,
};
