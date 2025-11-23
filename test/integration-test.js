#!/usr/bin/env node

/**
 * Integration Test - Verifies all components work together
 */
import dgram from 'dgram';
import { MessageFilter } from '../lib/message-filter.js';
import { MessageHighlighter } from '../lib/message-highlighter.js';
import { StatusPanel } from '../lib/status-panel.js';

console.log('UDP Monitor Integration Test');
console.log('============================\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`✗ ${name}: ${e.message}`);
    failed++;
  }
}

// Test MessageFilter
console.log('Testing MessageFilter...');
const filter = new MessageFilter();
test('Filter creation', () => {
  if (!filter) throw new Error('Failed to create filter');
});

test('Add filter', () => {
  filter.addFilter('ERROR');
  if (filter.getFilters().length !== 1) throw new Error('Filter not added');
});

test('Match filter', () => {
  const match = filter.match('ERROR: Something went wrong', { address: '127.0.0.1', port: 1234 });
  if (!match) throw new Error('Filter should match');
});

test('Clear filters', () => {
  filter.clearFilters();
  if (filter.getFilters().length !== 0) throw new Error('Filters not cleared');
});

test('No filter matches all', () => {
  const match = filter.match('Any message', { address: '127.0.0.1', port: 1234 });
  if (!match) throw new Error('Should match when no filters');
});

// Test MessageHighlighter
console.log('\nTesting MessageHighlighter...');
const highlighter = new MessageHighlighter();
test('Highlighter creation', () => {
  if (!highlighter) throw new Error('Failed to create highlighter');
});

test('Highlight ERROR', () => {
  const result = highlighter.highlight('ERROR: test');
  if (!result.includes('red-fg')) throw new Error('ERROR not highlighted');
});

test('Highlight numbers', () => {
  const result = highlighter.highlight('Value: 123');
  if (!result.includes('magenta-fg')) throw new Error('Number not highlighted');
});

test('Highlight IP address', () => {
  const result = highlighter.highlight('IP: 192.168.1.1');
  if (!result.includes('-fg')) throw new Error('IP not highlighted');
});

test('Add custom pattern', () => {
  highlighter.addPattern(/CUSTOM/g, 'yellow');
  const result = highlighter.highlight('CUSTOM pattern');
  if (!result.includes('yellow-fg')) throw new Error('Custom pattern not applied');
});

// Test StatusPanel
console.log('\nTesting StatusPanel...');
const statusPanel = new StatusPanel();
test('StatusPanel creation', () => {
  if (!statusPanel) throw new Error('Failed to create status panel');
});

test('Default status', () => {
  const result = statusPanel.render(null, []);
  if (!result.includes('Waiting')) throw new Error('Default status incorrect');
});

test('Register plugin', () => {
  let called = false;
  statusPanel.registerPlugin(() => { called = true; return 'test'; });
  statusPanel.render({}, []);
  if (!called) throw new Error('Plugin not called');
});

test('Plugin output', () => {
  const panel = new StatusPanel();
  panel.registerPlugin(() => '{cyan-fg}Custom{/cyan-fg}');
  const result = panel.render({}, []);
  if (!result.includes('Custom')) throw new Error('Plugin output incorrect');
});

// Test UDP socket creation
console.log('\nTesting UDP socket...');
test('UDP socket creation', () => {
  const socket = dgram.createSocket('udp4');
  if (!socket) throw new Error('Failed to create UDP socket');
  socket.close();
});

test('UDP send/receive', (done) => {
  const server = dgram.createSocket('udp4');
  const client = dgram.createSocket('udp4');
  
  server.on('message', (msg) => {
    const content = msg.toString();
    server.close();
    client.close();
    if (content !== 'test') throw new Error('Message mismatch');
  });
  
  server.bind(0, () => {
    const port = server.address().port;
    const buffer = Buffer.from('test');
    client.send(buffer, port, 'localhost');
  });
});

// Summary
console.log('\n============================');
console.log(`Tests: ${passed + failed}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log('============================');

if (failed > 0) {
  console.log('\n❌ Some tests failed');
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!');
  process.exit(0);
}
