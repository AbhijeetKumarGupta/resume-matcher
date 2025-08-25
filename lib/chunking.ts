// Chunking strategies for text processing
// Easily switch between different chunking methods for testing

import {
  Pinecone,
  PineconeRecord,
  RecordMetadata,
} from "@pinecone-database/pinecone";
import { createEmbedding } from "./xenova";
import { v4 as uuidv4 } from "uuid";

export interface ChunkingConfig {
  method: "fixed" | "sentence" | "paragraph" | "semantic" | "agentic";
  maxChunkSize?: number; // For fixed-size chunking
  overlapSize?: number; // For fixed-size chunking with overlap
  minChunkSize?: number; // Minimum chunk size for semantic/agentic
  preserveHeaders?: boolean; // Whether to preserve section headers
  includeMetadata?: boolean; // Whether to include chunk metadata
  namespace?: string; // For Pinecone storage
}

export interface TextChunk {
  id?: string;
  text: string;
  startIndex?: number;
  endIndex?: number;
  metadata?: Record<string, any>;
  embedding?: number[];
}

interface DocumentAnalysis {
  documentType: string;
  complexity: number;
  structure: { sections: string[] };
  semanticCoherence: number;
  entities: string[];
}

interface SemanticSection {
  start: number;
  end: number;
  type: string;
  importance: number;
}

/**
 * Main chunking function that routes to different strategies
 */
export async function chunkText(
  text: string,
  config: ChunkingConfig
): Promise<TextChunk[]> {
  const normalizedText = text.trim();

  switch (config.method) {
    case "fixed":
      return fixedSizeChunking(normalizedText, config);
    case "sentence":
      return sentenceBasedChunking(normalizedText, config);
    case "paragraph":
      return paragraphBasedChunking(normalizedText, config);
    case "semantic":
      return semanticBasedChunking(normalizedText, config);
    case "agentic":
      return await agenticChunking(normalizedText, config);
    default:
      throw new Error(`Unknown chunking method: ${config.method}`);
  }
}

/**
 * 1. Fixed-Size Chunking
 * Splits text into chunks of fixed size with optional overlap
 */
function fixedSizeChunking(text: string, config: ChunkingConfig): TextChunk[] {
  const maxSize = config.maxChunkSize || 1000;
  const overlap = config.overlapSize || 100;
  const chunks: TextChunk[] = [];

  let startIndex = 0;
  let chunkIndex = 0;

  while (startIndex < text.length) {
    const endIndex = Math.min(startIndex + maxSize, text.length);

    // Try to break at word boundaries
    let actualEndIndex = endIndex;
    if (endIndex < text.length) {
      // Find the last space before the end
      const lastSpace = text.lastIndexOf(" ", endIndex);
      if (lastSpace > startIndex + maxSize * 0.8) {
        // Only break at space if it's not too early
        actualEndIndex = lastSpace;
      }
    }

    chunks.push({
      text: text.slice(startIndex, actualEndIndex).trim(),
      startIndex,
      endIndex: actualEndIndex,
      metadata: {
        chunkType: "fixed",
        importance: 1.0,
      },
    });

    // Move start index with overlap - ensure we advance by at least (maxSize - overlap)
    startIndex = Math.max(
      startIndex + (maxSize - overlap),
      actualEndIndex - overlap
    );
    chunkIndex++;

    // Prevent infinite loops
    if (startIndex >= text.length) break;
  }

  return chunks;
}

/**
 * 2. Sentence-Based Chunking
 * Splits text at sentence boundaries while respecting max chunk size
 */
function sentenceBasedChunking(
  text: string,
  config: ChunkingConfig
): TextChunk[] {
  const maxSize = config.maxChunkSize || 1000;
  const chunks: TextChunk[] = [];

  // Enhanced sentence splitting with better regex patterns
  // This regex looks for sentence endings (.!?) followed by whitespace and a capital letter
  const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z])/);
  let currentChunk = "";
  let startIndex = 0;

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) continue;

    // If adding this sentence would exceed max size, start a new chunk
    if (
      currentChunk.length + trimmedSentence.length > maxSize &&
      currentChunk.length > 0
    ) {
      chunks.push({
        text: currentChunk.trim(),
        startIndex,
        endIndex: startIndex + currentChunk.length,
        metadata: {
          chunkType: "sentence",
          importance: 1.0,
        },
      });

      // Move to next position
      startIndex += currentChunk.length;
      currentChunk = trimmedSentence;
    } else {
      currentChunk += (currentChunk ? " " : "") + trimmedSentence;
    }
  }

  // Add the final chunk if there's remaining content
  if (currentChunk.trim()) {
    chunks.push({
      text: currentChunk.trim(),
      startIndex,
      endIndex: startIndex + currentChunk.length,
      metadata: {
        chunkType: "sentence",
        importance: 1.0,
      },
    });
  }

  return chunks;
}

