/**
 * MessageHighlighter - Adds syntax highlighting to messages
 */
export class MessageHighlighter {
  constructor() {
    this.patterns = [
      // Log levels
      { regex: /\[?(TRACE|DEBUG|INFO|WARN|WARNING|ERROR|FATAL|CRITICAL)\]?/gi, color: 'blue' },
      { regex: /\b(error|exception|fail|failed|failure)\b/gi, color: 'red' },
      { regex: /\b(success|successful|ok|pass|passed)\b/gi, color: 'green' },
      { regex: /\b(warning|warn|caution)\b/gi, color: 'yellow' },
      
      // Numbers
      { regex: /\b\d+\.?\d*\b/g, color: 'magenta' },
      
      // IP addresses
      { regex: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, color: 'cyan' },
      
      // URLs
      { regex: /https?:\/\/[^\s]+/g, color: 'blue' },
      
      // Quoted strings
      { regex: /"[^"]*"/g, color: 'green' },
      { regex: /'[^']*'/g, color: 'green' },
      
      // JSON-like structures
      { regex: /\{[^}]*\}/g, color: 'yellow' },
      
      // Timestamps
      { regex: /\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(\.\d+)?([+-]\d{2}:\d{2}|Z)?/g, color: 'cyan' },
      
      // Special characters
      { regex: /[:=]/g, color: 'white' }
    ];
  }

  /**
   * Highlight message content with blessed tags
   * @param {string} content - Message content
   * @returns {string} Content with color tags
   */
  highlight(content) {
    // Escape existing tags
    let highlighted = content.replace(/\{/g, '{{').replace(/\}/g, '}}');
    
    // Apply highlighting patterns
    for (const pattern of this.patterns) {
      highlighted = highlighted.replace(pattern.regex, (match) => {
        return `{${pattern.color}-fg}${match}{/${pattern.color}-fg}`;
      });
    }
    
    return highlighted;
  }

  /**
   * Add custom highlighting pattern
   * @param {RegExp|string} pattern - Pattern to match
   * @param {string} color - Color name (red, green, blue, etc.)
   */
  addPattern(pattern, color) {
    const regex = typeof pattern === 'string' ? new RegExp(pattern, 'gi') : pattern;
    this.patterns.push({ regex, color });
  }
}
