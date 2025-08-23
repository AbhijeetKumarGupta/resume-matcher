# Resume Matcher - Chunking System Guide

## Overview

The Resume Matcher now includes a sophisticated chunking system that allows you to test and compare different text chunking strategies. This system breaks down resumes and job descriptions into smaller, semantically meaningful pieces before creating embeddings, which can significantly improve matching accuracy.

## Available Chunking Methods

### 1. Fixed-Size Chunking

- **Method**: `fixed`
- **Description**: Splits text into chunks of fixed size with optional overlap
- **Best for**: Long documents where consistent chunk sizes are needed
- **Configuration**:
  - `maxChunkSize`: Maximum characters per chunk (default: 1000)
  - `overlapSize`: Overlap between consecutive chunks (default: 100)

### 2. Sentence-Based Chunking

- **Method**: `sentence`
- **Description**: Splits text at sentence boundaries while respecting max chunk size
- **Best for**: Documents where sentence-level context is important
- **Configuration**:
  - `maxChunkSize`: Maximum characters per chunk (default: 1000)

### 3. Paragraph-Based Chunking

- **Method**: `paragraph`
- **Description**: Splits text at paragraph boundaries while respecting max chunk size
- **Best for**: Documents with clear paragraph structure
- **Configuration**:
  - `maxChunkSize`: Maximum characters per chunk (default: 1000)

### 4. Semantic-Based Chunking

- **Method**: `semantic`
- **Description**: Creates semantically coherent chunks based on content structure
- **Best for**: Job descriptions and structured documents
- **Configuration**:
  - `maxChunkSize`: Maximum characters per chunk (default: 600)
  - `minChunkSize`: Minimum characters per chunk (default: 150)

### 5. Agentic Chunking

- **Method**: `agentic`
- **Description**: Uses intelligent rules to create contextually aware chunks
- **Best for**: Resumes and complex documents (recommended default)
- **Configuration**:
  - `maxChunkSize`: Maximum characters per chunk (default: 800)
  - `minChunkSize`: Minimum characters per chunk (default: 200)

## How to Use

### 1. Testing Different Methods

Visit the **Chunking Test** page (`/chunking-test`) to:

- Test different chunking methods on your own text
- Load sample texts (resume, job description, long document)
- See detailed statistics and chunk breakdowns
- Compare how different methods handle the same content

### 2. Uploading Resumes with Specific Chunking

When uploading resumes:

1. Go to **Upload Resume** page
2. Select your PDF file
3. Choose a chunking method from the dropdown
4. Upload - the system will show how many chunks were created

**Example API call:**

```bash
POST /api/resume?chunking=agentic
```

### 3. Posting Jobs with Specific Chunking

When posting jobs:

1. Go to **Job Listings** page
2. Enter job title and description
3. Choose a chunking method from the dropdown
4. Submit - the system will show chunk information

**Example API call:**

```bash
POST /api/job?chunking=semantic
```

### 4. Filtering Matches by Chunking Method

When viewing matches:

- Use query parameter to filter by chunking method
- Compare results between different chunking strategies

**Example API call:**

```bash
GET /api/match?chunking=agentic&showChunks=true
```

## Configuration Presets

The system includes optimized presets for common use cases:

```typescript
export const CHUNKING_PRESETS = {
  RESUME_OPTIMIZED: {
    method: "agentic",
    maxChunkSize: 800,
    minChunkSize: 200,
    preserveHeaders: true,
    includeMetadata: true,
  },
  JOB_DESCRIPTION_OPTIMIZED: {
    method: "semantic",
    maxChunkSize: 600,
    minChunkSize: 150,
    preserveHeaders: true,
    includeMetadata: true,
  },
  GENERAL_PURPOSE: {
    method: "sentence",
    maxChunkSize: 1000,
    overlapSize: 100,
  },
  LONG_DOCUMENT: {
    method: "fixed",
    maxChunkSize: 1500,
    overlapSize: 200,
  },
};
```

## API Endpoints

### Chunking Test

- **Endpoint**: `/api/chunking-test`
- **Method**: POST
- **Body**: `{ "text": "your text here", "method": "agentic" }`
- **Response**: Chunks, statistics, and configuration

