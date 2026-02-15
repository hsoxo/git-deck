# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned

- Canvas-based commit graph rendering
- Virtual scrolling for large repositories
- Interactive rebase editor
- Merge operations
- Branch comparison

## [0.1.0] - 2024-02-15

### Added

- Initial project setup with npm workspaces
- Extension backend with TypeScript
    - GitService for Git operations
    - StageOperations for file staging
    - RebaseOperations with conflict handling
    - CherryPickOperations for commit cherry-picking
    - StashOperations for stash management
    - RPC server for webview communication
- React 19 webview frontend
    - StagePanel for file staging
    - FileList component with multi-select
    - CommitBox for commit messages
    - HistoryPanel for commit history
    - CommitList with basic graph visualization
    - Zustand state management
    - RPC client for backend communication
- Comprehensive testing suite
    - Unit tests with Vitest (70%+ coverage target)
    - Integration tests with real Git repositories
    - E2E tests with VS Code test framework
- Documentation
    - README with project overview
    - Quick Start Guide
    - Development Guide
    - Architecture Documentation
    - Testing Guide
    - Chinese requirements and implementation plan
- VS Code configuration
    - Debug configurations
    - Task definitions
    - Workspace settings

### Technical Details

- React 19.0.0 with latest features
- Exact version pinning for all dependencies
- npm workspaces for monorepo management
- TypeScript strict mode throughout
- Vitest for fast unit testing
- simple-git 3.22.0 for Git operations

[Unreleased]: https://github.com/yourusername/git-gui-vscode/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/yourusername/git-gui-vscode/releases/tag/v0.1.0