/**
 * 3. Paragraph-Based Chunking
 * Splits text at paragraph boundaries while respecting max chunk size
 */
function paragraphBasedChunking(
  text: string,
  config: ChunkingConfig
): TextChunk[] {
  const maxSize = config.maxChunkSize || 1000;
  const chunks: TextChunk[] = [];

  // Split into paragraphs
  const paragraphs = text.split(/\n\s*\n/);
  let currentChunk = "";
  let startIndex = 0;
  let chunkIndex = 0;

  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();
    if (!trimmedParagraph) continue;

    // If adding this paragraph would exceed max size, start a new chunk
    if (
      currentChunk.length + trimmedParagraph.length > maxSize &&
      currentChunk.length > 0
    ) {
      chunks.push({
        text: currentChunk.trim(),
        startIndex,
        endIndex: startIndex + currentChunk.length,
        metadata: {
          chunkType: "paragraph",
          importance: 1.0,
        },
      });

      startIndex = text.indexOf(currentChunk, startIndex) + currentChunk.length;
      currentChunk = trimmedParagraph;
      chunkIndex++;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + trimmedParagraph;
    }
  }

  // Add the last chunk
  if (currentChunk.trim()) {
    chunks.push({
      text: currentChunk.trim(),
      startIndex,
      endIndex: startIndex + currentChunk.length,
      metadata: {
        chunkType: "paragraph",
        importance: 1.0,
      },
    });
  }

  return chunks;
}

/**
 * 4. Semantic-Based Chunking
 * Attempts to create semantically coherent chunks based on content structure
 */
function semanticBasedChunking(
  text: string,
  config: ChunkingConfig
): TextChunk[] {
  const maxSize = config.maxChunkSize || 1000;
  const minSize = config.minChunkSize || 200;
  const chunks: TextChunk[] = [];

  // Identify potential section breaks (headers, bullet points, etc.)
  const sectionBreaks = findSemanticBreaks(text);

  let currentChunk = "";
  let startIndex = 0;
  let chunkIndex = 0;

  for (let i = 0; i < sectionBreaks.length; i++) {
    const section = sectionBreaks[i];
    const sectionText = text.slice(section.start, section.end).trim();

    if (!sectionText) continue;

    // If adding this section would exceed max size, start a new chunk
    if (
      currentChunk.length + sectionText.length > maxSize &&
      currentChunk.length >= minSize
    ) {
      chunks.push({
        text: currentChunk.trim(),
        startIndex,
        endIndex: startIndex + currentChunk.length,
        metadata: {
          chunkType: "semantic",
          section: section.type,
          importance: section.importance,
        },
      });

      startIndex += currentChunk.length;
      currentChunk = sectionText;
      chunkIndex++;
    }
    // Handle oversized sections that exceed max size on their own
    else if (sectionText.length > maxSize) {
      // If we have accumulated content, save it first
      if (currentChunk.trim()) {
        chunks.push({
          text: currentChunk.trim(),
          startIndex,
          endIndex: startIndex + currentChunk.length,
          metadata: {
            chunkType: "semantic",
            section: "content",
            importance: 0.7,
          },
        });
        startIndex += currentChunk.length;
      }

      // Keep the oversized section intact - pure semantic chunking
      // This respects the semantic meaning over size constraints
      chunks.push({
        text: sectionText.trim(),
        startIndex,
        endIndex: startIndex + sectionText.length,
        metadata: {
          chunkType: "semantic",
          section: section.type,
          importance: section.importance,
        },
      });

      startIndex += sectionText.length;
      currentChunk = "";
      chunkIndex++;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + sectionText;
    }
  }

  // Add the last chunk
  if (currentChunk.trim()) {
    chunks.push({
      text: currentChunk.trim(),
      startIndex,
      endIndex: startIndex + currentChunk.length,
      metadata: {
        chunkType: "semantic",
        importance: 1.0,
      },
    });
  }

  return chunks;
}

