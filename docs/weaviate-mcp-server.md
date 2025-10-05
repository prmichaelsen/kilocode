# Weaviate MCP Server

## Overview

We are creating a custom MCP (Model Context Protocol) server for Weaviate integration as a new pnpm module written in TypeScript. This will provide comprehensive access to Weaviate's vector database capabilities, specifically optimized for Kilo Code's AI-powered development workflows.

## Module Structure

**Location**: `packages/weaviate-mcp/`
**Language**: TypeScript
**Package Manager**: pnpm
**MCP SDK**: `@modelcontextprotocol/sdk`

## Core Features

### Phase 1: Essential Tools

#### 1. `search_content`
- **Purpose**: Universal semantic search across all indexed content types
- **Input**: Query string, content type filters, metadata filters, date range
- **Output**: Ranked results with content type, metadata, and relevance scores
- **Content Types**: Code files, notes, screenplays, todos, documentation, conversations, images (with OCR/vision processing)
- **Weaviate Operations**: Vector similarity search with hybrid keyword matching and metadata filtering

#### 2. `search_conversations`
- **Purpose**: Specialized search for chat history and conversation context
- **Input**: Query string, optional filters (date range, participants, topics)
- **Output**: Relevant conversation excerpts with context
- **Weaviate Operations**: Multi-modal search across text and metadata

#### 3. `add_document`
- **Purpose**: Index new content with rich metadata classification
- **Input**: Document content, metadata, document type, auto-classification
- **Output**: Success confirmation with document ID and detected metadata
- **Weaviate Operations**: Object creation with automatic vectorization and metadata extraction

#### 4. `create_collection`
- **Purpose**: Manage Weaviate collections for different data types
- **Input**: Collection name, schema definition, vectorizer settings
- **Output**: Collection creation status
- **Weaviate Operations**: Schema management and collection setup

### Phase 2: Advanced Features

#### 5. `hybrid_search`
- **Purpose**: Combine vector similarity with keyword search and filters
- **Input**: Query, search weights, filters, result limits
- **Output**: Ranked results with multiple relevance scores
- **Weaviate Operations**: Hybrid search with BM25 + vector similarity

#### 6. `rag_query`
- **Purpose**: Retrieval-augmented generation workflows
- **Input**: Query, context requirements, generation parameters
- **Output**: Retrieved context + generated response
- **Weaviate Operations**: Search + generative module integration

#### 7. `batch_index`
- **Purpose**: Bulk data operations for large-scale indexing
- **Input**: Array of documents, batch size, processing options
- **Output**: Batch processing status and results
- **Weaviate Operations**: Batch API with error handling

#### 8. `get_similar`
- **Purpose**: Find content similar to a given document or code snippet
- **Input**: Reference content, similarity threshold, result count
- **Output**: Similar items with similarity scores
- **Weaviate Operations**: Vector similarity search with distance metrics

#### 9. `query_agent`
- **Purpose**: Natural language querying using Weaviate's QueryAgent for complex questions
- **Input**: Natural language query, collection filters, response format preferences
- **Output**: AI-generated answers with source citations and query explanations
- **Weaviate Operations**: QueryAgent API with automatic query generation and LLM integration

### Phase 3: Multi-Modal Features

#### 9. `process_image`
- **Purpose**: Extract searchable content from images using OCR and vision models
- **Input**: Image file, processing options (OCR, object detection, scene analysis)
- **Output**: Extracted text, detected objects, scene descriptions, searchable metadata
- **Processing Pipeline**: Weaviate CLIP (built-in) + Optional Google Cloud Vision (enhanced OCR/object detection)

#### 10. `search_images`
- **Purpose**: Search images by visual content, extracted text, or detected objects
- **Input**: Query (text description, similar image, or object type), filters
- **Output**: Matching images with relevance scores and extracted content
- **Weaviate Operations**: Multi-modal vector search with CLIP embeddings

## Implementation Plan

### Phase 1: Foundation (Week 1-2)

1. **Project Setup**
   ```bash
   mkdir packages/weaviate-mcp
   cd packages/weaviate-mcp
   pnpm init
   ```

2. **Dependencies**
   - `@modelcontextprotocol/sdk` - MCP protocol implementation
   - `weaviate-client` - Official Weaviate TypeScript client
   - `zod` - Schema validation
   - `dotenv` - Environment configuration

3. **Core Architecture**
   ```typescript
   src/
   ├── server.ts           # Main MCP server implementation
   ├── tools/              # Individual tool implementations
   │   ├── search-content.ts
   │   ├── search-conversations.ts
   │   ├── add-document.ts
   │   └── create-collection.ts
   ├── weaviate/           # Weaviate client wrapper
   │   ├── client.ts
   │   ├── schemas.ts
   │   └── operations.ts
   ├── types/              # TypeScript type definitions
   │   ├── mcp.ts
   │   ├── weaviate.ts
   │   └── content-types.ts
   ├── metadata/           # Content classification and metadata extraction
   │   ├── classifiers.ts
   │   ├── extractors.ts
   │   └── filters.ts
   └── utils/              # Utility functions
       ├── validation.ts
       └── error-handling.ts
   ```

4. **Basic Tools Implementation**
   - Implement `search_content` with metadata filtering as proof of concept
   - Set up Weaviate client connection and basic error handling
   - Create MCP server with tool registration
   - Implement content type classification system

### Phase 2: Core Features (Week 3-4)

