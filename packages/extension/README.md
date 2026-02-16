# Git GUI for VS Code / Kiro

Visual Git GUI extension for VS Code and Kiro.

## Features

- Visual Git operations interface
- Stage/unstage files
- Commit changes
- View git history
- Branch management
- Rebase, cherry-pick, stash operations

## Usage

### Opening Git GUI

After installation, you can open Git GUI in several ways:

1. **Command Palette**: Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) and type "Git GUI: Open"
2. **Source Control Panel**: Click the Source Control icon in the Activity Bar, then look for "Git GUI" view
3. **Auto-activation**: The extension activates automatically when you open a Git repository

### Requirements

- A Git repository must be open in your workspace
- Git must be installed on your system

## Troubleshooting

### Extension not showing up

1. Make sure you have a Git repository open in your workspace
2. Try reloading the window: `Ctrl+Shift+P` → "Developer: Reload Window"
3. Check the Output panel for any error messages: View → Output → Select "Git GUI" from dropdown

### View not visible

1. Open Command Palette (`Ctrl+Shift+P`)
2. Type "Git GUI: Open" and press Enter
3. This will focus the Git GUI view in the Source Control panel

## Development

See the main repository README for development instructions.

## License

MIT