/**
 * 5. Agentic Chunking
 * Uses intelligent rules to create contextually aware chunks
 * Updated to always use embedding-based semantic grouping for true "agentic" behavior
 */
export async function agenticChunking(
  text: string,
  config: ChunkingConfig
): Promise<TextChunk[]> {
  try {
    const analysis = await analyzeDocumentIntelligently(text);

    // Force agentic-semantic strategy to ensure the agent handles chunking dynamically
    const strategy = { name: "agentic-semantic" };

    let chunks = await executeChunkingStrategy(
      text,
      strategy,
      analysis,
      config
    );

    if (!Array.isArray(chunks)) {
      console.warn("Chunking returned non-array, forcing empty array");
      chunks = [];
    }

    const optimizedChunks = await optimizeChunkQuality(chunks, config);

    try {
      await storeChunkingResults(text, strategy, optimizedChunks, analysis);
    } catch (e) {
      console.warn("Pinecone storage failed:", e);
    }

    return optimizedChunks;
  } catch (err) {
    console.error("Agentic chunking failed:", err);
    return [];
  }
}

// Safe executeChunkingStrategy with added agentic-semantic strategy
export async function executeChunkingStrategy(
  text: string,
  strategy: { name: string },
  analysis: DocumentAnalysis,
  config: ChunkingConfig
): Promise<TextChunk[]> {
  const maxSize = config.maxChunkSize || 500;
  const minSize = config.minChunkSize || 100;
  const overlapSize = config.overlapSize || 50;
  const chunks: TextChunk[] = [];
  if (!text || text.trim().length === 0) return chunks;

  if (strategy.name === "agentic-semantic") {
    // Semantic grouping using embeddings for similarity-based breaks
    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s);
    if (sentences.length === 0) return [];

    const embeddings = await Promise.all(
      sentences.map((s) => createEmbedding(s))
    );
    let currentText = sentences[0];
    let currentLength = sentences[0].length;
    let currentSum = (embeddings[0] as number[]).slice();
    let currentCount = 1;
    const threshold = 0.5; // Similarity threshold for grouping

    for (let i = 1; i < sentences.length; i++) {
      const s = sentences[i];
      const emb = embeddings[i] as number[];

      // Compute average embedding of current chunk
      const currentAvg = currentSum.map((x) => x / currentCount);

      // Compute similarity to the prospective new sentence
      const sim = cosineSimilarity(currentAvg, emb);

      const wouldExceed = currentLength + s.length + 1 > maxSize;

      if (!wouldExceed && sim > threshold) {
        // Add to current chunk
        currentText += " " + s;
        currentLength += s.length + 1;
        for (let j = 0; j < currentSum.length; j++) {
          currentSum[j] += emb[j];
        }
        currentCount++;
      } else {
        // Push current chunk
        const chunkAvg = currentSum.map((x) => x / currentCount);
        chunks.push({
          id: uuidv4(),
          text: currentText,
          embedding: chunkAvg,
        });

        // Start new chunk
        currentText = s;
        currentLength = s.length;
        currentSum = emb.slice();
        currentCount = 1;
      }
    }

    // Push the last chunk
    if (currentText) {
      const chunkAvg = currentSum.map((x) => x / currentCount);
      chunks.push({
        id: uuidv4(),
        text: currentText,
        embedding: chunkAvg,
      });
    }
  } else if (strategy.name === "sentence-grouping") {
    const sentences = text.split(/(?<=[.!?])\s+/);
    let buffer = "";

    for (let s of sentences) {
      s = s.trim();
      if (!s) continue;

      if ((buffer + s).length > maxSize && buffer.length > 0) {
        const embedding = (await createEmbedding(buffer)) as number[];
        chunks.push({ id: uuidv4(), text: buffer, embedding });
        buffer = s;
      } else {
        buffer += (buffer ? " " : "") + s;
      }
    }

    if (buffer.length > 0) {
      const embedding = (await createEmbedding(buffer)) as number[];
      chunks.push({ id: uuidv4(), text: buffer, embedding });
    }
  } else {
    // sliding window
    for (let i = 0; i < text.length; i += maxSize - overlapSize) {
      const chunkText = text.slice(i, i + maxSize);
      if (chunkText.length < minSize) continue;
      const embedding = (await createEmbedding(chunkText)) as number[];
      chunks.push({ id: uuidv4(), text: chunkText, embedding });
    }
  }

  return chunks;
}

