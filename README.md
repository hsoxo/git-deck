# Git GUI for VS Code

A visual Git management tool deeply integrated into VS Code, providing a graphical operation experience similar to Fork/GitKraken.

## Features

- 📊 **Visual Commit History** - Graphical display of commit tree and branch relationships
- 🎯 **Stage & Commit Management** - Intuitive file staging and committing
    - ✅ Drag and drop support (planned)
    - ✅ Diff preview on double-click
    - ✅ Discard changes
    - ✅ Amend last commit
- 🔄 **Rebase Operations** - Visual rebase with conflict handling
- 🍒 **Cherry-pick** - Easy commit cherry-picking across branches
- ↩️ **Revert** - Safe commit reverting with confirmation dialog
- 💾 **Stash Management** - Create, apply, and manage stashes
- 🌿 **Branch Operations** - Create, switch, and manage branches
- 🌐 **Remote Operations** - Fetch, pull, and push to remote repositories (SSH/HTTPS)
- 🔍 **Diff Viewer** - Syntax-highlighted diff display
    - View unstaged/staged changes
    - Double-click files to preview
    - Color-coded additions/deletions
- 🖥️ **Remote Development** - Full support for VS Code Remote-SSH
    - Works seamlessly in remote environments
    - All Git operations execute on remote server
    - Same experience as local development

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Start development
npm run dev:extension  # Terminal 1
npm run dev:webview    # Terminal 2

# Press F5 in VS Code to launch extension
```

### Remote-SSH Development

The extension fully supports VS Code Remote-SSH:

1. Install the extension locally
2. Connect to remote server via Remote-SSH
3. Open a Git repository on the remote server
4. Extension automatically installs and runs on remote

See [Remote SSH Support Guide](./docs/07-REMOTE_SSH_SUPPORT.md) for details.

## Development

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- VS Code >= 1.80.0

### Setup

```bash
# Install dependencies
npm install

# Start development mode
npm run dev:extension  # Terminal 1
npm run dev:webview    # Terminal 2
```

### Testing

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e
```

## Project Structure

```
git-gui-vscode/
├── packages/
│   ├── extension/      # VS Code Extension (Backend)
│   │   ├── src/
│   │   │   ├── git/           # Git operations
│   │   │   ├── rpc/           # RPC server
│   │   │   └── webview/       # Webview provider
│   │   └── package.json
│   ├── webview/        # React UI (Frontend)
│   │   ├── src/
│   │   │   ├── components/    # React components
│   │   │   ├── store/         # Zustand state
│   │   │   └── services/      # RPC client
│   │   └── package.json
│   └── shared/         # Shared types and utilities
│       └── src/types.ts
├── tests/
│   ├── integration/    # Integration tests
│   └── e2e/           # End-to-end tests
└── docs/              # Documentation
```

See [File Structure](./docs/FILE_STRUCTURE.md) for complete file listing.

## Documentation

### Getting Started

- [Quick Start Guide](./docs/QUICK_START.md) - 5-minute quick start
- [Development Guide](./docs/DEVELOPMENT.md) - Complete development guide

### Technical Documentation

- [Architecture](./docs/ARCHITECTURE.md) - System architecture and design
- [Testing Guide](./docs/TESTING.md) - Testing strategy and guidelines

### Project Documentation

- [需求文档](./docs/需求文档.md) - Detailed requirements (Chinese)
- [技术实现计划](./docs/技术实现计划.md) - Technical implementation plan (Chinese)
- [Project Progress](./docs/PROJECT_PROGRESS.md) - Project progress tracking
- [Project Summary](./docs/PROJECT_SUMMARY.md) - Project summary (Chinese)

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Quick Contribution Steps

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and add tests
4. Commit using conventional commits (`git commit -m 'feat: add amazing feature'`)
5. Push to your fork (`git push origin feature/amazing-feature`)
6. Open a Pull Request

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

## License

MIT
