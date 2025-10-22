## Contributing

We welcome contributions from the Bitcoin community! Whether you're fixing bugs, adding features, improving documentation, or spreading the word, every contribution helps make Grimm App better.

### How to Contribute

1. **Fork the Repository**

   - Click the "Fork" button on GitHub
   - Clone your fork locally

2. **Create a Branch**

   ```sh
   git checkout -b feature/your-feature-name
   ```

3. **Make Your Changes**

   - Follow our coding conventions
   - Write clear commit messages
   - Add tests for new features
   - Update documentation as needed

4. **Test Your Changes**

   ```sh
   pnpm test
   pnpm lint
   pnpm type-check
   ```

5. **Submit a Pull Request**
   - Push your branch to your fork
   - Open a PR against the main repository
   - Describe your changes clearly
   - Reference any related issues

### Contribution Guidelines

**Code Style**

- Follow TypeScript best practices
- Use functional components with hooks
- Keep components small and focused
- Write self-documenting code with clear names
- Add comments for complex logic

**Testing**

- Write unit tests for utility functions
- Add integration tests for critical flows
- Ensure tests pass before submitting PR
- Maintain or improve code coverage

**Documentation**

- Update README for new features
- Document API changes
- Add inline code comments where necessary
- Update type definitions

### Areas Where We Need Help

- 🐛 **Bug Reports**: Found a bug? Report it!
- 💡 **Feature Suggestions**: Have an idea? Share it!
- 🔧 **Code Contributions**: Fix bugs, add features
- 📝 **Documentation**: Improve docs and guides
- 🌍 **Translations**: Help translate the app
- 🎨 **Design**: UI/UX improvements
- 🧪 **Testing**: Help test on different devices
- 🔒 **Security**: Security audits and reviews

### Code of Conduct

We are committed to providing a welcoming and inclusive environment. We expect all contributors to:

- Be respectful and considerate
- Welcome newcomers and help them learn
- Focus on what is best for the community
- Show empathy towards others
- Accept constructive criticism gracefully

## Testing

### Running Tests

```sh
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run tests with coverage
pnpm test --coverage

# Run specific test file
pnpm test -- path/to/test-file.test.ts
```

### Testing Philosophy

We believe in comprehensive testing to ensure wallet reliability and security. Our testing strategy includes:

- **Unit Tests**: Test individual functions and utilities
- **Integration Tests**: Test component interactions
- **End-to-End Tests**: Test complete user flows
- **Security Tests**: Verify cryptographic operations
- **Regression Tests**: Prevent previously fixed bugs

## Troubleshooting

### Common Issues

**Metro Bundler Issues**

```sh
# Clear watchman watches
watchman watch-del-all

# Clear Metro cache
pnpm start --reset-cache

# Clear all caches
rm -rf node_modules
pnpm install
```

**iOS Build Issues**

```sh
# Clean iOS build
cd ios && xcodebuild clean && cd ..

# Reinstall pods
cd ios && pod deintegrate && pod install && cd ..

# Reset iOS simulator
xcrun simctl erase all
```

**Android Build Issues**

```sh
# Clean Android build
cd android && ./gradlew clean && cd ..

# Clear Gradle cache
cd android && ./gradlew cleanBuildCache && cd ..
```

## Support and Community

### Getting Help

- **Documentation**: Check this README and linked documentation
- **GitHub Issues**: Report bugs or request features
- **Discussions**: Ask questions and share ideas
