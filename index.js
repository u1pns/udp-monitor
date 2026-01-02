'use strict';
/*jshint esversion:6 */
/*jshint node:true */
/*jshint sub:true */
/*jshint loopfunc:true*/
//@ts-check


const blessed = require('blessed');
const dgram = require('dgram');
const fs = require('fs');
const path = require('path');

// Global state variables

let allMessages = []; // Stores every message to allow dynamic filtering
let userConfig = {};

// Calculate layout positions and sizes dynamically
var footerHeight = 1; // Fixed footer height
var filterBoxHeight = 1; // Fixed height for the filter bar
var logBoxHeight = 0 // Remaining height for the log view

var DelayScroll=0;

// Manage filters, highlights, and scroll delay tracking
let currentFilter = null; // Stores the current filter regex
let currentHighlight = null; // Stores the current highlight regex

var iLastLength=0;

// Default configuration fallback used when config.json is missing
const defaultConfig = {
    port: 7777,
    maxLines: 10000,
    recycleLines: 2000,
    styleRules: [
        { pattern: "caught|catch", style: "{bold}{light-red-fg}" },
        { pattern: "error", style: "{bold}{red-fg}" },
    ]
};

// Load user configuration from config.json if available
const configPath = path.join(__dirname, 'config.json');
try {
    if (fs.existsSync(configPath)) {
        const raw = fs.readFileSync(configPath, 'utf8');
        if (raw.trim().length) {
            userConfig = JSON.parse(raw);
        }
    }
 } catch (error) {
    console.error('Could not read config.json, using defaults:', error);
}

// Set style rules and other configurations
const STYLE_RULES = Array.isArray(userConfig.styleRules) && userConfig.styleRules.length
    ? userConfig.styleRules
    : defaultConfig.styleRules;

// Pre-compile Regex objects to avoid performance issues in the render loop
const COMPILED_STYLE_RULES = STYLE_RULES.map(rule => ({
    ...rule,
    regex: new RegExp(rule.pattern, 'i')
}));

const PORT = userConfig.port ?? defaultConfig.port;
const MAX_LINES = userConfig.maxLines ?? defaultConfig.maxLines; // Maximum number of log lines kept in memory
const RECYCLE_LINES = userConfig.recycleLines ?? defaultConfig.recycleLines; // Number of lines removed when recycling

// Initial configuration for the full-screen blessed UI
const screen = blessed.screen({
    smartCSR: true,
    title: 'UDP Logger'
});

// Update logBoxHeight based on current screen size
logBoxHeight = screen.height - footerHeight - filterBoxHeight;

// Main log viewport box with scrolling enabled
const logBox = blessed.box({
    top: 0,
    left: 0,
    width: '100%',
    height: logBoxHeight, // Computed height
    content: 'Waiting for messages...',
    scrollable: true,
    alwaysScroll: true,
    tags: true,
    border: { type: 'line'},
    style: { fg: 'white', bg: 'black', border: { fg: '#f0f0f0' }}
    });

// Status bar showing active filters and the custom status panel
const filterBox = blessed.box({
    top: logBoxHeight, // Right below logBox
    left: 0,
    width: '100%',
    height: filterBoxHeight, // Fixed height
    content: '-',
    tags: true,
    style: { fg: 'white', bg: 'black', border: { fg: '#f0f0f0' }}
});

// Bottom bar listing the available keyboard shortcuts
const footer = blessed.box({
    top: logBoxHeight + filterBoxHeight, // Directly below filterBox
    left: 0,
    width: '100%',
    height: footerHeight, // Fixed height
    content: 'Ctrl+C to exit | F to filter | H to highlight | R for reset',
    style: {  fg: 'white', bg: 'blue' }
});

// Append all UI elements to the screen
screen.append(logBox);
screen.append(filterBox);
screen.append(footer);


/**
 * Formats a status button label using blessed tags so the UI can show
 * active buttons with blue backgrounds and inactive ones in gray.
 */
function PaintButton(text, bIsOn)
{
    if (bIsOn) return `{bold}{white-fg}{blue-bg}${text}{/}`;
    else return `{bold}{gray-fg}${text}{/}`;
}

// Custom status lights integration (comment next 2 lines if needed)
const createCustomStatus = require('./customize');
const { getStatusLights, detectStatus } = createCustomStatus(PaintButton);


/**
 * Renders the status bar with filter/highlight information, auto-scroll
 * countdowns, and any custom status lights provided by customize.js.
 */
function PaintStatus()
{
    var status = "";
    if (currentFilter!=null) status += `Filter: {bold}${currentFilter}{/bold}`;
    else status += 'Filter: inactive';

    status += " | ";

    if (currentHighlight!=null) status += `Highlight: {bold}${currentHighlight}{/bold}`;
    else status += 'Highligh: inactive';

    if (DelayScroll>0) status += ` | AutoScroll in: {bold}${DelayScroll}{/bold} sec. (press 'end' to autoscroll)`;

    var buttons = getStatusLights();
    status += `{|} | ${buttons}`;

    filterBox.setContent(status);
}



// Highlight handling

// Function that applies filter and highlight rules
/**
 * Refreshes the log viewport by recycling old entries, applying filters,
 * enforcing highlight/style rules, and keeping the scroll position synced.
 */