### Resume Upload with Chunking

- **Endpoint**: `/api/resume?chunking={method}`
- **Method**: POST
- **Body**: FormData with PDF file
- **Response**: Success status, chunk count, and method used

### Job Posting with Chunking

- **Endpoint**: `/api/job?chunking={method}`
- **Method**: POST
- **Body**: `{ "id": "...", "title": "...", "description": "..." }`
- **Response**: Success status, chunk count, and method used

### Match Retrieval with Chunking Filter

- **Endpoint**: `/api/match?chunking={method}&showChunks={boolean}`
- **Method**: GET
- **Response**: Matches filtered by chunking method, with optional chunk details

## Chunk Metadata

Each chunk includes rich metadata:

```typescript
interface TextChunk {
  text: string;
  startIndex: number;
  endIndex: number;
  metadata?: {
    chunkType: string; // 'fixed', 'sentence', 'paragraph', 'semantic', 'agentic'
    section: string; // 'header', 'content', 'list', etc.
    importance: number; // 0.0 to 1.0 importance score
  };
}
```

## Performance Considerations

### Chunk Size Guidelines

- **Too small (< 100 chars)**: May lose context, more API calls
- **Too large (> 1500 chars)**: May dilute semantic meaning
- **Optimal range**: 200-800 characters for most use cases

### Overlap Considerations

- **Fixed chunking**: Use 10-20% overlap for better context preservation
- **Other methods**: Overlap is handled automatically based on content structure

### Memory and Storage

- Each chunk creates a separate vector in Pinecone
- More chunks = more storage but potentially better matching
- Balance between granularity and resource usage

## Testing and Comparison

### 1. Load Sample Texts

Use the built-in sample texts to test different methods:

- **Resume**: Structured resume with sections
- **Job Description**: Detailed job posting
- **Long Document**: Multi-chapter technical document

### 2. Compare Results

Look for:

- **Chunk count**: How many pieces were created
- **Chunk sizes**: Distribution of chunk lengths
- **Content preservation**: Whether important sections are kept together
- **Context maintenance**: How well semantic meaning is preserved

### 3. A/B Testing

- Upload the same resume with different chunking methods
- Post the same job with different chunking methods
- Compare match quality and relevance

## Best Practices

### For Resumes

- **Recommended**: Use `agentic` chunking
- **Reason**: Preserves section structure and context
- **Alternative**: Use `semantic` for simpler resumes

### For Job Descriptions

- **Recommended**: Use `semantic` chunking
- **Reason**: Groups related requirements and skills together
- **Alternative**: Use `paragraph` for well-structured postings

### For Long Documents

- **Recommended**: Use `fixed` chunking with overlap
- **Reason**: Consistent chunk sizes for processing
- **Alternative**: Use `sentence` for narrative content

## Troubleshooting

### Common Issues

1. **Chunks too small**

   - Increase `minChunkSize`
   - Use `agentic` or `semantic` methods

2. **Chunks too large**

   - Decrease `maxChunkSize`
   - Use `fixed` or `sentence` methods

3. **Poor semantic coherence**

   - Switch to `semantic` or `agentic` methods
   - Adjust `minChunkSize` and `maxChunkSize`

4. **Too many chunks**
   - Increase `maxChunkSize`
   - Use `paragraph` or `fixed` methods

### Debug Mode

Enable detailed logging by setting:

```env
DEBUG=true
```

## Future Enhancements

Planned improvements include:

- **Dynamic chunking**: Automatically select best method based on content
- **Hybrid approaches**: Combine multiple methods for optimal results
- **Content-aware sizing**: Adjust chunk sizes based on content type
- **Performance optimization**: Batch processing and caching
- **Custom rules**: User-defined chunking rules and preferences

## Conclusion

The chunking system provides flexibility to optimize text processing for different types of content. Start with the recommended methods (`agentic` for resumes, `semantic` for jobs) and experiment with alternatives to find the best approach for your specific use case.

Use the Chunking Test page to experiment with different methods and find the optimal configuration for your content types.
