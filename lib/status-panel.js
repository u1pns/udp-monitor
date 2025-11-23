/**
 * StatusPanel - Pluggable status panel for custom protocol information
 * This class can be extended to create custom status panels for specific protocols
 */
export class StatusPanel {
  constructor() {
    this.plugins = [];
  }

  /**
   * Register a plugin for custom status display
   * @param {function} plugin - Function that takes (message, messages) and returns string
   */
  registerPlugin(plugin) {
    this.plugins.push(plugin);
  }

  /**
   * Render status panel content
   * @param {object} message - Latest message
   * @param {array} messages - All messages
   * @returns {string} Status content with blessed tags
   */
  render(message, messages) {
    // If plugins are registered, use them
    if (this.plugins.length > 0) {
      return this.plugins.map(plugin => plugin(message, messages)).join('\n\n');
    }

    // Default status display
    return this.defaultStatus(message, messages);
  }

  /**
   * Default status display
   * @param {object} message - Latest message
   * @param {array} messages - All messages
   * @returns {string} Status content
   */
  defaultStatus(message, messages) {
    if (!message) {
      return '{gray-fg}Waiting for messages...{/gray-fg}';
    }

    // Extract some useful info
    const recentMessages = messages.slice(-10);
    const uniqueSources = new Set(recentMessages.map(m => m.source)).size;
    const avgSize = recentMessages.reduce((sum, m) => sum + m.size, 0) / recentMessages.length;
    const errorCount = recentMessages.filter(m => m.isError).length;

    return `{cyan-fg}Last Source:{/cyan-fg}
${message.source}

{cyan-fg}Recent Stats:{/cyan-fg}
Sources: ${uniqueSources}
Avg Size: ${avgSize.toFixed(0)} B
Errors: ${errorCount}/10`;
  }
}

/**
 * Example custom plugin for JSON protocol
 * @param {object} message - Latest message
 * @param {array} messages - All messages
 * @returns {string} Status content
 */
export function jsonProtocolPlugin(message, messages) {
  try {
    const data = JSON.parse(message.content);
    const keys = Object.keys(data);
    
    return `{green-fg}JSON Protocol:{/green-fg}
Keys: ${keys.join(', ')}
${keys.slice(0, 3).map(k => `${k}: ${data[k]}`).join('\n')}`;
  } catch (e) {
    return '{gray-fg}Not JSON{/gray-fg}';
  }
}

/**
 * Example custom plugin for microcontroller protocol
 * @param {object} message - Latest message
 * @param {array} messages - All messages
 * @returns {string} Status content
 */
export function microcontrollerPlugin(message, messages) {
  // Parse format like "TEMP:25.5 HUMID:60.2 STATUS:OK"
  const pattern = /(\w+):([^\s]+)/g;
  const matches = [...message.content.matchAll(pattern)];
  
  if (matches.length > 0) {
    const data = Object.fromEntries(matches.map(m => [m[1], m[2]]));
    return `{green-fg}MCU Status:{/green-fg}
${Object.entries(data).map(([k, v]) => `${k}: ${v}`).join('\n')}`;
  }
  
  return '{gray-fg}No MCU data{/gray-fg}';
}
