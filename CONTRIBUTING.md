# Contributing to UDP Monitor

Thank you for your interest in contributing to UDP Monitor! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/udp-monitor.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Install dependencies: `npm install`

## Development

### Project Structure

```
udp-monitor/
├── index.js                 # Main application
├── lib/                     # Core libraries
│   ├── message-filter.js    # Message filtering
│   ├── message-highlighter.js # Syntax highlighting
│   └── status-panel.js      # Status panel system
├── examples/                # Example clients
├── test/                    # Test utilities
└── README.md
```

### Running the Monitor

```bash
node index.js
```

### Testing

```bash
# Run test sender
npm test

# Run specific example
node examples/web-app-client.js
node examples/microcontroller-client.js
```

## Making Changes

### Code Style

- Use ES6+ features (import/export, arrow functions, etc.)
- Use 2 spaces for indentation
- Add comments for complex logic
- Keep functions focused and small

### Commits

- Write clear, descriptive commit messages
- Use present tense ("Add feature" not "Added feature")
- Reference issues when applicable

### Features to Contribute

Ideas for contributions:

- Additional highlighting patterns
- New status panel plugins
- Performance improvements
- Additional filter capabilities
- Export/save functionality
- Statistics graphs
- Custom themes
- Protocol parsers
- Documentation improvements

## Submitting Changes

1. Ensure your code works correctly
2. Test with the included test utilities
3. Update documentation if needed
4. Commit your changes
5. Push to your fork
6. Create a Pull Request

## Pull Request Guidelines

- Describe what your PR does
- Reference any related issues
- Include examples if adding new features
- Ensure all existing functionality still works

## Questions?

Open an issue for:
- Bug reports
- Feature requests
- Questions about usage
- Discussion about changes

## License

By contributing, you agree that your contributions will be licensed under the ISC License.
