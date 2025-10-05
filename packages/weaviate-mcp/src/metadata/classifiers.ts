import { ContentType } from '../types/content-types.js';
import { GroqClassifier } from './groq-classifier.js';
import { logger } from '../utils/logger.js';

export class ContentClassifier {
  private groqClassifier: GroqClassifier;

  constructor() {
    this.groqClassifier = new GroqClassifier();
  }
  
  async classifyContent(
    content: string,
    declaredType: ContentType,
    filePath?: string
  ): Promise<Record<string, any>> {
    logger.debug('Classifying content', { declaredType, filePath });

    const metadata: Record<string, any> = {};

    // Extract file-based metadata
    if (filePath) {
      metadata.fileExtension = this.extractFileExtension(filePath);
      metadata.language = this.detectLanguageFromExtension(metadata.fileExtension);
      metadata.project = this.extractProjectFromPath(filePath);
    }

    // Use Groq for AI-powered classification
    try {
      const groqMetadata = await this.groqClassifier.enhanceMetadata(content, declaredType, filePath);
      Object.assign(metadata, groqMetadata);
    } catch (error) {
      logger.warn('Groq classification failed, using fallback:', error);
      // Fallback to rule-based classification
      Object.assign(metadata, this.fallbackClassification(content, declaredType, filePath));
    }

    logger.debug('Classification complete', { metadata });
    return metadata;
  }

  private fallbackClassification(content: string, declaredType: ContentType, filePath?: string): Record<string, any> {
    const metadata: Record<string, any> = {};

    // Content-specific classification
    switch (declaredType) {
      case 'code':
        Object.assign(metadata, this.classifyCode(content, filePath));
        break;
      case 'note':
        Object.assign(metadata, this.classifyNote(content));
        break;
      case 'todo':
        Object.assign(metadata, this.classifyTodo(content));
        break;
      case 'screenplay':
        Object.assign(metadata, this.classifyScreenplay(content));
        break;
      case 'documentation':
        Object.assign(metadata, this.classifyDocumentation(content));
        break;
      case 'conversation':
        Object.assign(metadata, this.classifyConversation(content));
        break;
      case 'image':
        Object.assign(metadata, this.classifyImage(content));
        break;
    }

    // Extract common metadata
    metadata.tags = this.extractTags(content, declaredType);
    metadata.title = metadata.title || this.generateTitle(content, declaredType);
    metadata.description = metadata.description || this.generateDescription(content, declaredType);

    return metadata;
  }

  private extractFileExtension(filePath: string): string {
    const match = filePath.match(/\.([^.]+)$/);
    return match ? `.${match[1]}` : '';
  }

  private detectLanguageFromExtension(extension: string): string | undefined {
    const languageMap: Record<string, string> = {
      '.ts': 'typescript',
      '.js': 'javascript',
      '.tsx': 'typescript',
      '.jsx': 'javascript',
      '.py': 'python',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.cs': 'csharp',
      '.go': 'go',
      '.rs': 'rust',
      '.php': 'php',
      '.rb': 'ruby',
      '.swift': 'swift',
      '.kt': 'kotlin',
      '.scala': 'scala',
      '.sh': 'bash',
      '.sql': 'sql',
      '.html': 'html',
      '.css': 'css',
      '.scss': 'scss',
      '.less': 'less',
      '.json': 'json',
      '.xml': 'xml',
      '.yaml': 'yaml',
      '.yml': 'yaml',
      '.md': 'markdown',
      '.txt': 'text'
    };

    return languageMap[extension.toLowerCase()];
  }

  private extractProjectFromPath(filePath: string): string | undefined {
    // Extract project name from path patterns
    const pathParts = filePath.split('/');
    
    // Look for common project indicators
    const projectIndicators = ['src', 'packages', 'apps', 'projects'];
    
    for (let i = 0; i < pathParts.length - 1; i++) {
      if (projectIndicators.includes(pathParts[i]) && pathParts[i + 1]) {
        return pathParts[i + 1];
      }
    }

    // Fallback to first directory
    return pathParts.length > 1 ? pathParts[0] : undefined;
  }

