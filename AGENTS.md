# Copilot Instructions - UDP Monitor

## Project Description
This UDP monitor, built with Node.js, captures and displays messages received on UDP port 7777. It is a cross-platform debugging tool (Windows, macOS, Linux) featuring a terminal UI rendered with the `blessed` library.

## Architecture and Components

### Dependencies
- **blessed**: Terminal UI library providing windows, scrolling, colors, keyboard events, and the responsive layout.
- **dgram**: Native Node.js module for UDP sockets.
- **fs/path**: Node core modules used to load optional overrides from `config.json`.

### Interface Layout
The screen is divided into three sections:
1. **logBox**: Main log viewport (dynamic height)
2. **filterBox**: Status bar showing active filters and the current custom status panel (height: 1 line)
3. **footer**: Bottom bar with keyboard shortcuts (height: 1 line)

### Core Features

#### 1. UDP Message Capture
- Default port: **7777**
- UDP server listens continuously
- Messages are stored in the `allMessages[]` array
- Automatic cleanup when MAX_LINES (10,000) is exceeded

#### 2. Filtering System (Key 'F')
- Filter messages using regular expressions
- Case-insensitive matching
- `currentFilter` stores the active pattern

#### 3. Highlight System (Key 'H')
- Highlights messages that match a regex pattern
- Highlighted lines appear in bold yellow
- `currentHighlight` stores the active pattern

#### 4. Style Rules (STYLE_RULES)
- Extensible styling rule set
- Current rules:
  - `caught|catch`: Bright red in bold (`{bold}{light-red-fg}`)
  - `error`: Red (`{bold}{red-fg}`)
  - `RuleLogText`: Bright cyan in bold (`{bold}{light-cyan-fg}`)
- Rules are evaluated in order; the first match wins

#### 5. Custom Status Detection
`customize.js` exports a `createCustomStatus()` factory that returns two hooks:
- `detectStatus(message)`: analyze each incoming message and update internal state variables
- `getStatusLights()`: describe the labels, colors, and active/inactive state of the buttons rendered on the right side of the status bar

The sample implementation ships with simple regex-based thresholds, but you can swap in any logic by editing `customize.js` without touching the UI shell.

#### 6. Scroll Control
- **Auto-scroll** temporarily pauses while the user scrolls manually
- **DelayScroll**: 20-second timer to re-enable auto-scroll
- **End** key: re-enables auto-scroll immediately
- Navigation: Arrow keys, PageUp/PageDown, Home, End

### Keyboard Shortcuts
- **Ctrl+C**: Exit the application
- **F**: Open filter dialog
- **H**: Open highlight dialog
- **R**: Full reset (clears logs, filters, highlights)
- **Up/Down**: Scroll line by line
- **PageUp/PageDown**: Scroll half a page
- **Home**: Jump to the beginning
- **End**: Jump to the end and re-enable auto-scroll

### Memory Management
- **MAX_LINES**: 10,000 lines kept in memory (configurable)
- **RECYCLE_LINES**: 2,000 lines removed when the limit is reached (configurable)
- Recycle notification: `[RECYCLED]: first 2000 lines deleted`

### Rendering and Updates
- **Repaint()**: Runs every 200 ms to refresh the log
- **PaintStatus()**: Runs every second to refresh the status bar
- **applyFilter()**: Applies filters, highlights, and style rules before rendering
- **screen.on('resize')**: Reacts to window or font-size changes and resizes boxes accordingly

### Customization (customize.js)
- Hosts all domain-specific logic for status detection and button rendering.
- Exports `createCustomStatus()`; `index.js` wires it into the UI and provides the paint helpers.
- Replace the default factory with logic tailored to your own agent (e.g., different regexes, button names, or severity rules) while reusing the rest of the UI as-is.

### Configuration (config.json)
- JSON file located at the project root.
- Supported keys:
  - `port`: UDP listening port (7777 by default)
  - `maxLines`: Maximum lines kept in memory
  - `recycleLines`: Lines removed when recycling
  - `styleRules`: Array of `{pattern, style}` objects overriding default styles
- The app loads `config.json` when available; otherwise, it falls back to `defaultConfig` in `index.js`.

## Cross-Platform Launchers

### Windows
- **File**: `udpmonitor.bat`
- **Content**: Runs `node index.js`

### macOS/Linux
- **File**: `UDPMonitor` (extensionless bash script)
- **Content**: Resolves the script directory and runs `node index.js`
- **Usage**: `./UDPMonitor`

## Coding Conventions
- Use `blessed.box()` to build UI elements
- Blessed formatting tags: `{bold}`, `{red-fg}`, `{yellow-fg}`, etc.
- Global variables in camelCase: `currentFilter`, `allMessages`, `DelayScroll`
- Uppercase constants derived from `config.json`: `PORT`, `MAX_LINES`, `STYLE_RULES`
- Functions in PascalCase: `PaintButton()`, `PaintStatus()`, `applyFilter()`, `Repaint()`
- Keep function-level header comments descriptive; they explain intent for the buttons, status bar, filter pipeline, and repaint loop.

## Development Considerations
1. **Regular Expressions**: Filters and highlights rely on case-insensitive RegExp
2. **Performance**: Rendering work is minimized by repainting only on changes
3. **Responsive UI**: Layout adjusts automatically when the terminal is resized
4. **Persistent State**: Filters and highlights stay active until manually reset
5. **Documentation alignment**: README includes a real-time debugging use case and a dependencies list; mirror those sections when making feature changes.
6. **Comment consistency**: `index.js` documents the default config, UI boxes, and helper functions via English block comments—maintain or extend those explanations when editing nearby code.

## Agent Playbook
1. **Config-first debugging**: changes to limits, ports, or style rules should go through `config.json`; document any new keys in both README and AGENTS.
2. **UI consistency**: when editing layout logic (`logBox`, `filterBox`, `footer`), mirror the explanation in the README "Interface" diagram.
3. **Status customization**: `customize.js` is the sanctioned extension point; new status logic should stay there so `index.js` remains generic.
4. **Docs alignment**: whenever README sections such as Description, Requirements/Dependencies, or Customization change, update this file's corresponding sections immediately instead of keeping a change log.
5. **Testing**: there is no automated test suite; validate changes manually by running `node index.js` and sending UDP packets (see README "Sending Test Messages").

## Licensing
- The repository ships under the MIT License (`LICENSE`). Keep the notice intact when redistributing binaries or source.
- When adding dependencies, confirm their licenses are compatible with MIT and update README/AGENTS if any attribution is required.

## Customization Ideas
- Build traffic lights for any UDP-emitting service by tweaking the regexes in `customize.js`.
- Layer extra style rules in `config.json` to color-code product-specific message formats.
- Use the filter/highlight shortcuts to focus on the parts of the stream that matter for your agent.
