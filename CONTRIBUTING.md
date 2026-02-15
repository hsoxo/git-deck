# Contributing to Git GUI for VS Code

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

Be respectful, inclusive, and professional in all interactions.

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- VS Code >= 1.80.0
- Git >= 2.20.0

### Setup Development Environment

1. Fork the repository
2. Clone your fork:
    ```bash
    git clone https://github.com/yourusername/git-gui-vscode.git
    cd git-gui-vscode
    ```
3. Install dependencies:
    ```bash
    npm install
    ```
4. Build the project:
    ```bash
    npm run build
    ```

## Development Workflow

### Branch Naming Convention

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `test/` - Test additions/updates
- `refactor/` - Code refactoring
- `chore/` - Maintenance tasks

Example: `feature/add-merge-operation`

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

#### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `test` - Test additions/updates
- `refactor` - Code refactoring
- `perf` - Performance improvements
- `chore` - Maintenance tasks
- `style` - Code style changes (formatting, etc.)

#### Examples

```
feat(stage): add drag and drop support for files
fix(rebase): handle conflict detection correctly
docs(readme): update installation instructions
test(git): add integration tests for cherry-pick
refactor(store): simplify state management logic
```

### Making Changes

1. Create a new branch:

    ```bash
    git checkout -b feature/your-feature-name
    ```

2. Make your changes

3. Write/update tests:

    ```bash
    npm test
    ```

4. Ensure code quality:

    ```bash
    npm run build  # Check for type errors
    ```

5. Commit your changes:

    ```bash
    git add .
    git commit -m "feat(scope): description"
    ```

6. Push to your fork:

    ```bash
    git push origin feature/your-feature-name
    ```

7. Create a Pull Request

## Testing Requirements

### Before Submitting PR

- [ ] All tests pass: `npm test`
- [ ] Code builds without errors: `npm run build`
- [ ] New features have tests
- [ ] Test coverage meets thresholds (70%+ for extension, 60%+ for webview)

### Writing Tests

#### Unit Tests

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('MyFunction', () => {
    it('should do something', () => {
        const result = myFunction('input');
        expect(result).toBe('expected');
    });
});
```

#### Integration Tests

```typescript
describe('Git Operations', () => {
    let testRepo: string;

    beforeEach(async () => {
        // Setup test repository
    });

    afterEach(() => {
        // Cleanup
    });

    it('should perform operation', async () => {
        // Test with real Git repository
    });
});
```

## Code Style

### TypeScript

- Use TypeScript strict mode
- Prefer interfaces over types for object shapes
- Use explicit return types for functions
- Avoid `any` type

### React

- Use functional components with hooks
- Keep components small and focused
- Use meaningful component and prop names
- Extract reusable logic into custom hooks

### Naming Conventions

- Components: PascalCase (`StagePanel.tsx`)
- Files: PascalCase for components, camelCase for utilities
- Functions: camelCase (`stageFiles`)
- Constants: UPPER_SNAKE_CASE (`MAX_COMMITS`)
- Types/Interfaces: PascalCase (`GitStatus`)

## Pull Request Process

### PR Checklist

- [ ] Branch is up to date with main
- [ ] All tests pass
- [ ] Code follows style guidelines
- [ ] Documentation is updated
- [ ] Commit messages follow convention
- [ ] PR description explains changes

### PR Description Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

How has this been tested?

## Screenshots (if applicable)

Add screenshots for UI changes

## Checklist

- [ ] Tests pass
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

### Review Process

1. Automated checks run (tests, build)
2. Code review by maintainers
3. Address feedback
4. Approval and merge

## Project Structure

### Adding New Features

#### Backend (Extension)

1. Add operation class in `packages/extension/src/git/operations/`
2. Register RPC handler in `GitGuiViewProvider.ts`
3. Add tests in `*.test.ts`

#### Frontend (Webview)

1. Add component in `packages/webview/src/components/`
2. Update store in `packages/webview/src/store/`
3. Add tests in `*.test.tsx`

#### Shared Types

1. Add types in `packages/shared/src/types.ts`
2. Export from `packages/shared/src/index.ts`

## Documentation

### When to Update Documentation

- New features → Update README and relevant docs
- API changes → Update ARCHITECTURE.md
- Breaking changes → Update CHANGELOG.md
- Bug fixes → Update CHANGELOG.md

### Documentation Style

- Use clear, concise language
- Include code examples
- Add screenshots for UI features
- Keep documentation up to date

## Getting Help

### Resources

- [Development Guide](./docs/DEVELOPMENT.md)
- [Architecture Documentation](./docs/ARCHITECTURE.md)
- [Testing Guide](./docs/TESTING.md)

### Communication

- GitHub Issues - Bug reports and feature requests
- GitHub Discussions - Questions and discussions
- Pull Requests - Code contributions

## Recognition

Contributors will be recognized in:

- README.md contributors section
- Release notes
- GitHub contributors page

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing! 🎉