  private classifyCode(content: string, filePath?: string): Record<string, any> {
    const metadata: Record<string, any> = {};

    // Detect code patterns
    const patterns = {
      hasClasses: /class\s+\w+/g,
      hasFunctions: /function\s+\w+|const\s+\w+\s*=\s*\(/g,
      hasImports: /import\s+.*from|require\s*\(/g,
      hasExports: /export\s+/g,
      hasAsync: /async\s+/g,
      hasTests: /describe\s*\(|test\s*\(|it\s*\(/g
    };

    const detectedPatterns = Object.entries(patterns)
      .filter(([, pattern]) => pattern.test(content))
      .map(([name]) => name);

    if (detectedPatterns.length > 0) {
      metadata.tags = [...(metadata.tags || []), ...detectedPatterns];
    }

    // Detect if it's a test file
    if (filePath && (filePath.includes('.test.') || filePath.includes('.spec.') || filePath.includes('__tests__'))) {
      metadata.tags = [...(metadata.tags || []), 'test'];
    }

    return metadata;
  }

  private classifyNote(content: string): Record<string, any> {
    const metadata: Record<string, any> = {};

    // Detect note patterns
    if (content.includes('TODO:') || content.includes('FIXME:')) {
      metadata.tags = [...(metadata.tags || []), 'actionable'];
    }

    if (content.includes('URGENT') || content.includes('ASAP')) {
      metadata.priority = 'high';
    }

    return metadata;
  }

  private classifyTodo(content: string): Record<string, any> {
    const metadata: Record<string, any> = {};

    // Detect priority indicators
    if (content.match(/urgent|asap|critical|high priority/i)) {
      metadata.priority = 'high';
    } else if (content.match(/low priority|nice to have|optional/i)) {
      metadata.priority = 'low';
    } else {
      metadata.priority = 'medium';
    }

    // Detect status indicators
    if (content.match(/\[x\]|completed|done|finished/i)) {
      metadata.status = 'completed';
    } else if (content.match(/\[-\]|in progress|working on/i)) {
      metadata.status = 'in_progress';
    } else {
      metadata.status = 'pending';
    }

    return metadata;
  }

  private classifyScreenplay(content: string): Record<string, any> {
    const metadata: Record<string, any> = {};

    // Detect screenplay elements
    const characters = content.match(/^[A-Z][A-Z\s]+$/gm) || [];
    if (characters.length > 0) {
      metadata.tags = [...(metadata.tags || []), 'characters'];
    }

    if (content.includes('FADE IN:') || content.includes('FADE OUT:')) {
      metadata.tags = [...(metadata.tags || []), 'scene-transitions'];
    }

    return metadata;
  }

  private classifyDocumentation(content: string): Record<string, any> {
    const metadata: Record<string, any> = {};

    // Detect documentation type
    if (content.includes('# API') || content.includes('## Endpoints')) {
      metadata.tags = [...(metadata.tags || []), 'api-docs'];
    }

    if (content.includes('## Installation') || content.includes('## Setup')) {
      metadata.tags = [...(metadata.tags || []), 'setup-guide'];
    }

    if (content.includes('## Examples') || content.includes('```')) {
      metadata.tags = [...(metadata.tags || []), 'examples'];
    }

    return metadata;
  }

  private classifyConversation(content: string): Record<string, any> {
    const metadata: Record<string, any> = {};

    // Detect conversation patterns
    const messageCount = (content.match(/^(User|Assistant|Human):/gm) || []).length;
    metadata.messageCount = messageCount;

    if (content.includes('error') || content.includes('Error')) {
      metadata.tags = [...(metadata.tags || []), 'error-discussion'];
    }

    if (content.includes('implement') || content.includes('code')) {
      metadata.tags = [...(metadata.tags || []), 'implementation'];
    }

    return metadata;
  }

  private classifyImage(content: string): Record<string, any> {
    const metadata: Record<string, any> = {};

    // For now, basic image classification
    // This will be enhanced when we add OCR and object detection
    metadata.imageType = 'general';
    
    return metadata;
  }

  private extractTags(content: string, contentType: ContentType): string[] {
    const tags: string[] = [];

    // Common tag patterns
    const tagPatterns = [
      { pattern: /react|jsx|tsx/gi, tag: 'react' },
      { pattern: /vue|vuejs/gi, tag: 'vue' },
      { pattern: /angular/gi, tag: 'angular' },
      { pattern: /node\.?js|nodejs/gi, tag: 'nodejs' },
      { pattern: /typescript|ts/gi, tag: 'typescript' },
      { pattern: /javascript|js/gi, tag: 'javascript' },
      { pattern: /python|py/gi, tag: 'python' },
      { pattern: /database|db|sql/gi, tag: 'database' },
      { pattern: /api|rest|graphql/gi, tag: 'api' },
      { pattern: /test|testing|spec/gi, tag: 'testing' },
      { pattern: /auth|authentication|login/gi, tag: 'authentication' },
      { pattern: /websocket|ws/gi, tag: 'websocket' },
      { pattern: /docker|container/gi, tag: 'docker' },
      { pattern: /kubernetes|k8s/gi, tag: 'kubernetes' }
    ];

    for (const { pattern, tag } of tagPatterns) {
      if (pattern.test(content)) {
        tags.push(tag);
      }
    }

    return [...new Set(tags)]; // Remove duplicates
  }

  private generateTitle(content: string, contentType: ContentType): string {
    // Extract first line or meaningful title
    const firstLine = content.split('\n')[0].trim();
    
    if (firstLine.length > 0 && firstLine.length < 100) {
      // Remove markdown headers
      return firstLine.replace(/^#+\s*/, '').trim();
    }

    // Fallback titles based on content type
    const fallbacks: Record<ContentType, string> = {
      code: 'Code snippet',
      note: 'Note',
      screenplay: 'Screenplay',
      todo: 'Todo item',
      documentation: 'Documentation',
      conversation: 'Conversation',
      image: 'Image'
    };

    return fallbacks[contentType] || 'Document';
  }

  private generateDescription(content: string, contentType: ContentType): string {
    // Generate a brief description from content
    const truncated = content.substring(0, 200).trim();
    
    if (truncated.length < content.length) {
      return truncated + '...';
    }
    
    return truncated;
  }
}