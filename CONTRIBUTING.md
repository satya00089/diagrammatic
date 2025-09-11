# Contributing to Diagrammatic

Thank you for your interest in contributing to Diagrammatic! This document provides guidelines for contributing to the project.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/yourusername/diagrammatic.git
   cd diagrammatic
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Start the development server**:
   ```bash
   npm run dev
   ```

## Development Workflow

1. **Create a feature branch** from `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feat/your-feature-name
   ```

2. **Make your changes** following the project conventions

3. **Test your changes**:
   ```bash
   npm run lint        # Check code style
   npm run test        # Run tests if available
   npm run build       # Ensure it builds
   ```

4. **Commit your changes** with descriptive messages:
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

## Pull Request Guidelines

- **Target the `develop` branch** for new features
- **Include a clear description** of what your PR does
- **Add tests** for new functionality when applicable
- **Update documentation** if you're changing APIs
- **Keep PRs focused** - one feature/fix per PR
- **Follow conventional commit format**:
  - `feat:` for new features
  - `fix:` for bug fixes  
  - `docs:` for documentation
  - `chore:` for maintenance tasks

## Code Style

- Use **TypeScript** for all new code
- Follow **existing code patterns** and conventions
- Use **meaningful variable and function names**
- Add **comments** for complex logic
- Keep **components small and focused**

## Design System Guidelines

When working with design tokens and components:

- Use **CSS custom properties** for themeable values
- Follow the **token naming conventions** (e.g., `--color-primary`)
- Ensure **accessibility** in all components
- Test **responsive behavior** at different screen sizes
- Document **component APIs** and token usage

## Testing

- Write **unit tests** for utility functions
- Test **component behavior** with user interactions
- Verify **accessibility** with screen readers
- Check **cross-browser compatibility**

## Getting Help

- Check the [Learning Exercises](./docs/LEARNING_EXERCISES.md) for design system concepts
- Open an issue for bugs or feature requests
- Join discussions in existing issues
- Reach out to maintainers for guidance

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
