# Weaviate MCP Server

A Model Context Protocol (MCP) server that provides semantic search and vector database capabilities using Weaviate for Kilo Code.

## Features

- **Universal Search**: Semantic search across code, notes, screenplays, todos, documentation, conversations, and images
- **AI-Powered Classification**: Automatic content classification using Groq LLM
- **Rich Metadata**: Comprehensive metadata extraction and filtering
- **Vector Embeddings**: OpenAI text embeddings for semantic understanding
- **Flexible Filtering**: Filter by content type, project, language, tags, priority, and more

## Available Tools

### `search_content`
Universal semantic search across all indexed content types.

**Arguments:**
- `query` (string): Search query string
- `filters` (object, optional): Search filters
  - `contentType`: Array of content types to search
  - `fileExtension`: Array of file extensions
  - `dateRange`: Date range filter with `after` and `before`
  - `project`: Project name filter
  - `tags`: Array of tags to filter by
  - `priority`: Priority level (low, medium, high)
  - `status`: Status filter
  - `language`: Programming language filter
  - `hasText`: Filter images with extracted text
  - `visualSimilarity`: Enable visual similarity search
  - `referenceImage`: Reference image for similarity search
- `limit` (number, optional): Maximum results (1-100, default: 10)
- `offset` (number, optional): Pagination offset (default: 0)

**Returns:**
- `results`: Array of search results with content, metadata, and relevance scores
- `total`: Total number of results
- `query`: Original search query
- `filters`: Applied filters
- `executionTime`: Search execution time in milliseconds

### `add_document`
Index new content with rich metadata classification.

**Arguments:**
- `content` (string): Document content
- `metadata` (object): Document metadata
  - `contentType` (required): Type of content (code, note, screenplay, todo, documentation, conversation, image)
  - `title` (optional): Document title
  - `description` (optional): Document description
  - `filePath` (optional): File path if applicable
  - `fileExtension` (optional): File extension
  - `project` (optional): Project name
  - `tags` (optional): Array of document tags
  - `priority` (optional): Priority level
  - `status` (optional): Document status
  - `language` (optional): Programming language
  - `author` (optional): Document author
- `autoClassify` (boolean, optional): Automatically classify and extract metadata (default: true)
- `image` (string, optional): Base64 encoded image data for visual content

**Returns:**
- `id`: Generated document ID
- `success`: Boolean indicating success
- `message`: Status message
- `detectedMetadata`: Auto-detected metadata (if autoClassify is enabled)

## Configuration

The server requires the following environment variables:

```env
# Weaviate Configuration
WEAVIATE_URL=https://your-instance.weaviate.cloud
WEAVIATE_API_KEY=your-weaviate-api-key

# OpenAI Configuration (required for Weaviate Cloud text2vec-openai vectorizer)
OPENAI_APIKEY=your-openai-api-key

# Groq Configuration for AI-powered classification
GROQ_API_KEY=your-groq-api-key

# MCP Server Configuration
MCP_SERVER_PORT=3003
LOG_LEVEL=info
```

## Usage

### Development
```bash
cd packages/weaviate-mcp
pnpm install
pnpm dev
```

### Production
```bash
cd packages/weaviate-mcp
pnpm build
pnpm start
```

### Integration with Kilo Code

The server is automatically configured in Kilo Code's MCP settings. You can use the tools directly in conversations:

**Example: Index a code file**
```
Please index this TypeScript function:
```typescript
function handleWebSocket(socket: WebSocket) {
  socket.onopen = () => console.log('Connected');
  socket.onmessage = (event) => console.log('Message:', event.data);
}
```
```

**Example: Search for code**
```
Find all WebSocket-related code in the kilo-web-client project
```

**Example: Search with filters**
```
Search for authentication code written in TypeScript with high priority
```

## Architecture

- **`src/server.ts`**: Main MCP server implementation
- **`src/tools/`**: Individual tool implementations
- **`src/weaviate/`**: Weaviate client wrapper and operations
- **`src/types/`**: TypeScript type definitions
- **`src/metadata/`**: Content classification and metadata extraction
- **`src/utils/`**: Utility functions

## Limitations

- **Weaviate Cloud**: Only supports text2vec-openai vectorizer (no multi2vec-clip for images)
- **Image Search**: Currently text-only; image support requires external OCR/vision processing
- **Rate Limits**: Subject to OpenAI API rate limits for vectorization

## Future Enhancements

- Google Cloud Vision integration for OCR and object detection
- Visual similarity search with external image processing
- Batch indexing operations
- Real-time file watching and auto-indexing
- Advanced RAG workflows with generative search