# Contributing to next-env-guard

Thank you for your interest in contributing to next-env-guard! This document provides guidelines and instructions for contributing.

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code.

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Clear title and description**
- **Steps to reproduce** the issue
- **Expected behavior**
- **Actual behavior**
- **Environment details** (Node.js version, Next.js version, OS, etc.)
- **Minimal reproduction** (if possible)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Clear title and description**
- **Use case** - Why is this enhancement useful?
- **Proposed solution** (if you have one)
- **Alternatives considered** (if any)

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following the coding standards
3. **Add tests** for new functionality
4. **Update documentation** as needed
5. **Ensure all tests pass** (`npm test`)
6. **Run linting** (`npm run lint`)
7. **Run type checking** (`npm run type-check`)
8. **Update CHANGELOG.md** with your changes
9. **Create a pull request** with a clear description

## Development Setup

1. Clone the repository:
```bash
git clone https://github.com/ehoneahobed/next-env-guard.git
cd next-env-guard
```

2. Install dependencies:
```bash
npm install
```

3. Run tests:
```bash
npm test
```

4. Run linting:
```bash
npm run lint
```

5. Run type checking:
```bash
npm run type-check
```

6. Build the package:
```bash
npm run build
```

## Coding Standards

### TypeScript

- Use TypeScript strict mode
- Avoid `any` types - use proper types or `unknown`
- Prefer type inference where possible
- Use branded types for additional type safety
- Add JSDoc comments for public APIs

### Code Style

- Follow the existing code style
- Use meaningful variable and function names
- Keep functions focused and small
- Add comments for complex logic
- Follow SOLID principles

### Testing

- Write tests for all new features
- Aim for >90% test coverage
- Test edge cases and error conditions
- Use descriptive test names
- Group related tests with `describe` blocks

### Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for new functions
- Update CHANGELOG.md with your changes
- Add examples if introducing new features

## Project Structure

```
next-env-guard/
├── src/
│   ├── core/          # Core functionality
│   ├── script/        # React components
│   ├── cli/           # CLI tools
│   └── utils/          # Utility functions
├── tests/              # Test files
├── examples/           # Example projects
└── docs/               # Documentation
```

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Example:
```
feat: add namespace support for multiple env instances
```

## Release Process

Releases are managed by the maintainers. When your PR is merged:

1. The maintainer will update the version in package.json
2. Update CHANGELOG.md with the new version
3. Create a git tag
4. Publish to npm

## Questions?

If you have questions, please open an issue or start a discussion.

Thank you for contributing! 🎉
