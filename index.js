#!/usr/bin/env node

import dgram from 'dgram';
import blessed from 'blessed';
import contrib from 'blessed-contrib';
import { Command } from 'commander';
import { StatusPanel } from './lib/status-panel.js';
import { MessageFilter } from './lib/message-filter.js';
import { MessageHighlighter } from './lib/message-highlighter.js';

const program = new Command();

program
  .name('udp-monitor')
  .description('Real-time UDP packet monitor with interactive terminal interface')
  .version('1.0.0')
  .option('-p, --port <number>', 'UDP port to listen on', '41234')
  .option('-h, --host <string>', 'Host address to bind to', '0.0.0.0')
  .option('--max-messages <number>', 'Maximum messages to keep in memory', '1000')
  .parse(process.argv);

const options = program.opts();
const PORT = parseInt(options.port);
const HOST = options.host;
const MAX_MESSAGES = parseInt(options.maxMessages);

class UDPMonitor {
  constructor(port, host, maxMessages) {
    this.port = port;
    this.host = host;
    this.maxMessages = maxMessages;
    this.messages = [];
    this.stats = {
      total: 0,
      errors: 0,
      filtered: 0,
      bytesReceived: 0,
      startTime: Date.now()
    };
    this.filter = new MessageFilter();
    this.highlighter = new MessageHighlighter();
    this.statusPanel = new StatusPanel();
    this.setupUI();
    this.setupServer();
  }

