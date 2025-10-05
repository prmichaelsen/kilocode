import { Groq } from 'groq-sdk';
import { ContentType } from '../types/content-types.js';
import { logger } from '../utils/logger.js';

export class GroqClassifier {
  private groq: Groq;

  constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
  }

  async enhanceMetadata(
    content: string,
    contentType: ContentType,
    filePath?: string
  ): Promise<Record<string, any>> {
    try {
      const prompt = this.buildClassificationPrompt(content, contentType, filePath);
      
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.1,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      });

      const result = completion.choices[0]?.message?.content;
      if (!result) {
        throw new Error('No response from Groq');
      }

      const metadata = JSON.parse(result);
      logger.debug('Groq classification complete', { metadata });
      
      return metadata;

    } catch (error) {
      logger.error('Groq classification failed:', error);
      // Return basic metadata as fallback
      return {
        title: this.generateFallbackTitle(content, contentType),
        description: this.generateFallbackDescription(content),
        tags: this.extractBasicTags(content)
      };
    }
  }

  private buildClassificationPrompt(content: string, contentType: ContentType, filePath?: string): string {
    const basePrompt = `
Analyze the following ${contentType} content and extract metadata. Return a JSON object with the following structure:

{
  "title": "concise title (max 100 chars)",
  "description": "brief description (max 200 chars)", 
  "tags": ["relevant", "tags", "array"],
  "priority": "low|medium|high",
  "status": "relevant status if applicable",
  "language": "programming language if code",
  "complexity": "simple|medium|complex",
  "topics": ["main", "topics", "covered"]
}

Content to analyze:
${content.substring(0, 2000)}${content.length > 2000 ? '...' : ''}
`;

    // Add content-specific instructions
    switch (contentType) {
      case 'code':
        return basePrompt + `

Additional instructions for code:
- Identify the programming language
- Detect patterns like functions, classes, imports
- Assess complexity based on nesting, logic, dependencies
- Extract meaningful function/class names for tags
- Determine if it's a test, utility, component, etc.
${filePath ? `- File path context: ${filePath}` : ''}`;

      case 'todo':
        return basePrompt + `

Additional instructions for todos:
- Determine priority based on urgency indicators
- Extract status from completion markers [x], [-], [ ]
- Identify due dates or time-sensitive language
- Tag with project areas or categories`;

      case 'note':
        return basePrompt + `

Additional instructions for notes:
- Identify main topics and themes
- Extract actionable items
- Determine if it's meeting notes, brainstorming, research, etc.
- Look for urgency or priority indicators`;

      case 'screenplay':
        return basePrompt + `

Additional instructions for screenplays:
- Extract character names
- Identify scene types (interior/exterior)
- Detect act/scene structure
- Tag with genre indicators`;

      case 'documentation':
        return basePrompt + `

Additional instructions for documentation:
- Identify doc type (API, user guide, tutorial, etc.)
- Extract version information
- Identify target audience
- Tag with technical areas covered`;

      case 'conversation':
        return basePrompt + `

Additional instructions for conversations:
- Count participants and messages
- Identify main topics discussed
- Detect if it's troubleshooting, planning, review, etc.
- Extract key decisions or action items`;

      default:
        return basePrompt;
    }
  }

  private generateFallbackTitle(content: string, contentType: ContentType): string {
    const firstLine = content.split('\n')[0].trim();
    
    if (firstLine.length > 0 && firstLine.length < 100) {
      return firstLine.replace(/^#+\s*/, '').trim();
    }

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

  private generateFallbackDescription(content: string): string {
    const truncated = content.substring(0, 200).trim();
    return truncated.length < content.length ? truncated + '...' : truncated;
  }

  private extractBasicTags(content: string): string[] {
    const tags: string[] = [];
    
    // Basic pattern matching for common terms
    const patterns = [
      { pattern: /react|jsx|tsx/gi, tag: 'react' },
      { pattern: /typescript|ts/gi, tag: 'typescript' },
      { pattern: /javascript|js/gi, tag: 'javascript' },
      { pattern: /python|py/gi, tag: 'python' },
      { pattern: /api|rest/gi, tag: 'api' },
      { pattern: /test|testing/gi, tag: 'testing' },
      { pattern: /database|db/gi, tag: 'database' }
    ];

    for (const { pattern, tag } of patterns) {
      if (pattern.test(content)) {
        tags.push(tag);
      }
    }

    return [...new Set(tags)];
  }
}