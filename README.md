# Mimic

Mimic enables reliable end-to-end automation on your machine, with a focus on browser automation through a lightweight extension.

## Mimic - extension

Mimic extension is a standalone solution for browser automation.
It is a modern web extension available on Chrome and Edge (Firefox and Safari support coming soon). 
It is small, safe, fast, reliable and user friendly with AI assistance.
It helps you to generate, execute the automation steps on your browser directly without installing any heavy local tools.

## Key Features

- **Cross-browser compatibility**: Works on Chrome and Edge (Firefox and Safari support coming soon)
- **AI-powered automation**: Generate automation steps with AI assistance
- **Lightweight design**: No heavy local installations required
- **Easy-to-use API**: Intuitive interface for automation tasks

## Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/sagibrant/mimic.git
   cd mimic
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up secrets** (for extension signing)
   ```bash
   # Create .secret directory structure
   mkdir -p .secret/chrome .secret/edge .secret/firefox
   
   # Place your key files in the appropriate directories
   # Example: .secret/chrome/privateKey.pem
   
   # Set environment variables
   source scripts/set-secrets.sh
   ```

4. **Build the extension**
   ```bash
   # Build for development
   pnpm build:dev
   
   # Build for production
   pnpm build:prod
   ```

5. **Load the extension**
   - Chrome/Edge: Go to `chrome://extensions`, enable Developer mode, and load unpacked extension from `apps/extension/build/chrome/v3`

## Documentation

### API Documentation

The Mimic extension provides a comprehensive API for browser automation. Key global variables and methods include:

- `ai`: AIClient for AI-powered automation assistance
- `browser`: Browser interface for browser-level operations
- `page`: Page interface for page-level operations
- `expect`: Assertion library for testing
- `wait`: Utility for waiting during automation

For detailed API documentation, see [docs/README.md](docs/README.md).

### Key Management

Secure management of extension signing keys is crucial. Mimic uses environment variables for key management with the following format:

```
EXTENSION_{BROWSER}_{KEYTYPE}
```

Examples:
- `EXTENSION_CHROME_PRIVATEKEY`
- `EXTENSION_FIREFOX_APIKEY`

For detailed key management instructions, see [docs/KEY_MANAGEMENT.md](docs/KEY_MANAGEMENT.md).

## Build and Deployment

### Local Builds

Use the provided scripts to build the extension for different browsers:

```bash
# Chrome (unpacked)
pnpm run build:chrome:v3:unpacked

# Chrome (packed .crx)
pnpm run build:chrome:v3

# Edge
pnpm run build:edge:v3:unpacked

```

### CI/CD (GitHub Actions)

The project includes GitHub Actions workflows for automated builds. See [.github/workflows/build-extension.yml](.github/workflows/build-extension.yml) for configuration.

## Security

- **Key management**: Extension signing keys are stored in a `.secret` directory (excluded from version control)
- **Environment variables**: Used for secure key injection during builds
- **GitHub Secrets**: For secure CI/CD builds

## Contributing

Contributions are welcome! Please refer to the contribution guidelines in the docs directory.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Support

For questions or issues, please open an issue on GitHub or refer to the documentation.
