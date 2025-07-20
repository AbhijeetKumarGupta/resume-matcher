# Resume Matcher - Next.js Project Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [Project Structure](#project-structure)
4. [Core Components](#core-components)
5. [API Endpoints](#api-endpoints)
6. [Data Flow](#data-flow)
7. [Key Features](#key-features)
8. [Setup & Configuration](#setup--configuration)
9. [Usage Guide](#usage-guide)
10. [Technical Implementation Details](#technical-implementation-details)

---

## Project Overview

**Resume Matcher** is a Next.js application that uses AI-powered semantic matching to connect job postings with candidate resumes. The system leverages local embedding technology (via @xenova/transformers) and Pinecone's vector database to perform intelligent matching based on skills, experience, and job requirements.

### Purpose

- **For Recruiters**: Post job listings and automatically find matching candidates
- **For Candidates**: Upload resumes and get matched with relevant job opportunities
- **For HR Teams**: Streamline the hiring process with AI-powered candidate screening

### Key Benefits

- **Semantic Matching**: Goes beyond keyword matching to understand context and meaning
- **Scalable**: Can handle large volumes of resumes and job postings
- **Real-time**: Instant matching results as new content is added
- **User-friendly**: Clean, modern interface with drag-and-drop functionality
- **No API Key Required for Embeddings**: Embeddings are generated locally using open-source models

---

## Architecture & Technology Stack

### Frontend

- **Next.js 13.4.0**: React framework with App Router
- **React 18.2.0**: UI library
- **TypeScript**: Type-safe development
- **CSS-in-JS**: Inline styles for component styling

### Backend

- **Next.js API Routes**: Server-side API endpoints
- **Formidable**: File upload handling
- **PDF-Parse**: PDF text extraction

### AI & Database

- **@xenova/transformers**: Local text embeddings using `all-MiniLM-L6-v2` model (384-dimensional vectors)
- **Pinecone**: Vector database for similarity search
- **Vector Similarity**: 384-dimensional embeddings for semantic matching
- **No OpenAI API or payment required**: Model is downloaded on first use (~90MB)

### Development Tools

- **ESLint**: Code linting
- **TypeScript**: Static type checking

---

## Project Structure

```
resume-matcher-nextjs-final/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout component
│   ├── page.tsx                 # Home page with navigation
│   ├── upload-resume/
│   │   └── page.tsx            # Resume upload interface
│   ├── job-listings/
│   │   └── page.tsx            # Job posting interface
│   └── matches/
│       └── page.tsx            # Match results display
├── pages/
│   └── api/                     # API routes
│       ├── resume.ts           # Resume upload & processing
│       ├── job.ts              # Job posting & processing
│       └── match.ts            # Match retrieval & scoring
├── lib/                         # Utility libraries
│   ├── xenova.ts              # Local embedding integration (@xenova/transformers)
│   └── pinecone.ts            # Pinecone database connection
├── package.json                # Dependencies & scripts
├── next.config.js             # Next.js configuration
└── tsconfig.json              # TypeScript configuration
```

---

## Core Components

### 1. Home Page (`app/page.tsx`)

**Purpose**: Main navigation hub for the application

**Key Features**:

- Clean, centered layout with light background
- Three main navigation links:
  - Job Listings: Post new job opportunities
  - Matches: View AI-generated matches
  - Upload Resume: Add candidate resumes

**Styling**: Uses inline CSS with modern design elements including gradients, shadows, and hover effects.

### 2. Resume Upload (`app/upload-resume/page.tsx`)

**Purpose**: Interface for uploading and processing candidate resumes

**Key Features**:

- **Drag & Drop**: Modern file upload with visual feedback
- **PDF Validation**: Ensures only PDF files are accepted
- **Progress Feedback**: Loading states and success/error messages
- **File Preview**: Shows selected file name and size

**Technical Implementation**:

- Uses `FormData` for file upload
- Sends POST request to `/api/resume` endpoint
- Handles various upload states (dragging, uploading, success, error)

### 3. Job Listings (`app/job-listings/page.tsx`)

**Purpose**: Interface for posting new job opportunities

**Key Features**:

- **Form Validation**: Ensures both title and description are provided
- **Rich Text Input**: Large textarea for detailed job descriptions
- **Real-time Feedback**: Loading states and success/error messages

**Technical Implementation**:

- Sends POST request to `/api/job` endpoint
- Includes job ID, title, and description
- Handles form submission states

### 4. Matches Display (`app/matches/page.tsx`)

**Purpose**: Displays AI-generated matches between jobs and resumes

**Key Features**:

- **Match Scoring**: Shows percentage-based match scores
- **Job Details**: Shows job titles and descriptions
- **Responsive Design**: Adapts to different screen sizes

**Technical Implementation**:

- Fetches matches from `/api/match` endpoint
- Displays matches grouped by job
- Shows match scores and candidate names

---

## API Endpoints

### 1. Resume Upload (`/api/resume`)

**Method**: POST  
**Purpose**: Process and store resume files

**Process Flow**:

1. **File Validation**: Checks for PDF format
2. **Text Extraction**: Uses `pdf-parse` to extract text content
3. **Embedding Generation**: Creates vector embeddings using local model
4. **Vector Storage**: Stores in Pinecone with metadata

**Key Functions**:

- `sanitizeFilename()`: Cleans filename for safe storage
- Vector creation and storage with metadata

### 2. Job Posting (`/api/job`)

**Method**: POST  
**Purpose**: Process and store job postings

**Process Flow**:

1. **Embedding Generation**: Creates vector embeddings using local model
2. **Vector Storage**: Stores in Pinecone with job metadata

**Key Functions**:

- Vector creation with job metadata (title, description)

### 3. Match Retrieval (`/api/match`)

**Method**: GET  
**Purpose**: Retrieve and score matches between jobs and resumes

**Process Flow**:

1. **Data Retrieval**: Fetches all jobs and resumes from Pinecone
2. **Similarity Calculation**: Computes vector similarity scores
3. **Result Formatting**: Returns structured match data

**Key Functions**:

- Score threshold filtering (50% minimum)

---

## Data Flow

### Resume Upload Flow

```
User Uploads PDF → File Validation → Text Extraction →
Local Embedding Generation → Pinecone Storage
```

### Job Posting Flow

```
User Submits Job → Local Embedding Generation → Pinecone Storage
```

### Matching Flow

```
Request Matches → Fetch All Vectors → Calculate Similarity → Return Scored Results
```

---

## Key Features

### 1. Semantic Matching

- **Vector Embeddings**: 384-dimensional vectors capture semantic meaning
- **Context Understanding**: Goes beyond exact keyword matches
- **Similarity Scoring**: Percentage-based match scores

### 2. Intelligent Text Processing

- **Section Prioritization**: Focuses on skills, experience, and requirements (future enhancement)
- **Noise Reduction**: Removes common resume/job noise words (future enhancement)
- **Keyword Extraction**: (future enhancement)

### 3. User Experience

- **Drag & Drop**: Modern file upload interface
- **Real-time Feedback**: Loading states and progress indicators
- **Responsive Design**: Works on desktop and mobile devices
- **Error Handling**: Graceful error messages and recovery

### 4. Scalability

- **Vector Database**: Pinecone handles large-scale similarity search
- **Batch Operations**: Efficient vector storage and retrieval

---

## Setup & Configuration

### Prerequisites

- Node.js 18+
- npm or yarn
- Pinecone API key and index

### Environment Variables

```env
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX=your_pinecone_index_name
```

### Installation Steps

1. **Clone Repository**

   ```bash
   git clone <repository-url>
   cd resume-matcher-nextjs-final
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

   > **Note:** The first run will download the embedding model (~90MB) automatically.

3. **Configure Environment**

   - Create `.env.local` file
   - Add required API keys

4. **Run Development Server**

   ```bash
   npm run dev
   ```

5. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

---

## Usage Guide

### For Recruiters/HR Teams

1. **Post a Job**:

   - Navigate to "Job Listings"
   - Enter job title and detailed description
   - Include specific requirements and skills
   - Submit to create job posting

2. **View Matches**:
   - Navigate to "Matches"
   - View AI-generated candidate matches
   - Review match scores
   - Identify top candidates for interviews

### For Candidates

1. **Upload Resume**:

   - Navigate to "Upload Resume"
   - Drag and drop PDF resume or click to browse
   - Ensure resume is in PDF format
   - Wait for upload confirmation

2. **Get Matched**:
   - Resumes are automatically matched with job postings
   - Higher scores indicate better matches

---

## Technical Implementation Details

### Vector Embedding Process

1. **Text Preprocessing**:

   - (Planned) Remove noise words and common resume/job terms
   - (Planned) Normalize text (lowercase, remove special characters)
   - (Planned) Extract email addresses and phone numbers

2. **Embedding Generation**:
   - Use @xenova/transformers `all-MiniLM-L6-v2` model
   - Generate 384-dimensional vectors
   - No API key or payment required
   - Model is downloaded on first use (~90MB)

### Similarity Matching Algorithm

1. **Vector Retrieval**:

   - Fetch all job and resume vectors from Pinecone
   - Separate jobs and resumes by ID prefix

2. **Similarity Calculation**:

   - Compute cosine similarity between job and resume vectors
   - Score range: 0-1 (0% to 100%)

3. **Result Filtering**:
   - Apply minimum score threshold (50%)
   - Sort by similarity score (highest first)

### Error Handling & Fallbacks

1. **File Processing**:

   - PDF validation and error handling
   - Safe filename sanitization

2. **API Error Handling**:
   - Comprehensive error messages

---

## Performance Considerations

### Optimization Strategies

1. **Text Processing**:

   - (Planned) Efficient chunking algorithms
   - (Planned) Noise word filtering for better embeddings

2. **Vector Operations**:

   - Batch processing for multiple embeddings
   - Efficient similarity calculations

3. **Database Operations**:
   - Optimized Pinecone queries
   - Metadata filtering for faster retrieval

### Scalability Features

1. **Horizontal Scaling**:

   - Stateless API design
   - Can be deployed across multiple instances

2. **Database Scaling**:

   - Pinecone handles vector database scaling
   - Efficient similarity search at scale

3. **Caching**:
   - Consider Redis for caching frequent queries
   - Browser caching for static assets

---

## Security Considerations

### Data Protection

1. **File Upload Security**:

   - File type validation (PDF only)
   - Filename sanitization
   - Size limits and validation

2. **API Security**:

   - Input validation and sanitization
   - Error message sanitization
   - Rate limiting considerations

3. **Environment Variables**:
   - Secure API key storage
   - Environment-specific configurations

---

## Future Enhancements

### Potential Improvements

1. **Advanced Matching**:

   - Multi-modal matching (resume + portfolio)
   - Industry-specific matching algorithms
   - Experience level weighting

2. **User Management**:

   - User authentication and authorization
   - Company-specific job boards
   - Candidate profiles and preferences

3. **Analytics & Reporting**:

   - Match success tracking
   - Hiring funnel analytics
   - Performance metrics dashboard

4. **Integration Capabilities**:
   - ATS (Applicant Tracking System) integration
   - LinkedIn profile import
   - Email notification system

---

## Troubleshooting

### Common Issues

1. **Upload Failures**:

   - Check file format (PDF only)
   - Verify file size limits
   - Ensure network connectivity

2. **API Errors**:

   - Verify environment variables
   - Check API key validity
   - Monitor quota limits

3. **Match Quality**:
   - Improve job descriptions with specific requirements
   - Ensure resumes contain relevant keywords
   - Adjust similarity thresholds if needed

### Debug Mode

Enable debug logging by setting:

```env
DEBUG=true
```

---

## Conclusion

The Resume Matcher project demonstrates a modern approach to AI-powered recruitment using semantic matching. The combination of Next.js, local embeddings via @xenova/transformers, and Pinecone vector database creates a scalable and intelligent matching system that can significantly improve the efficiency of the hiring process.

The modular architecture allows for easy extension and customization, while the comprehensive error handling and fallback mechanisms ensure robust operation in production environments.
