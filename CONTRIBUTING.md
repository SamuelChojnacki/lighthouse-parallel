# Contributing to Lighthouse Parallel

First off, thank you for considering contributing to Lighthouse Parallel! 🎉

It's people like you that make Lighthouse Parallel such a great tool. We welcome contributions from everyone, whether it's:

- 🐛 Bug reports
- 💡 Feature requests
- 📝 Documentation improvements
- 🔧 Code contributions
- 🧪 Test improvements
- 🌍 Translations

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Project Structure](#project-structure)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code:

- **Be respectful**: Treat everyone with respect. Harassment and abuse are never tolerated.
- **Be collaborative**: Work together to achieve the best solutions.
- **Be inclusive**: Welcome newcomers and support each other.
- **Give constructive feedback**: Focus on the code, not the person.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/yourusername/lighthouse-parallel.git
   cd lighthouse-parallel
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/original/lighthouse-parallel.git
   ```

4. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Setup

### Prerequisites

- Node.js 20+ and npm 9+
- Docker & Docker Compose
- Git

### Installation

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..

# Start Redis via Docker
docker-compose up redis -d

# Copy environment file
cp .env.example .env

# Generate secure credentials
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))" # API_KEY
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))" # JWT_SECRET

# Run development server
npm run start:dev
```

### Verify Setup

```bash
# Check backend is running
curl http://localhost:3002/health

# Run tests
npm test
npm run test:e2e
```

## How to Contribute

### Reporting Bugs

When filing a bug report, please include:

- **Clear title**: Describe the issue in one sentence
- **Description**: What happened? What did you expect to happen?
- **Steps to reproduce**: How can we reproduce the issue?
- **Environment**: OS, Node version, Docker version
- **Logs**: Relevant error messages or stack traces
- **Screenshots**: If applicable

**Template:**
```markdown
## Bug Description
[Clear description of the bug]

## Steps to Reproduce
1. Start the server with `npm run start:dev`
2. Send POST request to `/lighthouse/audit`
3. Observe error in console

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happened]

## Environment
- OS: macOS 14.5
- Node: v20.11.0
- Docker: 24.0.6

## Logs
```
[Paste relevant logs]
```
```

### Suggesting Features

We love new feature ideas! Please include:

- **Use case**: Why is this feature needed?
- **Proposed solution**: How would it work?
- **Alternatives**: What other approaches did you consider?
- **Examples**: How would users interact with this feature?

### Improving Documentation

Documentation improvements are always welcome:

- Fix typos or grammar
- Add missing information
- Improve clarity
- Add examples
- Translate to other languages

## Coding Standards

### TypeScript/JavaScript

We follow **industry-standard** practices:

```typescript
// ✅ Good
export class LighthouseService {
  async processAudit(url: string): Promise<AuditResult> {
    const result = await this.runAudit(url);
    return this.formatResult(result);
  }
}

// ❌ Bad
export class lighthouse_service {
  async ProcessAudit(url) {
    return await this.runAudit(url)
  }
}
```

**Guidelines:**
- Use **TypeScript** for all new code
- Follow **camelCase** for variables and functions
- Use **PascalCase** for classes and interfaces
- Use **UPPER_CASE** for constants
- Add **JSDoc comments** for public APIs
- Prefer `async/await` over callbacks
- Use **functional programming** when appropriate
- Keep functions **small and focused** (single responsibility)

### Code Style

We use **Prettier** and **ESLint**:

```bash
# Format code
npm run format

# Lint code
npm run lint
```

**Before committing**, ensure:
```bash
npm run lint    # No errors
npm test        # All tests pass
```

### File Naming

- **Components**: `PascalCase.tsx` (e.g., `AuditDashboard.tsx`)
- **Services**: `kebab-case.service.ts` (e.g., `lighthouse.service.ts`)
- **Controllers**: `kebab-case.controller.ts`
- **DTOs**: `kebab-case.dto.ts`
- **Utilities**: `kebab-case.util.ts`

## Commit Guidelines

We follow **Conventional Commits**:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

### Examples

```bash
# Feature
git commit -m "feat(api): add locale parameter for multi-language reports"

# Bug fix
git commit -m "fix(processor): prevent child process race conditions with SIGKILL"

# Documentation
git commit -m "docs(readme): add Kubernetes deployment example"

# Refactor
git commit -m "refactor(service): extract webhook logic to separate service"
```

### Commit Message Rules

- Use **present tense** ("add feature" not "added feature")
- Use **imperative mood** ("move cursor to..." not "moves cursor to...")
- First line **max 72 characters**
- Reference **issue numbers** when applicable: `fixes #123`
- Add **detailed description** in body for complex changes

## Pull Request Process

### Before Submitting

1. **Update from main**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run tests**:
   ```bash
   npm test
   npm run test:e2e
   npm run lint
   ```

3. **Update documentation** if needed

4. **Test manually** in dev environment

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests pass
- [ ] No merge conflicts
- [ ] Commit messages follow conventions

### PR Template

```markdown
## Description
[Describe what this PR does]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Fixes #123

## Testing
- [ ] Unit tests added
- [ ] E2E tests added
- [ ] Manual testing completed

## Screenshots (if applicable)
[Add screenshots]

## Checklist
- [ ] Code reviewed
- [ ] Tests pass
- [ ] Documentation updated
```

### Review Process

1. **Automated checks** must pass (tests, lint)
2. **At least one review** required from maintainers
3. **Address feedback** promptly
4. **Squash commits** if requested
5. **Maintainer merges** when approved

## Testing

### Running Tests

```bash
# Unit tests
npm test

# E2E tests (requires Redis)
npm run test:e2e

# Coverage report
npm run test:cov

# Watch mode
npm run test:watch
```

### Writing Tests

**Unit Test Example:**
```typescript
describe('LighthouseService', () => {
  it('should queue an audit job', async () => {
    const service = new LighthouseService(mockQueue);
    const result = await service.addAudit('https://example.com');

    expect(result.jobId).toBeDefined();
    expect(result.status).toBe('queued');
  });
});
```

**E2E Test Example:**
```typescript
describe('POST /lighthouse/audit', () => {
  it('should create audit job and return job ID', () => {
    return request(app.getHttpServer())
      .post('/lighthouse/audit')
      .send({ url: 'https://example.com' })
      .expect(201)
      .expect(res => {
        expect(res.body.jobId).toBeDefined();
      });
  });
});
```

### Test Coverage

We aim for **80%+ coverage**. Focus on:

- Core business logic
- Edge cases
- Error handling
- API endpoints
- Critical paths

## Project Structure

```
lighthouse-parallel/
├── src/                          # Backend source code
│   ├── config/                   # Configuration files
│   ├── lighthouse/               # Lighthouse module
│   │   ├── controllers/          # API controllers
│   │   ├── services/             # Business logic
│   │   ├── processors/           # BullMQ workers
│   │   ├── dto/                  # Data transfer objects
│   │   └── workers/              # Child process scripts
│   ├── auth/                     # Authentication module
│   ├── health/                   # Health check endpoints
│   └── common/                   # Shared utilities
├── frontend/                     # React frontend
│   ├── src/
│   │   ├── components/           # React components
│   │   ├── pages/                # Page components
│   │   ├── services/             # API clients
│   │   └── utils/                # Utilities
│   └── public/                   # Static assets
├── test/                         # E2E tests
├── docker-compose.yml            # Docker setup
├── Dockerfile                    # Production build
└── README.md                     # Project documentation
```

## Common Tasks

### Adding a New Feature

1. Create feature branch: `git checkout -b feature/my-feature`
2. Add feature code in appropriate module
3. Add tests for the feature
4. Update documentation
5. Submit PR

### Fixing a Bug

1. Create bug fix branch: `git checkout -b fix/bug-description`
2. Write failing test that reproduces bug
3. Fix the bug
4. Ensure test passes
5. Submit PR

### Adding an API Endpoint

1. Define DTO in `src/lighthouse/dto/`
2. Add controller method in appropriate controller
3. Implement service logic
4. Add validation with class-validator
5. Add Swagger documentation
6. Write E2E test
7. Update API docs in README

## Getting Help

- 📖 **Documentation**: Check the [Wiki](https://github.com/yourusername/lighthouse-parallel/wiki)
- 💬 **Discussions**: Ask questions in [GitHub Discussions](https://github.com/yourusername/lighthouse-parallel/discussions)
- 🐛 **Issues**: Report bugs in [GitHub Issues](https://github.com/yourusername/lighthouse-parallel/issues)
- 💌 **Email**: Contact maintainers at dev@lighthouse-parallel.dev

## Recognition

Contributors will be:
- Listed in the **Contributors** section
- Mentioned in **release notes**
- Credited in relevant **documentation**

Thank you for contributing! 🙏

---

**Happy coding!** 🚀