// Safe getChunkingStats
export function getChunkingStats(chunks: TextChunk[]) {
  if (!Array.isArray(chunks) || chunks.length === 0) {
    return {
      totalChunks: 0,
      averageChunkSize: 0,
      minChunkSize: 0,
      maxChunkSize: 0,
      totalTextLength: 0,
    };
  }

  const sizes = chunks.map((c) => c.text.length);
  const totalLength = sizes.reduce((sum, s) => sum + s, 0);

  return {
    totalChunks: chunks.length,
    averageChunkSize: Math.round(totalLength / chunks.length),
    minChunkSize: Math.min(...sizes),
    maxChunkSize: Math.max(...sizes),
    totalTextLength: totalLength,
  };
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error("Vectors must be same length");
  let dot = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const normProduct = Math.sqrt(normA) * Math.sqrt(normB);
  return normProduct === 0 ? 0 : dot / normProduct;
}

// 1. Analyze document with Xenova embeddings
export async function analyzeDocumentIntelligently(
  text: string
): Promise<DocumentAnalysis> {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s);
  const embeddings = await Promise.all(
    sentences.map((s) => createEmbedding(s))
  );

  // Compute average similarity between sentences
  let sims: number[] = [];
  for (let i = 0; i < embeddings.length - 1; i++) {
    sims.push(
      cosineSimilarity(embeddings[i] as number[], embeddings[i + 1] as number[])
    );
  }
  const coherence =
    sims.length > 0 ? sims.reduce((a, b) => a + b, 0) / sims.length : 1.0;

  return {
    documentType: text.length > 2000 ? "long-form" : "short-form",
    complexity: sentences.length,
    structure: { sections: [text.slice(0, 80) + "..."] }, // naive placeholder
    semanticCoherence: coherence,
    entities: [], // optional: NER can be added later
  };
}

// 2. Choose chunking strategy (unused now, but kept for potential expansion)
export async function selectOptimalChunkingStrategy(
  analysis: DocumentAnalysis,
  text: string
) {
  if (analysis.semanticCoherence > 0.8 && text.length < 2000) {
    return { name: "agentic-semantic" };
  } else if (text.length < 2000) {
    return { name: "sentence-grouping" };
  } else {
    return { name: "sliding-window" };
  }
}

// 4. Optimize chunk quality (basic merge/split logic)
export async function optimizeChunkQuality(
  chunks: TextChunk[],
  config: ChunkingConfig
): Promise<TextChunk[]> {
  const minSize = config.minChunkSize || 100;

  // Simple rule: merge too-small chunks with the next one
  const optimized: TextChunk[] = [];
  let buffer: TextChunk | null = null;

  for (let chunk of chunks) {
    if (chunk.text.length < minSize && buffer) {
      buffer.text += " " + chunk.text;
      // Recompute embedding as average or new
      buffer.embedding = (await createEmbedding(buffer.text)) as number[];
    } else {
      if (buffer) {
        optimized.push(buffer);
        buffer = null;
      }
      if (chunk.text.length < minSize) {
        buffer = chunk;
      } else {
        optimized.push(chunk);
      }
    }
  }
  if (buffer) optimized.push(buffer);
  return optimized;
}

// 5. Store results in Pinecone
export async function storeChunkingResults(
  text: string,
  strategy: { name: string },
  chunks: TextChunk[],
  analysis: DocumentAnalysis
) {
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
  const index = pc.index("agentic-chunks");

  const validChunks = chunks.filter(
    (chunk) =>
      chunk.id &&
      chunk.embedding &&
      Array.isArray(chunk.embedding) &&
      chunk.embedding.every((v) => typeof v === "number")
  );

  const records: PineconeRecord<RecordMetadata>[] = validChunks.map(
    (chunk) => ({
      id: chunk.id!,
      values: chunk.embedding as number[], // assert as number[]
      metadata: {
        text: chunk.text,
        strategy: strategy.name,
        documentType: analysis.documentType,
      },
    })
  );

  if (records.length > 0) {
    await index.upsert(records);
  } else {
    console.warn("No valid chunks to upsert");
  }
}

