/**
 * Configuration Example
 * 
 * This file shows how to customize the UDP Monitor with
 * custom plugins and configurations.
 */
import { StatusPanel } from './lib/status-panel.js';
import { MessageHighlighter } from './lib/message-highlighter.js';

// Example: Custom configuration for JSON API monitoring
export const jsonApiConfig = {
  port: 41234,
  host: '0.0.0.0',
  maxMessages: 2000,
  
  // Custom status panel plugin
  statusPlugin: (message, messages) => {
    if (!message) return '{gray-fg}Waiting...{/gray-fg}';
    
    try {
      const data = JSON.parse(message.content);
      return `{green-fg}API Monitor{/green-fg}
{cyan-fg}Endpoint:{/cyan-fg} ${data.endpoint || 'N/A'}
{yellow-fg}Status:{/yellow-fg} ${data.status || 'N/A'}
{blue-fg}Duration:{/blue-fg} ${data.duration || 'N/A'}`;
    } catch {
      return '{gray-fg}Not JSON{/gray-fg}';
    }
  },
  
  // Custom highlighting patterns
  highlightPatterns: [
    { pattern: /GET|POST|PUT|DELETE|PATCH/g, color: 'cyan' },
    { pattern: /2\d{2}/g, color: 'green' }, // 2xx success
    { pattern: /4\d{2}|5\d{2}/g, color: 'red' }, // 4xx/5xx errors
    { pattern: /\d+ms/g, color: 'magenta' }
  ]
};

// Example: Custom configuration for IoT device monitoring
export const iotConfig = {
  port: 41234,
  host: '0.0.0.0',
  maxMessages: 5000,
  
  // Custom status panel for sensor data
  statusPlugin: (message, messages) => {
    if (!message) return '{gray-fg}No devices{/gray-fg}';
    
    const pattern = /DEVICE:(\S+)\s+TEMP:([\d.]+)\s+HUMID:([\d.]+)/;
    const match = message.content.match(pattern);
    
    if (match) {
      const [, device, temp, humid] = match;
      return `{green-fg}IoT Device{/green-fg}
{cyan-fg}Device:{/cyan-fg} ${device}
{yellow-fg}Temp:{/yellow-fg} ${temp}°C
{blue-fg}Humidity:{/blue-fg} ${humid}%`;
    }
    
    return '{gray-fg}No sensor data{/gray-fg}';
  },
  
  // Custom highlighting
  highlightPatterns: [
    { pattern: /DEVICE:\S+/g, color: 'cyan' },
    { pattern: /TEMP:[\d.]+/g, color: 'yellow' },
    { pattern: /HUMID:[\d.]+/g, color: 'blue' },
    { pattern: /STATUS:\w+/g, color: 'green' }
  ]
};

// Usage example:
// import { jsonApiConfig } from './config.js';
// const monitor = new UDPMonitor(jsonApiConfig.port, jsonApiConfig.host, jsonApiConfig.maxMessages);
// monitor.statusPanel.registerPlugin(jsonApiConfig.statusPlugin);
// jsonApiConfig.highlightPatterns.forEach(p => 
//   monitor.highlighter.addPattern(p.pattern, p.color)
// );
