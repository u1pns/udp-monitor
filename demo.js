#!/usr/bin/env node

/**
 * Demo script - Sends a variety of messages to showcase features
 */
import dgram from 'dgram';

const PORT = 41234;
const HOST = 'localhost';
const client = dgram.createSocket('udp4');

const demoMessages = [
  '=== UDP Monitor Demo Starting ===',
  '',
  '--- Web Application Logs ---',
  '[INFO] Application server started on port 3000',
  '[DEBUG] Database connection established: mongodb://localhost:27017',
  '[WARN] High memory usage detected: 85%',
  '[ERROR] Failed to connect to cache server: redis://localhost:6379',
  '{"event":"user_login","user":"alice@example.com","timestamp":"2024-01-15T10:30:00Z","ip":"192.168.1.100"}',
  '{"event":"api_call","endpoint":"/api/users","method":"GET","status":200,"duration":"125ms"}',
  '',
  '--- IoT/Microcontroller Data ---',
  'DEVICE:ESP32-001 TEMP:22.5 HUMID:65.2 PRESS:1013 STATUS:OK',
  'DEVICE:ESP32-001 TEMP:23.1 HUMID:64.8 PRESS:1012 STATUS:OK',
  'DEVICE:ESP32-002 TEMP:25.3 HUMID:70.1 PRESS:1014 STATUS:OK',
  'DEVICE:ESP32-002 ERROR:SENSOR_TIMEOUT MSG:I2C timeout on sensor #2',
  '',
  '--- HTTP Request Logs ---',
  'GET /api/users 200 OK 45ms',
  'POST /api/login 401 Unauthorized 12ms',
  'GET /static/logo.png 200 OK 3ms',
  'POST /api/orders 201 Created 156ms',
  'DELETE /api/sessions/abc123 204 No Content 8ms',
  '',
  '--- Error Messages ---',
  'CRITICAL: Database connection pool exhausted',
  'EXCEPTION: NullPointerException at UserService.java:127',
  'FATAL: Out of memory - unable to allocate buffer',
  'PANIC: Kernel stack overflow detected',
  '',
  '--- Monitoring Data ---',
  'CPU: 45% | Memory: 2.1GB/8GB | Disk: 156GB/500GB',
  'Request rate: 450 req/s | Error rate: 2.3%',
  'Active connections: 127 | Queue depth: 23',
  '',
  '--- Timestamped Events ---',
  '2024-01-15T10:35:12.123Z User action: clicked "Save" button',
  '2024-01-15T10:35:13.456Z Payment processed: $129.99',
  '2024-01-15T10:35:14.789Z Email notification sent to user@example.com',
  '',
  '--- Network Traffic ---',
  'Packet from 192.168.1.100:52341 -> 10.0.0.5:80',
  'Connection established with https://api.example.com/v1/data',
  'UDP packet received: 1024 bytes from 10.0.0.15:41234',
  '',
  '=== Demo Complete ==='
];

let index = 0;

function sendNext() {
  if (index >= demoMessages.length) {
    console.log('\n✓ Demo complete - all messages sent');
    client.close();
    process.exit(0);
    return;
  }

  const message = demoMessages[index];
  if (message.trim() === '') {
    // Just a spacer, skip but still increment
    index++;
    setTimeout(sendNext, 100);
    return;
  }

  const buffer = Buffer.from(message);
  client.send(buffer, 0, buffer.length, PORT, HOST, (err) => {
    if (err) {
      console.error('✗ Error:', err.message);
    } else {
      console.log(`✓ Sent [${index + 1}/${demoMessages.length}]: ${message.substring(0, 60)}${message.length > 60 ? '...' : ''}`);
    }
    index++;
    setTimeout(sendNext, 500); // Wait 500ms between messages
  });
}

console.log('UDP Monitor Demo');
console.log('================');
console.log(`Sending ${demoMessages.length} demo messages to ${HOST}:${PORT}`);
console.log('Start the UDP Monitor with: node index.js\n');

setTimeout(sendNext, 1000);