const applyFilter = () => {


    if (allMessages.length > MAX_LINES) {
        allMessages = allMessages.slice(RECYCLE_LINES); // Drop the oldest entries
        allMessages.unshift(`[RECYCLED]: first ${RECYCLE_LINES} lines deleted`); // Recycling notice
    }

    let messagesToDisplay = allMessages;

    // Apply filter when active
    if (currentFilter) {
        const regex = new RegExp(currentFilter, 'i'); // Ignore case
        messagesToDisplay = messagesToDisplay.filter(msg => regex.test(msg));
    }

    // Apply highlight rules
    const regexHighlight = currentHighlight ? new RegExp(currentHighlight, 'i') : null;
    
    const styledMessages = messagesToDisplay.map(msg => {
        // Priority 1: User-defined Highlight (Yellow)
        // If the user is searching for something, it should pop out even if it's an error.
        if (regexHighlight && regexHighlight.test(msg)) {
            return `{bold}{yellow-fg}${msg}{/yellow-fg}{/bold}`;
        }

        // Priority 2: Predefined Style Rules
        for (const rule of COMPILED_STYLE_RULES) {
            if (rule.regex.test(msg)) {
                return `${rule.style}${msg}{/}`;
            }
        }

        return msg;
    });


    logBox.setContent(styledMessages.join('\n')); // Update log content
    if (DelayScroll==0) logBox.setScrollPerc(100); // Force scroll to the bottom
    screen.render();
};

// Handle key bindings
screen.key(['C-c'], () => process.exit(0)); // Ctrl+C to quit
screen.key(['f'], () => {
    const promptBox = blessed.prompt({
        parent: screen,
        border: 'line',
        top: 'center',
        left: 'center',
        width: '50%',
        height: 8,
        label: 'Filter menssages',
        tags: true,
        keys: true,
        vi: true,
        style: { fg: 'white', bg: 'black', border: { fg: '#f0f0f0' }}    
    });

    // Prompt user for filter expression
    promptBox.readInput(
        `Enter expression to filter ${currentFilter ? `(current: ${currentFilter})` : ''}: `,
        '',
        (err, value) => {
            if (value) currentFilter = value.trim();
            else currentFilter = null;
            PaintStatus();
            applyFilter();
        }
    );
    // Render the prompt box
    screen.render();
});

// Highlight key binding
screen.key(['h'], () => {
    const promptBox = blessed.prompt({
        parent: screen,
        border: 'line',
        top: 'center',
        left: 'center',
        width: '50%',
        height: 8,
        label: 'Highlight menssages',
        tags: true,
        keys: true,
        vi: true,
        style: { fg: 'white', bg: 'black', border: { fg: '#f0f0f0' }}    
    });

    // Prompt user for highlight expression
    promptBox.readInput(
        `Enter expression to highlight ${currentHighlight ? `(current: ${currentHighlight})` : ''}: `,
        '',
        (err, value) => {
            if (value) currentHighlight = value.trim();
            else currentHighlight = null;
            PaintStatus();
            applyFilter();
        }
    );
    // Render the prompt box
    screen.render();
});

// Reset key binding
screen.key(['r'], () => {
    allMessages = [];
    currentFilter = null;
    currentHighlight = null;
    logBox.setContent('Logs cleaned');
    filterBox.setContent('Filter: Inactive');
    screen.render();
});

// Handle scrolling inside logBox
screen.key(['up', 'down', 'pageup', 'pagedown', 'left','right', 'end','home'], (ch, key) => {
    const step = 1; // Lines to move with arrow keys
    const pageStep = Math.floor(logBox.height / 2); // Lines to move with PageUp/PageDown
    DelayScroll = 20;

    switch (key.name) {
        case 'up':
            logBox.scroll(-step); // Scroll up
            break;
        case 'home':
            logBox.scrollTo(0); // Jump to the top
            break;
        case 'end':
            logBox.setScrollPerc(100);
            DelayScroll = 1;
            break;
        case 'down':
            logBox.scroll(step); // Scroll down
            break;
        case 'pageup':
            logBox.scroll(-pageStep); // Scroll half-page up
            break;
        case 'pagedown':
            logBox.scroll(pageStep); // Scroll half-page down
            break;
    }
    PaintStatus();
    screen.render(); // Refresh the screen after scrolling
});

// Start a UDP server to receive messages
const server = dgram.createSocket('udp4');

// Handle incoming UDP messages
server.on('message', (msg, rinfo) => {
    var message = `${msg}`;
    detectStatus(message);
    // Strip trailing newline for messages longer than 4 chars
    if ((message.length>4) && (message[message.length-1]=='\n')) message = message.slice(0, -1);
    allMessages.push(message);
    //applyFilter();
});

// Handle resize events to adjust layout
screen.on('resize', () => {
    const newHeight = screen.height;
    const footerHeight = 1;
    const filterBoxHeight = 1;
    const logBoxHeight = newHeight - footerHeight - filterBoxHeight;

    logBox.height = logBoxHeight;
    filterBox.top = logBoxHeight;
    footer.top = logBoxHeight + filterBoxHeight;

    screen.render(); // Refresh sizes after resize
});

// Start listening on the specified UDP port
server.bind(PORT, () => {
    allMessages.push('Running and listening on UDP port ' + PORT);
    applyFilter();
});

/**
 * Avoids unnecessary redraws by re-applying filters only when new messages
 * arrive, keeping the UI responsive even under heavy traffic.
 */
function Repaint()
{
    if (iLastLength==allMessages.length) return; // No repaint needed
    iLastLength = allMessages.length;
    applyFilter();
}

// Periodic tasks: status repaint and auto-scroll countdown
setInterval(() => {  PaintStatus(); if (DelayScroll>0) { DelayScroll--; }}, 1000);
setInterval(() => {  Repaint() }, 200);

// Render the initial screen
screen.render();