function findSemanticBreaks(text: string): SemanticSection[] {
  const sections: SemanticSection[] = [];
  const lines = text.split("\n");
  let currentStart = 0;
  let currentContentStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detect various semantic elements
    if (isHeader(line)) {
      // Save any accumulated content before this header
      if (currentContentStart < currentStart) {
        const contentText = text
          .slice(currentContentStart, currentStart)
          .trim();
        if (contentText.length > 0) {
          sections.push({
            start: currentContentStart,
            end: currentStart,
            type: "content",
            importance: 0.7,
          });
        }
      }

      // Save the header
      sections.push({
        start: currentStart,
        end: currentStart + line.length,
        type: "header",
        importance: 1.0,
      });

      currentStart += line.length + 1; // +1 for newline
      currentContentStart = currentStart;
    }

    // Detect bullet points or numbered lists
    else if (isList(line)) {
      // Save any accumulated content before this list
      if (currentContentStart < currentStart) {
        const contentText = text
          .slice(currentContentStart, currentStart)
          .trim();
        if (contentText.length > 0) {
          sections.push({
            start: currentContentStart,
            end: currentStart,
            type: "content",
            importance: 0.7,
          });
        }
      }

      // Find the end of the list
      let listEnd = i;
      while (listEnd < lines.length && isList(lines[listEnd].trim())) {
        listEnd++;
      }

      const listStart = currentStart;
      const listEndIndex = lines
        .slice(i, listEnd)
        .reduce((acc, l) => acc + l.length + 1, currentStart);

      sections.push({
        start: listStart,
        end: listEndIndex,
        type: "list",
        importance: 0.8,
      });

      currentStart = listEndIndex;
      currentContentStart = currentStart;
      i = listEnd - 1;
    }

    // Detect code blocks
    else if (isCodeBlock(line)) {
      // Save any accumulated content before this code block
      if (currentContentStart < currentStart) {
        const contentText = text
          .slice(currentContentStart, currentStart)
          .trim();
        if (contentText.length > 0) {
          sections.push({
            start: currentContentStart,
            end: currentStart,
            type: "content",
            importance: 0.7,
          });
        }
      }

      // Find the end of the code block
      let codeEnd = i;
      while (codeEnd < lines.length && isCodeBlock(lines[codeEnd].trim())) {
        codeEnd++;
      }

      const codeStart = currentStart;
      const codeEndIndex = lines
        .slice(i, codeEnd)
        .reduce((acc, l) => acc + l.length + 1, currentStart);

      sections.push({
        start: codeStart,
        end: codeEndIndex,
        type: "code",
        importance: 0.9,
      });

      currentStart = codeEndIndex;
      currentContentStart = currentStart;
      i = codeEnd - 1;
    }

    // Detect tables
    else if (isTable(line)) {
      // Save any accumulated content before this table
      if (currentContentStart < currentStart) {
        const contentText = text
          .slice(currentContentStart, currentStart)
          .trim();
        if (contentText.length > 0) {
          sections.push({
            start: currentContentStart,
            end: currentStart,
            type: "content",
            importance: 0.7,
          });
        }
      }

      // Find the end of the table
      let tableEnd = i;
      while (tableEnd < lines.length && isTable(lines[tableEnd].trim())) {
        tableEnd++;
      }

      const tableStart = currentStart;
      const tableEndIndex = lines
        .slice(i, tableEnd)
        .reduce((acc, l) => acc + l.length + 1, currentStart);

      sections.push({
        start: tableStart,
        end: tableEndIndex,
        type: "table",
        importance: 0.85,
      });

      currentStart = tableEndIndex;
      currentContentStart = currentStart;
      i = tableEnd - 1;
    }

    // Detect quotes or citations
    else if (isQuote(line)) {
      // Save any accumulated content before this quote
      if (currentContentStart < currentStart) {
        const contentText = text
          .slice(currentContentStart, currentStart)
          .trim();
        if (contentText.length > 0) {
          sections.push({
            start: currentContentStart,
            end: currentStart,
            type: "content",
            importance: 0.7,
          });
        }
      }

      // Find the end of the quote
      let quoteEnd = i;
      while (quoteEnd < lines.length && isQuote(lines[quoteEnd].trim())) {
        quoteEnd++;
      }

      const quoteStart = currentStart;
      const quoteEndIndex = lines
        .slice(i, quoteEnd)
        .reduce((acc, l) => acc + l.length + 1, currentStart);

      sections.push({
        start: quoteStart,
        end: quoteEndIndex,
        type: "quote",
        importance: 0.8,
      });

      currentStart = quoteEndIndex;
      currentContentStart = currentStart;
      i = quoteEnd - 1;
    }

    // Detect definitions or key-value pairs
    else if (isDefinition(line)) {
      // Save any accumulated content before this definition
      if (currentContentStart < currentStart) {
        const contentText = text
          .slice(currentContentStart, currentStart)
          .trim();
        if (contentText.length > 0) {
          sections.push({
            start: currentContentStart,
            end: currentStart,
            type: "content",
            importance: 0.7,
          });
        }
      }

      sections.push({
        start: currentStart,
        end: currentStart + line.length,
        type: "definition",
        importance: 0.85,
      });

      currentStart += line.length + 1;
      currentContentStart = currentStart;
    }

    // Regular content line
    else if (line.length > 0) {
      currentStart += line.length + 1;
    } else {
      currentStart += 1; // empty line
    }
  }

  // Save any remaining content at the end
  if (currentContentStart < text.length) {
    const contentText = text.slice(currentContentStart).trim();
    if (contentText.length > 0) {
      sections.push({
        start: currentContentStart,
        end: text.length,
        type: "content",
        importance: 0.7,
      });
    }
  }

  return sections;
}

