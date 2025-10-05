// Content type definitions
export type ContentType = 'code' | 'note' | 'screenplay' | 'todo' | 'documentation' | 'conversation' | 'image';

// Search filters interface
export interface SearchFilters {
  contentType?: ContentType[];
  fileExtension?: string[];
  dateRange?: {
    after?: string;
    before?: string;
  };
  project?: string;
  tags?: string[];
  priority?: 'low' | 'medium' | 'high';
  status?: string;
  language?: string;
  hasText?: boolean;
  visualSimilarity?: boolean;
  referenceImage?: string;
}

// Document metadata interface
export interface DocumentMetadata {
  id: string;
  contentType: ContentType;
  title?: string;
  description?: string;
  filePath?: string;
  fileExtension?: string;
  project?: string;
  tags: string[];
  priority?: 'low' | 'medium' | 'high';
  status?: string;
  language?: string;
  createdAt: string;
  updatedAt: string;
  author?: string;
  // Image-specific metadata
  extractedText?: string;
  detectedObjects?: string[];
  imageType?: string;
  dimensions?: string;
}

// Search result interface
export interface SearchResult {
  id: string;
  content: string;
  metadata: DocumentMetadata;
  relevanceScore: number;
  highlights?: string[];
}

// Add document request interface
export interface AddDocumentRequest {
  content: string;
  metadata: Partial<DocumentMetadata> & {
    contentType: ContentType;
  };
  autoClassify?: boolean;
  image?: string; // base64 encoded image data
}

// Search request interface
export interface SearchRequest {
  query: string;
  filters?: SearchFilters;
  limit?: number;
  offset?: number;
}