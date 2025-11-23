/**
 * Example: Web Application Debug Client
 * 
 * This example shows how to send debug messages from a web application
 * (or any Node.js application) to the UDP monitor.
 */
import dgram from 'dgram';

class UDPDebugger {
  constructor(host = 'localhost', port = 41234) {
    this.host = host;
    this.port = port;
    this.client = dgram.createSocket('udp4');
  }

  /**
   * Send a debug message
   * @param {string} level - Log level (INFO, DEBUG, WARN, ERROR)
   * @param {string} message - Message content
   * @param {object} data - Optional data object
   */
  log(level, message, data = null) {
    let content = `[${level}] ${message}`;
    
    if (data) {
      content += ` | ${JSON.stringify(data)}`;
    }
    
    this.send(content);
  }

  info(message, data) {
    this.log('INFO', message, data);
  }

  debug(message, data) {
    this.log('DEBUG', message, data);
  }

  warn(message, data) {
    this.log('WARN', message, data);
  }

  error(message, data) {
    this.log('ERROR', message, data);
  }

  /**
   * Send a raw message
   * @param {string} message - Message content
   */
  send(message) {
    const buffer = Buffer.from(message);
    this.client.send(buffer, 0, buffer.length, this.port, this.host, (err) => {
      if (err) {
        console.error('Failed to send UDP debug message:', err);
      }
    });
  }

  /**
   * Close the UDP client
   */
  close() {
    this.client.close();
  }
}

// Example usage
const udpDebugger = new UDPDebugger();

// Send various debug messages
udpDebugger.info('Application started');
udpDebugger.debug('User login attempt', { username: 'john.doe', ip: '192.168.1.100' });
udpDebugger.warn('High memory usage detected', { usage: '85%', threshold: '80%' });
udpDebugger.error('Database connection failed', { error: 'ETIMEDOUT', retries: 3 });

// Simulate application events
setTimeout(() => {
  udpDebugger.info('Processing request', { endpoint: '/api/users', method: 'GET' });
}, 1000);

setTimeout(() => {
  udpDebugger.info('Request completed', { status: 200, duration: '125ms' });
}, 2000);

setTimeout(() => {
  udpDebugger.close();
  console.log('Debug client closed');
}, 3000);

export { UDPDebugger };
