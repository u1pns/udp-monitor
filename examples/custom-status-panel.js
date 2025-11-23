/**
 * Example: Custom Status Panel for JSON Protocol
 * 
 * This example shows how to create a custom status panel
 * that parses JSON messages and displays specific fields.
 */
import { StatusPanel } from '../lib/status-panel.js';

// Create custom plugin function
function customJsonPlugin(message, messages) {
  if (!message) {
    return '{gray-fg}No data{/gray-fg}';
  }

  try {
    const data = JSON.parse(message.content);
    
    // Display specific fields with colors
    let output = '{green-fg}Custom Status:{/green-fg}\n\n';
    
    if (data.event) {
      output += `{cyan-fg}Event:{/cyan-fg} ${data.event}\n`;
    }
    if (data.user) {
      output += `{yellow-fg}User:{/yellow-fg} ${data.user}\n`;
    }
    if (data.timestamp) {
      output += `{blue-fg}Time:{/blue-fg} ${data.timestamp}\n`;
    }
    
    // Show recent event types
    const recentEvents = messages
      .slice(-10)
      .map(m => {
        try {
          return JSON.parse(m.content).event;
        } catch {
          return null;
        }
      })
      .filter(Boolean);
    
    const eventCounts = {};
    recentEvents.forEach(e => {
      eventCounts[e] = (eventCounts[e] || 0) + 1;
    });
    
    if (Object.keys(eventCounts).length > 0) {
      output += '\n{magenta-fg}Recent Events:{/magenta-fg}\n';
      Object.entries(eventCounts).forEach(([event, count]) => {
        output += `  ${event}: ${count}\n`;
      });
    }
    
    return output;
  } catch (e) {
    return '{gray-fg}Not JSON format{/gray-fg}';
  }
}

// Usage in your application:
// const statusPanel = new StatusPanel();
// statusPanel.registerPlugin(customJsonPlugin);

export { customJsonPlugin };
