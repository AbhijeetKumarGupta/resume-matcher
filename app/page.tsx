import Link from "next/link";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#f9f9f9",
      }}
    >
      <h1 style={{ fontSize: "2.5rem", marginBottom: "2rem", color: "#222" }}>
        Resume Matcher
      </h1>
      <nav style={{ display: "flex", gap: "2rem" }}>
        <Link href="/job-listings" style={navStyle}>
          Job Listings
        </Link>
        <Link href="/matches" style={navStyle}>
          Matches
        </Link>
        <Link href="/upload-resume" style={navStyle}>
          Upload Resume
        </Link>
        <Link href="/chunking-test" style={navStyle}>
          Chunking Test
        </Link>
      </nav>
    </main>
  );
}

const navStyle = {
  padding: "1rem 2rem",
  background: "#fff",
  borderRadius: "8px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  textDecoration: "none",
  color: "#0070f3",
  fontWeight: 500,
  fontSize: "1.2rem",
  transition: "background 0.2s",
} as React.CSSProperties;
