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
└── docs/              # Documentation
    ├── USER_GUIDE.md              # User guide
    ├── 03-DEVELOPER_GUIDE.md      # Developer guide
    └── ...
```

## Documentation

- [User Guide](./docs/USER_GUIDE.md) - Installation and usage guide
- [Developer Guide](./docs/DEVELOPER_GUIDE.md) - Development and contribution guide

## Contributing

We welcome contributions! Please see our [Developer Guide](./docs/DEVELOPER_GUIDE.md) for details on:

- Setting up development environment
- Code style and conventions
- Testing requirements
- Pull request process

Quick steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and add tests
4. Commit using conventional commits (`git commit -m 'feat: add amazing feature'`)
5. Push to your fork (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## License

MIT

## Publishing

For maintainers: See [PUBLISHING.md](./PUBLISHING.md) for instructions on publishing to VS Code Marketplace.

Quick release:

```bash
# Prepare release (runs tests, builds, and updates version)
./scripts/prepare-release.sh patch  # or minor, major

# Then create a GitHub Release with tag v0.x.x
# CI/CD will automatically publish to Marketplace
```
