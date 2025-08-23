"use client";
import { useState } from "react";
import Link from "next/link";

export default function ChunkingTestPage() {
  const [text, setText] = useState("");
  const [chunkingMethod, setChunkingMethod] = useState("agentic");
  const [chunks, setChunks] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const sampleTexts = {
    resume: `JANE SMITH
Frontend + Full Stack Developer

SKILLS
- JavaScript ES6+, TypeScript
- React.js, Next.js, Redux, Tailwind CSS
- NestJS, Express.js
- MongoDB, REST APIs
- Vite, Webpack, GitHub Actions

EXPERIENCE
Senior Developer at TechCorp (2020-2023)
- Built dynamic web interfaces with React and Tailwind
- Developed scalable backend APIs using NestJS
- Worked in Agile sprints, used Git for CI/CD integration

Junior Developer at StartupXYZ (2018-2020)
- Created responsive web applications
- Implemented user authentication systems
- Collaborated with design team on UI/UX improvements

EDUCATION
BSc in Information Technology
University of Technology, 2018

PROJECTS
E-commerce Frontend (React + Redux)
- Built complete shopping cart functionality
- Implemented user authentication and profiles
- Integrated with payment gateway APIs

Backend Order System (NestJS + MongoDB)
- Designed RESTful API architecture
- Implemented order processing workflow
- Added real-time notifications using WebSockets`,

    job: `Senior Software Engineer - Full Stack

COMPANY OVERVIEW
We are a fast-growing tech company looking for a talented Full Stack Developer to join our engineering team. You will work on cutting-edge web applications and help shape our technical architecture.

REQUIREMENTS
- 5+ years of experience in software development
- Strong proficiency in JavaScript/TypeScript
- Experience with React.js, Node.js, and modern web frameworks
- Knowledge of database design and API development
- Experience with cloud platforms (AWS, Azure, or GCP)
- Understanding of CI/CD pipelines and DevOps practices

RESPONSIBILITIES
- Develop and maintain web applications
- Collaborate with cross-functional teams
- Write clean, maintainable, and well-tested code
- Participate in code reviews and technical discussions
- Mentor junior developers and share knowledge

TECHNICAL SKILLS
Frontend: React.js, TypeScript, HTML5, CSS3, Redux
Backend: Node.js, Express.js, NestJS, REST APIs
Database: MongoDB, PostgreSQL, Redis
DevOps: Docker, Kubernetes, AWS, CI/CD
Tools: Git, VS Code, Postman, Jira

BENEFITS
- Competitive salary and equity
- Flexible work arrangements
- Professional development opportunities
- Health insurance and wellness programs
- Modern office with latest equipment`,

    longDocument: `CHAPTER 1: INTRODUCTION TO ARTIFICIAL INTELLIGENCE

Artificial Intelligence (AI) represents one of the most transformative technologies of the 21st century. It encompasses a broad range of computational techniques that enable machines to perform tasks that traditionally required human intelligence.

DEFINITION AND SCOPE
AI can be defined as the simulation of human intelligence in machines that are programmed to think and learn like humans. The scope of AI is vast, covering areas such as machine learning, natural language processing, computer vision, robotics, and expert systems.

HISTORICAL PERSPECTIVE
The field of AI has evolved significantly since its inception in the 1950s. Early AI research focused on symbolic reasoning and rule-based systems. The 1980s saw the rise of expert systems, while the 1990s and 2000s brought machine learning to the forefront.

MODERN APPLICATIONS
Today, AI is embedded in countless applications that we use daily. From virtual assistants like Siri and Alexa to recommendation systems on Netflix and Amazon, AI has become ubiquitous in modern technology.

CHAPTER 2: MACHINE LEARNING FUNDAMENTALS

Machine learning is a subset of AI that focuses on algorithms and statistical models that enable computers to improve their performance on a specific task through experience.

SUPERVISED LEARNING
Supervised learning involves training a model on labeled data. The model learns to map input features to known output labels, enabling it to make predictions on new, unseen data.

UNSUPERVISED LEARNING
Unsupervised learning works with unlabeled data, discovering hidden patterns and structures. Clustering and dimensionality reduction are common unsupervised learning techniques.

REINFORCEMENT LEARNING
Reinforcement learning involves an agent learning to make decisions by taking actions in an environment and receiving rewards or penalties based on those actions.

CHAPTER 3: DEEP LEARNING AND NEURAL NETWORKS

Deep learning represents a significant advancement in machine learning, using artificial neural networks with multiple layers to model complex patterns in data.

NEURAL NETWORK ARCHITECTURE
Neural networks consist of interconnected nodes (neurons) organized in layers. The input layer receives data, hidden layers process it, and the output layer produces results.

TRAINING PROCESS
Training a neural network involves adjusting weights and biases to minimize the difference between predicted and actual outputs. This is typically done using gradient descent optimization.

APPLICATIONS IN COMPUTER VISION
Deep learning has revolutionized computer vision, enabling breakthroughs in image recognition, object detection, and image generation. Convolutional Neural Networks (CNNs) are particularly effective for visual tasks.

NATURAL LANGUAGE PROCESSING
In NLP, deep learning models like transformers have achieved remarkable success in tasks such as language translation, text generation, and sentiment analysis.`,
  };

  const chunkingMethods = [
    {
      value: "fixed",
      label: "Fixed-Size Chunking",
      description:
        "Splits text into chunks of fixed size with optional overlap",
    },
    {
      value: "sentence",
      label: "Sentence-Based Chunking",
      description:
        "Splits text at sentence boundaries while respecting max chunk size",
    },
    {
      value: "paragraph",
      label: "Paragraph-Based Chunking",
      description:
        "Splits text at paragraph boundaries while respecting max chunk size",
    },
    {
      value: "semantic",
      label: "Semantic-Based Chunking",
      description:
        "Creates semantically coherent chunks based on content structure",
    },
    {
      value: "agentic",
      label: "Agentic Chunking",
      description: "Uses intelligent rules to create contextually aware chunks",
    },
  ];

  async function testChunking() {
    if (!text.trim()) {
      alert("Please enter some text to test chunking");
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch("/api/chunking-test", {
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
