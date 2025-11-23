# UDP Monitor

Cross-platform UDP monitor for debugging with an interactive terminal UI.

## Description

UDP Monitor listens for UDP messages on UDP port (7777 by default) and displays them in an interactive terminal interface. It works on Windows, macOS, and Linux, offering advanced filtering, highlighting, error detection, and a pluggable status panel you can tailor to your own protocol.

Web applications, desktop apps, microcontroller firmware—sooner or later you need real-time insight into what they’re doing. Fire off UDP debug packets (port 7777 by default) from any of those targets and instantly see what’s happening inside. Launch this monitor on Windows, macOS, or Linux to visualize your UDP messages the moment they’re emitted.

## Features

- 🔌 **UDP Listener**: Captures amd displays UDP messages
- 🔍 **Dynamic Filtering**: Filter logs with regular expressions
- 🎨 **Text Highlighting**: Emphasize important lines with colors
- ⚠️ **Automatic Error Detection**: Highlights error lines in red
- 📊 **Custom Status Panel**: Visual buttons driven by `customize.js`
- 🔄 **Smart Auto-Scroll**: Auto-scroll pauses while you navigate manually
- 💾 **Memory Management**: Keeps up to 10,000 lines
- 🖥️ **Cross-Platform**: Runs on Windows, macOS, and Linux
- ⚡ **Responsive UI**: Adapts to the terminal size

## Requirements

- Node.js (v12 or newer)
- npm

### Dependencies

- [`blessed`](https://github.com/chjj/blessed): renders the terminal UI (log viewport, status bar, footer)
- [`dgram`](https://nodejs.org/api/dgram.html) (Node core module): receives UDP packets
- [`fs` / `path`](https://nodejs.org/api/fs.html): load `config.json` overrides at startup

## Installation

```bash
# Clone or download the project
cd UDPMonitor

# Install dependencies
npm install
```

## Usage

### Windows

```cmd
udpmonitor.bat
```

### macOS/Linux

```bash
chmod +x UDPMonitor
./UDPMonitor
```

### Using Node directly

```bash
node index.js
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `F` | Open the filter dialog |
| `H` | Open the highlight dialog |
| `R` | Full reset (clears logs, filters, highlights) |
| `↑` / `↓` | Scroll line by line |
| `Page Up` / `Page Down` | Scroll half a page |
| `Home` | Jump to the beginning |
| `End` | Jump to the end and restore auto-scroll |
| `Ctrl+C` | Exit the application |

## Interface

The screen is divided into three sections:

```
┌─────────────────────────────────────┐
│                                     │
│              LOG AREA               │
│           (UDP messages)            │
│                                     │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ Filter: active | Highlight: active  │ <- Status bar
│ AutoScroll: 15 sec | [ACTIVE] ...   │
└─────────────────────────────────────┘
  Ctrl+C to exit | F to filter | ...     <- Footer/help bar
```

## Advanced Features

### Message Filtering

1. Press `F`
2. Enter a regular expression (e.g., `error`, `user.*login`, etc.)
3. Only matching messages remain visible
4. Press `F` and submit nothing to disable

### Message Highlighting

1. Press `H`
2. Enter a regular expression
3. Matching lines are shown in **bold yellow**
4. Submit empty to clear the highlight

### Automatic Error and Style Detection

The system applies predefined style rules:

- **Critical Errors**: Words `caught` or `catch` → **Bright red (bold)**
- **Errors**: Word `error` → **Intense red**
- **Rule Logs**: Word `RuleLogText` → **Bright cyan (bold)**

These rules live in the `STYLE_RULES` constant inside `index.js`.

### Custom Status Panel

The right side of the status bar renders status buttons controlled by `customize.js`. The default implementation exposes four slots (ACTIVE, INTER, NONE, IDLE) and updates them based on regexes in `detectStatus()`. You can freely change the labels, number of states, or detection logic inside `customize.js` without touching the core UI.

### Auto-Scroll Control

- Auto-scroll is enabled by default
- Manual navigation (arrows, PageUp/PageDown) pauses it for 20 seconds
- The status bar displays the remaining pause
- Press `End` to resume immediately

### Responsive Layout

- The app listens for terminal resize events (window or font size changes)
- When the terminal dimensions change, log/status/footer boxes recalculate their size
- No restart is required; the interface adjusts in real time

## Configuration

All parameters live in `config.json` (root folder). Example:

```json
{
  "port": 7777,
  "maxLines": 10000,
  "recycleLines": 2000,
  "styleRules": [
    { "pattern": "caught|catch", "style": "{bold}{light-red-fg}" },
    { "pattern": "error", "style": "{bold}{red-fg}" },
    { "pattern": "MotionDetected", "style": "{bold}{light-cyan-fg}" }
  ]
}
```

If the file is missing or incomplete, defaults from `index.js` are used.

## Customization

- The `customize.js` module exposes `getStatusLights` and `detectStatus`, initialized from `index.js` by passing `PaintButton`.
- Its default implementation parses status hints from the logs, but you can replace its logic to reflect any state machine you like.
- Combine `customize.js` with `config.json` (for ports, memory limits, styles) to tailor the monitor to new agents without modifying the UI layer.

## Sending Test Messages

You can send UDP packets from another tool or via these commands:

### Windows (PowerShell)

```powershell
$UdpClient = New-Object System.Net.Sockets.UdpClient
$bytes = [System.Text.Encoding]::UTF8.GetBytes("Test message")
$UdpClient.Send($bytes, $bytes.Length, "localhost", 7777)
$UdpClient.Close()
```

### macOS/Linux

```bash
echo "Test message" | nc -u -w1 localhost 7777
```

### Node.js

```javascript
const dgram = require('dgram');
const client = dgram.createSocket('udp4');
const message = Buffer.from('Test message');
client.send(message, 7777, 'localhost', (err) => {
    client.close();
});
```

## Technologies

- **Node.js**: JavaScript runtime
- **blessed**: Terminal UI library
- **dgram**: Native Node.js UDP module

## Project Structure

```
UDPMonitor/
├── index.js           # Main application code
├── customize.js       # Custom status hooks
├── package.json       # npm config and dependencies
├── udpmonitor.bat     # Windows launcher
├── udpmonitor         # macOS/Linux launcher
├── README.md          # Project documentation
└── LICENSE            # MIT license text
```

## Author

- **U1PNS** – reachable via [GitHub](https://github.com/u1pns). If you extend or improve the monitor, please open an issue or pull request so others can benefit too.

## License

This project is released under the [MIT License](./LICENSE). You’re free to use it in personal or commercial projects, provided you include the original license notice.

## Limitations

- Single UDP port (7777 by default)
- Stores up to 10,000 log lines (configurable)
- Filters/highlights rely on case-insensitive regex

## Troubleshooting

### Port 7777 is busy

Update `PORT` (or `config.json`) and restart the app.

### No messages arrive

1. Ensure the sender points to `localhost:7777`
2. Check firewalls
3. Confirm the UDP port is available

### UI looks incorrect

- Use a terminal that supports ANSI colors
- Increase terminal window size
- On Windows, prefer Windows Terminal or modern PowerShell

