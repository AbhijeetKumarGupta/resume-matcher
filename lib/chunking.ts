// Chunking strategies for text processing
// Easily switch between different chunking methods for testing

export interface ChunkingConfig {
  method: "fixed" | "sentence" | "paragraph" | "semantic" | "agentic";
  maxChunkSize?: number; // For fixed-size chunking
  overlapSize?: number; // For fixed-size chunking with overlap
  minChunkSize?: number; // Minimum chunk size for semantic/agentic
  preserveHeaders?: boolean; // Whether to preserve section headers
  includeMetadata?: boolean; // Whether to include chunk metadata
}

export interface TextChunk {
  text: string;
  startIndex: number;
  endIndex: number;
  metadata?: {
    chunkType?: string;
    section?: string;
    importance?: number;
  };
}

/**
 * Main chunking function that routes to different strategies
 */
export function chunkText(text: string, config: ChunkingConfig): TextChunk[] {
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
      return agenticChunking(normalizedText, config);
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
 */
function agenticChunking(text: string, config: ChunkingConfig): TextChunk[] {
  const maxSize = config.maxChunkSize || 1000;
  const minSize = config.minChunkSize || 200;
  const chunks: TextChunk[] = [];

  // Parse the document structure
  const documentStructure = parseDocumentStructure(text);
  let currentChunk = "";
  let startIndex = 0;
  let chunkIndex = 0;

  for (const section of documentStructure) {
    const sectionText = text.slice(section.start, section.end).trim();

    if (!sectionText) continue;

    // Decision logic for chunking
    const shouldStartNewChunk = shouldStartNewChunkLogic(
      currentChunk,
      sectionText,
      section,
      maxSize,
      minSize
    );

    if (shouldStartNewChunk && currentChunk.length >= minSize) {
      chunks.push({
        text: currentChunk.trim(),
        startIndex,
        endIndex: startIndex + currentChunk.length,
        metadata: {
          chunkType: "agentic",
          section: section.type,
          importance: section.importance,
        },
      });

      startIndex = section.start;
      currentChunk = sectionText;
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
        chunkType: "agentic",
        importance: 1.0,
      },
    });
  }

  return chunks;
}

