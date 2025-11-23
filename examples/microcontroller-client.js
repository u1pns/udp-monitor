/**
 * Example: Microcontroller Debug Client (Arduino-style)
 * 
 * This simulates how an Arduino or ESP32 might send debug data.
 * In actual firmware, you'd use the WiFiUdp library.
 */
import dgram from 'dgram';

class MicrocontrollerSimulator {
  constructor(host = 'localhost', port = 41234) {
    this.host = host;
    this.port = port;
    this.client = dgram.createSocket('udp4');
    this.deviceId = 'ESP32-001';
  }

  /**
   * Send sensor data
   */
  sendSensorData(temperature, humidity, pressure) {
    const message = `DEVICE:${this.deviceId} TEMP:${temperature.toFixed(1)} HUMID:${humidity.toFixed(1)} PRESS:${pressure.toFixed(0)} STATUS:OK`;
    this.send(message);
  }

  /**
   * Send status message
   */
  sendStatus(status, details = '') {
    const message = `DEVICE:${this.deviceId} STATUS:${status} ${details}`.trim();
    this.send(message);
  }

  /**
   * Send error
   */
  sendError(errorCode, message) {
    const msg = `DEVICE:${this.deviceId} ERROR:${errorCode} MSG:${message}`;
    this.send(msg);
  }

  /**
   * Send raw message
   */
  send(message) {
    const buffer = Buffer.from(message);
    this.client.send(buffer, 0, buffer.length, this.port, this.host, (err) => {
      if (err) {
        console.error('Failed to send UDP message:', err);
      }
    });
  }

  close() {
    this.client.close();
  }
}

// Simulate microcontroller behavior
const mcu = new MicrocontrollerSimulator();

console.log('Simulating microcontroller debug output...');

// Startup
mcu.sendStatus('BOOT', 'Firmware v1.2.3');

// Simulate sensor readings
let temp = 22.0;
let humid = 60.0;
let press = 1013.0;

const interval = setInterval(() => {
  // Simulate sensor variations
  temp += (Math.random() - 0.5) * 2;
  humid += (Math.random() - 0.5) * 5;
  press += (Math.random() - 0.5) * 10;
  
  // Keep in realistic ranges
  temp = Math.max(15, Math.min(35, temp));
  humid = Math.max(30, Math.min(90, humid));
  press = Math.max(990, Math.min(1030, press));
  
  mcu.sendSensorData(temp, humid, press);
  
  // Occasionally send status
  if (Math.random() > 0.8) {
    mcu.sendStatus('RUNNING', `Uptime: ${Math.floor(Date.now() / 1000)}s`);
  }
  
  // Occasionally send an error
  if (Math.random() > 0.95) {
    mcu.sendError('SENSOR_READ', 'I2C timeout on sensor #2');
  }
}, 3000);

// Handle clean shutdown
process.on('SIGINT', () => {
  console.log('\nStopping simulator...');
  clearInterval(interval);
  mcu.sendStatus('SHUTDOWN');
  setTimeout(() => {
    mcu.close();
    process.exit(0);
  }, 500);
});

export { MicrocontrollerSimulator };
