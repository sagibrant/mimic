  # Key Management for Extension Builds

This document outlines the secure approach for managing sensitive keys required for building and deploying the browser extension to various stores.

## Why Secure Key Management?

- **Security**: Private keys for extension signing should never be committed to version control
- **Compliance**: Store policies require secure handling of signing credentials
- **Flexibility**: Different environments (local, CI/CD) need different key management approaches
- **Simplicity**: Easy to understand and maintain key management process

## Key Types and Usage

| Key Type | Description | Usage |
|----------|-------------|-------|
| `privateKey.pem` | Private key for Chrome/Edge extension signing | Required for `.crx` packaging and store uploads |
| `publicKey.txt` | Public key for Chrome/Edge extension identification | Required for unpacked extension manifest |
| `apiKey.txt` | API key for Firefox Add-on SDK | Required for `.xpi` packaging |
| `apiSecret.txt` | API secret for Firefox Add-on SDK | Required for `.xpi` packaging |

## Environment Variable Format

Keys are managed through environment variables with the following format:

```
EXTENSION_{BROWSER}_{KEYTYPE}
```

### Examples:
- `EXTENSION_CHROME_PRIVATEKEY` - Chrome private key
- `EXTENSION_EDGE_PUBLICKEY` - Edge public key
- `EXTENSION_FIREFOX_APIKEY` - Firefox API key

## Local Development Setup

### Option 1: Use .secret Directory (Recommended for Development)

1. The project already includes a `.secret` directory structure:
   ```
   .secret/
   ├── chrome/
   │   ├── privateKey.pem
   │   └── publicKey.txt
   ├── edge/
   │   ├── privateKey.pem
   │   └── publicKey.txt
   └── firefox/
       ├── apiKey.txt
       └── apiSecret.txt
   ```

2. Place your key files in the appropriate directories:
   - `.secret/chrome/privateKey.pem`
   - `.secret/chrome/publicKey.txt`
   - `.secret/firefox/apiKey.txt`
   - `.secret/firefox/apiSecret.txt`

3. These files are already ignored by `.gitignore`, so they won't be committed to version control.

### Option 2: Use set-secrets.sh Script (Easy Setup)

1. The project includes a `set-secrets.sh` script that automatically sets environment variables from the `.secret` directory:

   ```bash
   # Make the script executable (if not already)
   chmod +x scripts/set-secrets.sh
   
   # Run the script to set secrets
   source scripts/set-secrets.sh
   ```

2. This script will:
   - Read keys from the `.secret` directory
   - Set them as environment variables
   - Show which variables were set successfully

### Option 3: Manually Set Environment Variables

1. Set the environment variables in your shell:
   ```bash
   # For Chrome
   export EXTENSION_CHROME_PRIVATEKEY="$(cat .secret/chrome/privateKey.pem)"
   export EXTENSION_CHROME_PUBLICKEY="$(cat .secret/chrome/publicKey.txt)"

   # For Firefox
   export EXTENSION_FIREFOX_APIKEY="$(cat .secret/firefox/apiKey.txt)"
   export EXTENSION_FIREFOX_APISECRET="$(cat .secret/firefox/apiSecret.txt)"
   ```

2. For persistent setup, add these to your `.bashrc` or `.zshrc` file.

## CI/CD Setup (GitHub Actions)

### Use GitHub Secrets (Recommended)

1. Go to your GitHub repository → Settings → Secrets and variables → Actions
2. Add secrets for each key using the environment variable format:
   - `EXTENSION_CHROME_PRIVATEKEY`
   - `EXTENSION_CHROME_PUBLICKEY`
   - `EXTENSION_EDGE_PRIVATEKEY`
   - `EXTENSION_EDGE_PUBLICKEY`
   - `EXTENSION_FIREFOX_APIKEY`
   - `EXTENSION_FIREFOX_APISECRET`

3. These secrets will be automatically available as environment variables in your GitHub Actions workflows.

## Build Process Key Usage

The webpack configuration automatically handles key management with the following priority:

1. **Environment variables** - Only priority, used in both local and CI/CD environments
2. **Temporary key files** - Created automatically when using environment variables

### Key Resolution Flow

1. When building, webpack checks for environment variables
2. If environment variables exist, it creates temporary key files for plugins that require file paths
3. If no keys found, build will proceed but signing/packaging may fail

## Environment Variable Naming Convention

### Format
```
EXTENSION_{BROWSER}_{KEYTYPE}
```

### Browser Values
- `CHROME` - Google Chrome
- `EDGE` - Microsoft Edge
- `FIREFOX` - Mozilla Firefox

### Key Type Values
- `PRIVATEKEY` - Private key for signing (`.pem`)
- `PUBLICKEY` - Public key for identification (`.txt`)
- `APIKEY` - Firefox Add-on API key
- `APISECRET` - Firefox Add-on API secret

## Security Best Practices

1. **Never commit keys** - Always use `.gitignore` to exclude key files
2. **Use .secret directory** - Store all local keys in the `.secret` directory
3. **Rotate keys regularly** - Change your extension keys periodically
4. **Limit access** - Only share keys with team members who need them
5. **Use strong secrets** - For GitHub Secrets, use long, complex values
6. **Monitor usage** - Keep track of when and where keys are used
7. **Revoke compromised keys** - If a key is compromised, revoke it immediately

## Troubleshooting

### Common Issues

1. **Build fails with "key not found" warning**
   - Check that environment variables are set correctly
   - Run `source scripts/set-secrets.sh` to ensure secrets are loaded
   - Verify key files exist in the `.secret` directory

2. **Extension signing fails**
   - Verify the private key is valid and not expired
   - Check that the public key matches the private key
   - For Firefox, ensure API credentials are valid

3. **GitHub Actions workflow fails to access keys**
   - Check that secrets are properly added to the repository
   - Verify secret names match the expected environment variables
   - Ensure the workflow has permission to access secrets

### Debugging Tips

- Enable verbose logging in webpack to see key resolution process
- Use `echo $EXTENSION_CHROME_PRIVATEKEY` to verify environment variables
- Check temporary key directory (`build/temp/keys`) when using environment variables
- Run `ls -la .secret/` to verify key files exist

## Conclusion

By following this key management approach, you can:
- Keep your extension signing keys secure
- Successfully build and deploy to all browser stores
- Maintain a clean, secure codebase
- Enjoy a simple and straightforward key management process

For any questions or issues, please refer to the build configuration documentation or contact the development team.