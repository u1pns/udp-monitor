# UDP Monitor

Real-time UDP packet monitor with interactive terminal interface, filtering, and highlighting. Perfect for debugging web applications, desktop apps, and microcontroller firmware.

![UDP Monitor](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)
![Node.js](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)
![License](https://img.shields.io/badge/license-ISC-green)

## Features

- 🚀 **Real-time monitoring** - Instantly see UDP messages as they arrive
- 🎨 **Syntax highlighting** - Automatic color coding for log levels, errors, numbers, IPs, and more
- 🔍 **Advanced filtering** - Filter messages using regex patterns
- ⚡ **Error detection** - Automatically highlights error messages
- 📊 **Statistics panel** - Track message count, rate, errors, and bandwidth
- 🔌 **Pluggable status panel** - Customize status display for your protocol
- ⌨️ **Interactive UI** - Keyboard shortcuts for quick actions
- 💻 **Cross-platform** - Works on Windows, macOS, and Linux
- 🎯 **Zero configuration** - Works out of the box

## Installation

```bash
# Clone the repository
git clone https://github.com/u1pns/udp-monitor.git
cd udp-monitor

# Install dependencies
npm install

# Make executable (Linux/macOS)
chmod +x index.js

# Run
npm start
```

## Quick Start

1. **Start the monitor:**
```bash
node index.js
# or
npm start
```

2. **Send test messages:**
```bash
# In another terminal
npm test
```

3. **Send from your application:**
```javascript
import dgram from 'dgram';

const client = dgram.createSocket('udp4');
const message = Buffer.from('Hello from my app!');
client.send(message, 41234, 'localhost');
```

## Usage

### Command Line Options

```bash
node index.js [options]

Options:
  -p, --port <number>         UDP port to listen on (default: 41234)
  -h, --host <string>         Host address to bind to (default: 0.0.0.0)
  --max-messages <number>     Maximum messages to keep in memory (default: 1000)
  -V, --version              Output version number
  --help                     Display help
```

### Keyboard Shortcuts

- **q / ESC** - Quit the application
- **c** - Clear all messages
- **f** - Add a filter (regex pattern)
- **r** - Reset/clear all filters
- **p** - Pause/resume message capture
- **↑ / ↓** - Scroll through messages
- **Mouse wheel** - Scroll messages

## Examples

### Web Application Debugging

```javascript
import dgram from 'dgram';

class Logger {
  constructor() {
    this.client = dgram.createSocket('udp4');
  }

  log(level, message) {
    const msg = `[${level}] ${new Date().toISOString()} ${message}`;
    this.client.send(Buffer.from(msg), 41234, 'localhost');
  }
}

const logger = new Logger();
logger.log('INFO', 'User logged in');
logger.log('ERROR', 'Database connection failed');
```

### Microcontroller/Arduino (Conceptual)

```cpp
// Using WiFiUDP library on ESP32/Arduino
#include <WiFiUdp.h>

WiFiUDP udp;
const char* udpHost = "192.168.1.100";
const int udpPort = 41234;

void sendDebug(String message) {
  udp.beginPacket(udpHost, udpPort);
  udp.print(message);
  udp.endPacket();
}

void loop() {
  float temp = readTemperature();
  String msg = "TEMP:" + String(temp) + " STATUS:OK";
  sendDebug(msg);
  delay(1000);
}
```

### Desktop Application

```javascript
// From Electron, Tauri, or any Node.js desktop app
const dgram = require('dgram');
const client = dgram.createSocket('udp4');

function debugLog(message) {
  client.send(
    Buffer.from(message),
    41234,
    'localhost',
    (err) => err && console.error(err)
  );
}

debugLog('Window created');
debugLog('User clicked button: Save');
debugLog('File saved successfully');
```

## Advanced Features

### Custom Status Panel

Create custom status panels for your specific protocol:

```javascript
import { StatusPanel } from './lib/status-panel.js';

// Create custom plugin
function myProtocolPlugin(message, messages) {
  const data = parseMyProtocol(message.content);
  return `{cyan-fg}Device:{/cyan-fg} ${data.device}
{green-fg}Status:{/green-fg} ${data.status}
{yellow-fg}Value:{/yellow-fg} ${data.value}`;
}

// Register plugin
const statusPanel = new StatusPanel();
statusPanel.registerPlugin(myProtocolPlugin);
```

### Custom Highlighting

Add custom syntax highlighting patterns:

```javascript
import { MessageHighlighter } from './lib/message-highlighter.js';

const highlighter = new MessageHighlighter();

// Add custom pattern
highlighter.addPattern(/CUSTOM:\w+/g, 'magenta');
highlighter.addPattern(/\[IMPORTANT\]/g, 'red');
```

### Filtering

Filter messages in real-time:

1. Press **f** to open filter dialog
2. Enter a regex pattern (e.g., `ERROR|WARN` or `192\.168\.1\..*`)
3. Only matching messages will be displayed
4. Press **r** to clear all filters

## UI Layout

```
┌─────────────────────────────────┬──────────────┐
│                                 │              │
│                                 │  Statistics  │
│         Message Log             │              │
│                                 ├──────────────┤
│                                 │              │
│                                 │   Filters    │
│                                 │              │
│                                 ├──────────────┤
│                                 │              │
│                                 │    Status    │
│                                 │   (Custom)   │
│                                 │              │
├─────────────────────────────────┴──────────────┤
│               Commands / Help                  │
└────────────────────────────────────────────────┘
```

## Use Cases

- **Web Development** - Debug real-time events, API calls, and user actions
- **Microcontroller Development** - Monitor sensor data and system status
- **Distributed Systems** - Track messages across multiple services
- **Network Debugging** - Inspect UDP traffic and packets
- **IoT Applications** - Monitor device telemetry and events
- **Game Development** - Debug multiplayer game state and events

## Testing

The package includes a test sender that generates various message types:

```bash
npm test
```

This will send:
- Info, debug, warning, and error messages
- JSON formatted data
- Microcontroller-style sensor data
- HTTP request logs
- Timestamp formats
- Various error conditions

## Architecture

- **index.js** - Main application and UI
- **lib/message-filter.js** - Message filtering with regex
- **lib/message-highlighter.js** - Syntax highlighting engine
- **lib/status-panel.js** - Pluggable status panel system
- **examples/** - Example client implementations
- **test/** - Test utilities

## Dependencies

- **blessed** - Terminal UI framework
- **blessed-contrib** - Additional UI widgets
- **commander** - CLI argument parsing
- **chalk** - Terminal colors (for non-UI output)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

**Made with ❤️ for developers who need real-time insight into their applications**
