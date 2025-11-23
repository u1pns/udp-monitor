#!/usr/bin/env node

/**
 * Test UDP sender - Sends various test messages to the UDP monitor
 */
import dgram from 'dgram';

const PORT = 41234;
const HOST = 'localhost';
const client = dgram.createSocket('udp4');

const testMessages = [
  'INFO: Application started successfully',
  'DEBUG: Processing request from 192.168.1.100',
  'ERROR: Connection timeout after 30 seconds',
  'WARN: Memory usage at 85%',
  '{"event":"user_login","user":"john","timestamp":"2024-01-15T10:30:00Z"}',
  'TEMP:23.5 HUMID:65.2 STATUS:OK',
  'Request completed in 125ms',
  'CRITICAL: Database connection failed',
  'SUCCESS: File uploaded: document.pdf (2.5MB)',
  '[2024-01-15 10:30:45] User action: clicked button',
  'HTTP 200 GET /api/users 45ms',
  'EXCEPTION: NullPointerException at line 127',
  'Processing queue: 150 items remaining',
  'FATAL: Out of memory',
  'Sensor reading: temperature=25.5°C pressure=1013hPa'
];

let messageIndex = 0;
let interval;

function sendMessage() {
  const message = testMessages[messageIndex % testMessages.length];
  const buffer = Buffer.from(message);
  
  client.send(buffer, 0, buffer.length, PORT, HOST, (err) => {
    if (err) {
      console.error('Error sending message:', err);
    } else {
      console.log(`Sent: ${message}`);
    }
  });
  
  messageIndex++;
}

console.log(`Sending test messages to ${HOST}:${PORT}`);
console.log('Press Ctrl+C to stop\n');

// Send initial message
sendMessage();

// Send a message every 2 seconds
interval = setInterval(sendMessage, 2000);

// Handle clean shutdown
process.on('SIGINT', () => {
  console.log('\nStopping test sender...');
  clearInterval(interval);
  client.close();
  process.exit(0);
});