// Helper functions for semantic chunking
interface SemanticSection {
  start: number;
  end: number;
  type: string;
  importance: number;
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
      if (currentContentStart < i && currentContentStart < currentStart) {
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
        end: text.indexOf("\n", currentStart) || text.length,
        type: "header",
        importance: 1.0,
      });

      currentStart = text.indexOf("\n", currentStart) || text.length;
      currentContentStart = currentStart;
    }

    // Detect bullet points or numbered lists
    else if (isList(line)) {
      // Save any accumulated content before this list
      if (currentContentStart < i && currentContentStart < currentStart) {
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

      // Save the list
      sections.push({
        start: currentStart,
        end:
          text.indexOf("\n", text.indexOf(lines[listEnd - 1], currentStart)) ||
          text.length,
        type: "list",
        importance: 0.8,
      });

      currentStart =
        text.indexOf("\n", text.indexOf(lines[listEnd - 1], currentStart)) ||
        text.length;
      currentContentStart = currentStart;
      i = listEnd - 1;
    }

    // Detect code blocks
    else if (isCodeBlock(line)) {
      // Save any accumulated content before this code block
      if (currentContentStart < i && currentContentStart < currentStart) {
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

      // Save the code block
      sections.push({
        start: currentStart,
        end:
          text.indexOf("\n", text.indexOf(lines[codeEnd - 1], currentStart)) ||
          text.length,
        type: "code",
        importance: 0.9,
      });

      currentStart =
        text.indexOf("\n", text.indexOf(lines[codeEnd - 1], currentStart)) ||
        text.length;
      currentContentStart = currentStart;
      i = codeEnd - 1;
    }

    // Detect tables
    else if (isTable(line)) {
      // Save any accumulated content before this table
      if (currentContentStart < i && currentContentStart < currentStart) {
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

      // Save the table
      sections.push({
        start: currentStart,
        end:
          text.indexOf("\n", text.indexOf(lines[tableEnd - 1], currentStart)) ||
          text.length,
        type: "table",
        importance: 0.85,
      });

      currentStart =
        text.indexOf("\n", text.indexOf(lines[tableEnd - 1], currentStart)) ||
        text.length;
      currentContentStart = currentStart;
      i = tableEnd - 1;
    }

    // Detect quotes or citations
    else if (isQuote(line)) {
      // Save any accumulated content before this quote
      if (currentContentStart < i && currentContentStart < currentStart) {
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

      // Save the quote
      sections.push({
        start: currentStart,
        end:
          text.indexOf("\n", text.indexOf(lines[quoteEnd - 1], currentStart)) ||
          text.length,
        type: "quote",
        importance: 0.8,
      });

      currentStart =
        text.indexOf("\n", text.indexOf(lines[quoteEnd - 1], currentStart)) ||
        text.length;
      currentContentStart = currentStart;
      i = quoteEnd - 1;
    }

    // Detect definitions or key-value pairs
    else if (isDefinition(line)) {
      // Save any accumulated content before this definition
      if (currentContentStart < i && currentContentStart < currentStart) {
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

      // Save the definition
      sections.push({
        start: currentStart,
        end: text.indexOf("\n", currentStart) || text.length,
        type: "definition",
        importance: 0.85,
      });

      currentStart = text.indexOf("\n", currentStart) || text.length;
      currentContentStart = currentStart;
    }

    // Regular content line
    else if (line.length > 0) {
      // This is content, update the content end position
      currentStart = text.indexOf("\n", currentStart) || text.length;
    }
  }

  // Save any remaining content at the end
  if (currentContentStart < text.length) {
    const contentText = text.slice(currentContentStart, text.length).trim();
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
    /^[A-Z][a-z]*\s*\([^)]+\)\s*[:=]\s/.test(line) || // Key (context): value
    /^[A-Z][a-z]*\s*is\s/.test(line) || // "X is Y" definitions
    /^[A-Z][a-z]*\s*refers to\s/.test(line) || // "X refers to Y" definitions
    /^[A-Z][a-z]*\s*means\s/.test(line) // "X means Y" definitions
  );
}

// Helper functions for agentic chunking
interface DocumentSection {
  start: number;
  end: number;
  type: string;
  importance: number;
  content: string;
}

function parseDocumentStructure(text: string): DocumentSection[] {
  const sections: DocumentSection[] = [];
  const lines = text.split("\n");
  let currentStart = 0;
  let currentType = "content";
  let currentImportance = 0.7;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (isHeader(line)) {
      // Save previous section
      if (currentStart < i) {
        sections.push({
          start: currentStart,
          end: text.indexOf("\n", currentStart) || text.length,
          type: currentType,
          importance: currentImportance,
          content: text.slice(
            currentStart,
            text.indexOf("\n", currentStart) || text.length
          ),
        });
      }

      currentStart = text.indexOf(line, currentStart);
      currentType = "header";
      currentImportance = 1.0;
    } else if (isList(line)) {
      // Save previous section
      if (currentStart < i) {
        sections.push({
          start: currentStart,
          end: text.indexOf("\n", currentStart) || text.length,
          type: currentType,
          importance: currentImportance,
          content: text.slice(
            currentStart,
            text.indexOf("\n", currentStart) || text.length
          ),
        });
      }

      currentStart = text.indexOf(line, currentStart);
      currentType = "list";
      currentImportance = 0.8;
    } else if (line.length === 0) {
      // Empty line might indicate section break
      if (currentStart < i) {
        sections.push({
          start: currentStart,
          end: text.indexOf("\n", currentStart) || text.length,
          type: currentType,
          importance: currentImportance,
          content: text.slice(
            currentStart,
            text.indexOf("\n", currentStart) || text.length
          ),
        });
      }

      currentStart = i + 1;
      currentType = "content";
      currentImportance = 0.7;
    }
  }

  // Add remaining content
  if (currentStart < text.length) {
    sections.push({
      start: currentStart,
      end: text.length,
      type: currentType,
      importance: currentImportance,
      content: text.slice(currentStart, text.length),
    });
  }

  return sections;
}

function shouldStartNewChunkLogic(
  currentChunk: string,
  newSection: string,
  section: DocumentSection,
  maxSize: number,
  minSize: number
): boolean {
  // Always start new chunk if current is too long
  if (currentChunk.length + newSection.length > maxSize) {
    return true;
  }

  // Start new chunk for high-importance sections if current chunk is substantial
  if (section.importance > 0.9 && currentChunk.length >= minSize) {
    return true;
  }

  // Start new chunk for headers if current chunk is substantial
  if (section.type === "header" && currentChunk.length >= minSize) {
    return true;
  }

  // Start new chunk for lists if they're substantial
  if (section.type === "list" && newSection.length > maxSize * 0.5) {
    return true;
  }

  return false;
}

/**
 * Utility function to get chunking statistics
 */
export function getChunkingStats(chunks: TextChunk[]): {
  totalChunks: number;
  averageChunkSize: number;
  minChunkSize: number;
  maxChunkSize: number;
  totalTextLength: number;
} {
  if (chunks.length === 0) {
    return {
      totalChunks: 0,
      averageChunkSize: 0,
      minChunkSize: 0,
      maxChunkSize: 0,
      totalTextLength: 0,
    };
  }

  const sizes = chunks.map((chunk) => chunk.text.length);
  const totalLength = sizes.reduce((sum, size) => sum + size, 0);

  return {
    totalChunks: chunks.length,
    averageChunkSize: Math.round(totalLength / chunks.length),
    minChunkSize: Math.min(...sizes),
    maxChunkSize: Math.max(...sizes),
    totalTextLength: totalLength,
  };
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