  setupUI() {
    // Create screen
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'UDP Monitor'
    });

    // Create grid layout
    this.grid = new contrib.grid({ rows: 12, cols: 12, screen: this.screen });

    // Message log (main area)
    this.messageLog = this.grid.set(0, 0, 9, 9, blessed.log, {
      label: ' Messages ',
      tags: true,
      border: { type: 'line' },
      style: {
        fg: 'white',
        bg: 'default',
        border: { fg: 'cyan' },
        focus: { border: { fg: 'green' } }
      },
      scrollable: true,
      alwaysScroll: true,
      scrollbar: {
        ch: ' ',
        track: { bg: 'gray' },
        style: { inverse: true }
      },
      keys: true,
      vi: true,
      mouse: true
    });

    // Stats panel
    this.statsBox = this.grid.set(0, 9, 3, 3, blessed.box, {
      label: ' Statistics ',
      content: '',
      tags: true,
      border: { type: 'line' },
      style: {
        fg: 'white',
        bg: 'default',
        border: { fg: 'cyan' }
      }
    });

    // Filter panel
    this.filterBox = this.grid.set(3, 9, 3, 3, blessed.box, {
      label: ' Filters ',
      content: '',
      tags: true,
      border: { type: 'line' },
      style: {
        fg: 'white',
        bg: 'default',
        border: { fg: 'cyan' }
      }
    });

    // Custom status panel (pluggable)
    this.customStatusBox = this.grid.set(6, 9, 3, 3, blessed.box, {
      label: ' Status ',
      content: '',
      tags: true,
      border: { type: 'line' },
      style: {
        fg: 'white',
        bg: 'default',
        border: { fg: 'cyan' }
      }
    });

    // Command help panel
    this.helpBox = this.grid.set(9, 0, 3, 12, blessed.box, {
      label: ' Commands ',
      content: this.getHelpText(),
      tags: true,
      border: { type: 'line' },
      style: {
        fg: 'white',
        bg: 'default',
        border: { fg: 'cyan' }
      }
    });

    // Key bindings
    this.screen.key(['escape', 'q', 'C-c'], () => {
      return process.exit(0);
    });

    this.screen.key(['c'], () => {
      this.clearMessages();
    });

    this.screen.key(['f'], () => {
      this.promptFilter();
    });

    this.screen.key(['r'], () => {
      this.filter.clearFilters();
      this.updateFilterDisplay();
      this.logMessage('Filters cleared', 'info');
    });

    this.screen.key(['p'], () => {
      this.togglePause();
    });

    this.messageLog.focus();
    this.screen.render();
  }

  setupServer() {
    this.server = dgram.createSocket('udp4');
    this.paused = false;

    this.server.on('error', (err) => {
      this.logMessage(`Server error: ${err.message}`, 'error');
      this.stats.errors++;
      this.updateStats();
    });

    this.server.on('message', (msg, rinfo) => {
      if (this.paused) return;

      const messageStr = msg.toString();
      this.stats.total++;
      this.stats.bytesReceived += msg.length;

      // Apply filters
      if (!this.filter.match(messageStr, rinfo)) {
        this.stats.filtered++;
        this.updateStats();
        return;
      }

      // Detect errors in message
      const isError = this.detectError(messageStr);
      if (isError) {
        this.stats.errors++;
      }

      // Store message
      const message = {
        timestamp: new Date(),
        content: messageStr,
        source: `${rinfo.address}:${rinfo.port}`,
        size: msg.length,
        isError
      };

      this.messages.push(message);
      if (this.messages.length > this.maxMessages) {
        this.messages.shift();
      }

      // Display message with highlighting
      this.displayMessage(message);

      // Update UI
      this.updateStats();
      this.updateCustomStatus(message);
      this.screen.render();
    });

    this.server.on('listening', () => {
      const address = this.server.address();
      this.logMessage(`UDP Monitor listening on ${address.address}:${address.port}`, 'success');
    });

    this.server.bind(this.port, this.host);
  }

  detectError(message) {
    const errorPatterns = [
      /error/i,
      /exception/i,
      /fatal/i,
      /critical/i,
      /fail/i,
      /\[ERROR\]/i,
      /\[FATAL\]/i,
      /panic/i
    ];
    return errorPatterns.some(pattern => pattern.test(message));
  }

  displayMessage(message) {
    const timestamp = message.timestamp.toISOString().substr(11, 12);
    const source = message.source.padEnd(21);
    
    let coloredContent = this.highlighter.highlight(message.content);
    
    if (message.isError) {
      this.messageLog.log(`{red-fg}[${timestamp}] ${source} {bold}${coloredContent}{/bold}{/red-fg}`);
    } else {
      this.messageLog.log(`{cyan-fg}[${timestamp}]{/cyan-fg} {yellow-fg}${source}{/yellow-fg} ${coloredContent}`);
    }
  }

  logMessage(message, type = 'info') {
    const timestamp = new Date().toISOString().substr(11, 12);
    let color = 'white';
    
    switch (type) {
      case 'error': color = 'red'; break;
      case 'success': color = 'green'; break;
      case 'info': color = 'blue'; break;
      case 'warning': color = 'yellow'; break;
    }
    
    this.messageLog.log(`{${color}-fg}[${timestamp}] ${message}{/${color}-fg}`);
  }

  clearMessages() {
    this.messages = [];
    this.messageLog.setContent('');
    this.logMessage('Messages cleared', 'info');
    this.screen.render();
  }

  togglePause() {
    this.paused = !this.paused;
    this.logMessage(this.paused ? 'Paused' : 'Resumed', 'info');
  }

  promptFilter() {
    const prompt = blessed.prompt({
      parent: this.screen,
      top: 'center',
      left: 'center',
      height: 'shrink',
      width: 'shrink',
      border: 'line',
      label: ' Add Filter (regex) ',
      tags: true,
      keys: true,
      vi: true
    });

    prompt.input('Enter filter pattern:', '', (err, value) => {
      if (value) {
        try {
          this.filter.addFilter(value);
          this.updateFilterDisplay();
          this.logMessage(`Filter added: ${value}`, 'success');
        } catch (e) {
          this.logMessage(`Invalid filter: ${e.message}`, 'error');
        }
      }
      this.screen.render();
    });

    this.screen.render();
  }

  updateStats() {
    const uptime = Math.floor((Date.now() - this.stats.startTime) / 1000);
    const rate = uptime > 0 ? (this.stats.total / uptime).toFixed(2) : 0;
    
    const content = `
{cyan-fg}Total:{/cyan-fg} ${this.stats.total}
{green-fg}Displayed:{/green-fg} ${this.messages.length}
{yellow-fg}Filtered:{/yellow-fg} ${this.stats.filtered}
{red-fg}Errors:{/red-fg} ${this.stats.errors}
{blue-fg}Bytes:{/blue-fg} ${this.formatBytes(this.stats.bytesReceived)}
{magenta-fg}Rate:{/magenta-fg} ${rate} msg/s
{white-fg}Uptime:{/white-fg} ${this.formatUptime(uptime)}`;

    this.statsBox.setContent(content);
  }

  updateFilterDisplay() {
    const filters = this.filter.getFilters();
    let content = '';
    
    if (filters.length === 0) {
      content = '{gray-fg}No filters active{/gray-fg}';
    } else {
      content = filters.map((f, i) => `{green-fg}${i + 1}.{/green-fg} ${f}`).join('\n');
    }
    
    this.filterBox.setContent(content);
  }

  updateCustomStatus(message) {
    const status = this.statusPanel.render(message, this.messages);
    this.customStatusBox.setContent(status);
  }

  formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  }

  getHelpText() {
    return `{cyan-fg}q/ESC{/cyan-fg}: Quit  {cyan-fg}c{/cyan-fg}: Clear  {cyan-fg}f{/cyan-fg}: Filter  {cyan-fg}r{/cyan-fg}: Reset Filters  {cyan-fg}p{/cyan-fg}: Pause/Resume  {cyan-fg}↑/↓{/cyan-fg}: Scroll`;
  }
}

// Start monitor
const monitor = new UDPMonitor(PORT, HOST, MAX_MESSAGES);