function isHeader(line: string): boolean {
  return (
    line.length > 0 &&
    (line === line.toUpperCase() ||
      /^\d+\.\s/.test(line) ||
      /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/.test(line))
  );
}

function isList(line: string): boolean {
  return /^[\-\*•]\s/.test(line) || /^\d+\.\s/.test(line);
}

function isCodeBlock(line: string): boolean {
  // Detect code blocks: lines starting with spaces/tabs, or containing code patterns
  return (
    /^\s{2,}/.test(line) || // Indented lines
    /^```/.test(line) || // Markdown code blocks
    /^`[^`]+`/.test(line) || // Inline code
    /[{}();=<>+\-*/]/.test(line) || // Code-like characters
    /^(function|if|for|while|const|let|var|return|import|export)/.test(line) // Code keywords
  );
}

function isTable(line: string): boolean {
  // Detect table rows: lines with multiple | characters or tab-separated values
  return (
    /\|.*\|/.test(line) || // Markdown tables
    /\t/.test(line) || // Tab-separated values
    /^[^\n]+\s{2,}[^\n]+/.test(line) || // Space-separated columns
    /^[-|+]+$/.test(line) // Table separators
  );
}

function isQuote(line: string): boolean {
  // Detect quotes: lines starting with > or containing quote patterns
  return (
    /^>/.test(line) || // Markdown quotes
    /^["'""]/.test(line) || // Quotation marks
    /^[A-Z][^.!?]*["'""]/.test(line) || // Sentences with quotes
    /^[A-Z][^.!?]*said/.test(line) || // Attribution patterns
    /^[A-Z][^.!?]*according to/.test(line) // Citation patterns
  );
}

function isDefinition(line: string): boolean {
  // Detect definitions: key-value pairs, glossary entries, etc.
  return (
    /^[A-Z][a-z]*\s*[:=]\s/.test(line) || // Key: value format
    /^[A-Z][a-z]*\s*[-–]\s/.test(line) || // Key - value format
    /^[A-Z][a-z]*\s*$$ [^)]+ $$\s*[:=]\s/.test(line) || // Key (context): value
    /^[A-Z][a-z]*\s*is\s/.test(line) || // "X is Y" definitions
    /^[A-Z][a-z]*\s*refers to\s/.test(line) || // "X refers to Y" definitions
    /^[A-Z][a-z]*\s*means\s/.test(line) // "X means Y" definitions
  );
}

/**
 * Preset configurations for common use cases
 */
export const CHUNKING_PRESETS = {
  RESUME_OPTIMIZED: {
    method: "agentic" as const,
    maxChunkSize: 800,
    minChunkSize: 200,
    preserveHeaders: true,
    includeMetadata: true,
  },
  JOB_DESCRIPTION_OPTIMIZED: {
    method: "semantic" as const,
    maxChunkSize: 600,
    minChunkSize: 150,
    preserveHeaders: true,
    includeMetadata: true,
  },
  GENERAL_PURPOSE: {
    method: "sentence" as const,
    maxChunkSize: 1000,
    overlapSize: 100,
  },
  LONG_DOCUMENT: {
    method: "fixed" as const,
    maxChunkSize: 1500,
    overlapSize: 200,
  },
};
