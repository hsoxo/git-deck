# Deployment & Installation Guide

Complete guide for building, packaging, and installing the Git Deck VS Code extension.

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- VS Code >= 1.80.0

## Quick Install (For Users)

### Option 1: Install from VSIX File

1. Download the `.vsix` file from releases
2. Open VS Code
3. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
4. Type "Extensions: Install from VSIX"
5. Select the downloaded `.vsix` file
6. Reload VS Code when prompted

### Option 2: Install from VS Code Marketplace

*Coming soon - extension will be published to the marketplace*

## Build from Source (For Developers)

### Step 1: Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/yourusername/git-deck.git
cd git-deck

# Install dependencies
npm install
```

### Step 2: Build the Extension

```bash
# Build all packages (extension + webview)
npm run build
```

This will:
- Compile TypeScript to JavaScript
- Bundle the webview with Vite
- Generate source maps
- Output to `packages/extension/dist` and `packages/webview/dist`

### Step 3: Package as VSIX

```bash
# Install vsce (VS Code Extension CLI) if not already installed
npm install -g @vscode/vsce

# Package the extension
cd packages/extension
vsce package
```

This creates a `.vsix` file (e.g., `git-deck-0.1.0.vsix`) in the `packages/extension` directory.

### Step 4: Install the VSIX

```bash
# Install via command line
code --install-extension git-deck-0.1.0.vsix

# Or use VS Code UI (see Quick Install above)
```

## Development Workflow

### Running in Development Mode

```bash
# Terminal 1: Watch extension changes
npm run dev:extension

# Terminal 2: Watch webview changes
npm run dev:webview

# Press F5 in VS Code to launch Extension Development Host
```

### Testing Before Packaging

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only
npm run test:e2e           # E2E tests only

# Run linter
npm run lint

# Run full quality gate
npm run lint && npm run test:all && npm run build
```

## Configuration

### Extension Settings

After installation, configure the extension in VS Code settings:

```json
{
  "gitDeck.autoRefresh": true,
  "gitDeck.commitGraph.maxCommits": 1000,
  "gitDeck.security.enableRateLimit": true,
  "gitDeck.security.enableValidation": true
}
```

### Security Settings

The extension includes built-in security features:

- **Rate Limiting**: Prevents RPC abuse (default: 100 requests/minute)
- **Input Validation**: Prevents path traversal and command injection
- **Parameter Validation**: Schema-based validation for all RPC calls

To disable security features (not recommended):

```json
{
  "gitDeck.security.enableRateLimit": false,
  "gitDeck.security.enableValidation": false
}
```

## Usage

### Opening Git Deck

1. Open a Git repository in VS Code
2. Click the Git Deck icon in the Activity Bar (left sidebar)
3. Or use Command Palette: `Git Deck: Open`

### Basic Operations

- **View Commits**: Commit history displays automatically
- **Stage Files**: Click files in the Changes panel
- **Commit**: Enter message and click Commit button
- **Create Branch**: Right-click commit → Create Branch
- **Merge**: Right-click branch → Merge
- **Rebase**: Right-click commit → Rebase
- **Cherry-pick**: Right-click commit → Cherry-pick
- **Stash**: Click Stash button in Changes panel

## Troubleshooting

### Extension Not Loading

**Symptom**: Git Deck icon doesn't appear or panel is blank

**Solutions**:
1. Check VS Code version: `code --version` (must be >= 1.80.0)
2. Reload VS Code: `Ctrl+Shift+P` → "Developer: Reload Window"
3. Check extension is enabled: Extensions panel → Git Deck → Enable
4. Check Output panel: View → Output → Select "Git Deck" from dropdown

### Git Operations Failing

**Symptom**: Operations like commit, merge, rebase fail with errors

**Solutions**:
1. Verify Git is installed: `git --version`
2. Check repository is valid: Open terminal in repo, run `git status`
3. Check Git credentials are configured:
   ```bash
   git config user.name
   git config user.email
   ```
4. Check Output panel for detailed error messages

### Performance Issues

**Symptom**: Extension is slow or unresponsive

**Solutions**:
1. Reduce commit limit in settings:
   ```json
   {
     "gitDeck.commitGraph.maxCommits": 500
   }
   ```
2. Clear cache: Command Palette → "Git Deck: Clear Cache"
3. Check repository size: Large repos (10,000+ commits) may be slower
4. Disable auto-refresh if not needed:
   ```json
   {
     "gitDeck.autoRefresh": false
   }
   ```

### Webview Not Displaying

**Symptom**: Panel opens but content doesn't load

**Solutions**:
1. Check browser console: `Ctrl+Shift+P` → "Developer: Toggle Developer Tools"
2. Look for JavaScript errors in Console tab
3. Verify webview files exist: `packages/webview/dist/index.html`
4. Rebuild webview: `npm run build:webview`
5. Reload window: `Ctrl+Shift+P` → "Developer: Reload Window"

### Rate Limit Errors

**Symptom**: "Rate limit exceeded" errors

**Solutions**:
1. Wait 60 seconds for rate limit to reset
2. Increase rate limit in settings:
   ```json
   {
     "gitDeck.security.rateLimitConfig": {
       "maxRequests": 200,
       "windowMs": 60000
     }
   }
   ```
3. Disable rate limiting (not recommended):
   ```json
   {
     "gitDeck.security.enableRateLimit": false
   }
   ```

### Input Validation Errors

**Symptom**: "Invalid file path" or "Invalid branch name" errors

**Solutions**:
1. Check file paths don't contain `..` or start with `/`
2. Check branch names follow Git naming rules:
   - No spaces or special characters
   - Cannot start with `.` or `-`
   - Cannot contain `..`
3. If legitimate use case, report as bug

## Uninstallation

### Via VS Code UI

1. Open Extensions panel (`Ctrl+Shift+X`)
2. Find "Git Deck"
3. Click gear icon → Uninstall
4. Reload VS Code

### Via Command Line

```bash
code --uninstall-extension git-deck
```

## Publishing (For Maintainers)

### Prerequisites

1. Create Azure DevOps account
2. Generate Personal Access Token (PAT)
3. Install vsce: `npm install -g @vscode/vsce`

### Publishing Steps

```bash
# Login to marketplace
vsce login <publisher-name>

# Publish new version
cd packages/extension
vsce publish

# Or publish specific version
vsce publish 1.0.0
vsce publish minor
vsce publish major
```

### Pre-publish Checklist

- [ ] All tests pass: `npm test`
- [ ] Linter passes: `npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] Version bumped in `package.json`
- [ ] CHANGELOG.md updated
- [ ] README.md updated
- [ ] Screenshots updated (if UI changed)
- [ ] Test VSIX locally before publishing

## Support

- **Issues**: https://github.com/yourusername/git-deck/issues
- **Discussions**: https://github.com/yourusername/git-deck/discussions
- **Documentation**: https://github.com/yourusername/git-deck/tree/main/docs

## Additional Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [Extension Manifest](https://code.visualstudio.com/api/references/extension-manifest)
- [Webview API](https://code.visualstudio.com/api/extension-guides/webview)