1. **Complete Phase 1 Tools**
   - Implement `search_conversations` and `create_collection`
   - Add comprehensive error handling and validation
   - Write unit tests for all tools

2. **Schema Management**
   - Define Weaviate schemas for different content types
   - Implement automatic schema creation and migration
   - Add schema validation and type safety

3. **Configuration System**
   - Environment-based configuration
   - Connection pooling and retry logic
   - Logging and monitoring setup

### Phase 3: Advanced Query Features (Week 5-6)

1. **QueryAgent Integration**
   - Implement `query_agent` tool using Weaviate's QueryAgent library
   - Add natural language to query translation
   - Integrate with existing LLM providers for answer generation

2. **Advanced Search Tools**
   - Implement `hybrid_search` with configurable weights
   - Add `get_similar` with multiple similarity metrics
   - Optimize query performance and caching

3. **Multi-Modal Features**
   - Configure alternative vectorizers for image support
   - Implement basic image indexing with external processing
   - Add image search capabilities to `search_content` tool

### Phase 4: Enhanced Vision (Week 7-8)

1. **Google Cloud Vision Integration**
   - Add OCR capabilities for text extraction from images
   - Implement object detection for rich metadata
   - Create `process_image` tool for advanced image analysis

2. **Batch Operations**
   - Implement `batch_index` with progress tracking
   - Add concurrent processing and rate limiting
   - Error recovery and partial failure handling

### Phase 5: Integration & Testing (Week 9-10)

1. **Kilo Code Integration**
   - Add MCP server to existing MCP hub
   - Configure connection in development and production
   - Test with real Kilo Code data and workflows

2. **Performance Optimization**
   - Query optimization and indexing strategies
   - Memory usage optimization
   - Connection pooling and resource management

3. **Documentation & Testing**
   - Comprehensive API documentation
   - Integration tests with real Weaviate instance
   - Performance benchmarks and load testing

## Configuration

### Environment Variables
```env
WEAVIATE_URL=http://localhost:8080
WEAVIATE_API_KEY=your-api-key
WEAVIATE_TIMEOUT=30000
MCP_SERVER_PORT=3003
LOG_LEVEL=info

# Optional: Google Cloud Vision (Phase 4)
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_KEY_FILE=path/to/service-account.json
```

### Weaviate Schema Configuration
```typescript
// Multi-modal schema with CLIP vectorization
{
  "class": "Document",
  "vectorizer": "multi2vec-clip",
  "moduleConfig": {
    "multi2vec-clip": {
      "imageFields": ["image"],
      "textFields": ["content", "description", "extractedText"],
      "weights": {
        "textFields": [0.7],
        "imageFields": [0.3]
      }
    }
  },
  "properties": [
    {
      "name": "content",
      "dataType": ["text"]
    },
    {
      "name": "image",
      "dataType": ["blob"]
    },
    {
      "name": "contentType",
      "dataType": ["string"]
    },
    {
      "name": "extractedText",
      "dataType": ["text"]
    },
    {
      "name": "detectedObjects",
      "dataType": ["string[]"]
    }
  ]
}
```

### MCP Server Registration
```json
{
  "mcpServers": {
    "weaviate": {
      "command": "node",
      "args": ["packages/weaviate-mcp/dist/server.js"],
      "env": {
        "WEAVIATE_URL": "http://localhost:8080"
      }
    }
  }
}
```

## Image Search Implementation Strategy

### Phase 1: Built-in CLIP (Weeks 5-6)
- **Vectorization**: Weaviate's `multi2vec-clip` module handles automatic image embedding
- **Search Capabilities**: Text-to-image and image-to-image similarity search
- **Benefits**: Zero external dependencies, immediate visual search, cost-effective

```typescript
// Example: Search images with text
search_content("code editor screenshots", {
  contentType: ["image"],
  visualSearch: true
})

// Example: Find similar images
search_content("", {
  contentType: ["image"],
  similarTo: "reference-image.png"
})
```

### Phase 2: Enhanced with Google Cloud Vision (Weeks 7-8)
- **OCR**: Extract text from screenshots, diagrams, handwritten notes
- **Object Detection**: Identify UI elements, code structures, technical diagrams
- **Rich Metadata**: Enhanced filtering and search precision

```typescript
// Enhanced image processing
process_image("screenshot.png") → {
  visualEmbedding: "handled by Weaviate CLIP",
  extractedText: "function handleWebSocket() { ... }",
  detectedObjects: ["code editor", "terminal", "browser"],
  confidence: 0.95,
  imageType: "screenshot"
}
```

## Success Metrics

1. **Functionality**: All 9 tools implemented and tested (including QueryAgent)
2. **Performance**: Sub-second response times for typical queries
3. **Reliability**: 99.9% uptime with proper error handling
4. **Integration**: Seamless integration with existing Kilo Code workflows
5. **Scalability**: Handle concurrent requests and large datasets
6. **Natural Language Queries**: Accurate QueryAgent responses with source citations

## Future Enhancements

- Multi-tenant support for different workspaces
- Real-time indexing with change detection
- Advanced analytics and search insights
- Integration with additional vector databases
- GraphQL query interface for complex operations

## Dependencies

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "weaviate-client": "^3.0.0",
    "zod": "^3.22.0",
    "dotenv": "^16.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0",
    "tsx": "^4.0.0"
  }
}
```

This custom MCP server will provide Kilo Code with powerful vector search capabilities, enabling semantic code search, intelligent conversation retrieval, and advanced RAG workflows while maintaining the flexibility and extensibility of the MCP architecture.