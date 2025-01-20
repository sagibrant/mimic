#!/bin/bash

# Script to set environment variables for extension secrets
# Reads secrets from .secret directory and sets them as environment variables

echo "=== Setting Extension Secrets ==="

# Function to set secret from file
set_secret() {
  local browser=$1
  local key_type=$2
  local file_name=$3
  local env_var_name="EXTENSION_$(echo $browser | tr '[:lower:]' '[:upper:]')_$(echo $key_type | tr '[:lower:]' '[:upper:]')"
  local file_path=".secret/${browser}/${file_name}"
  
  if [ -f "$file_path" ]; then
    # Read file content with proper handling of newlines
    local file_content
    file_content=$(cat "$file_path")
    
    # Export the variable with proper quoting
    export "$env_var_name"="$file_content"
    echo "✓ Set $env_var_name from $file_path"
  else
    echo "⚠ Skipped $env_var_name - $file_path not found"
  fi
}

# Set Chrome secrets
set_secret "chrome" "PRIVATEKEY" "privateKey.pem"
set_secret "chrome" "PUBLICKEY" "publicKey.txt"

# Set Edge secrets
set_secret "edge" "PRIVATEKEY" "privateKey.pem"
set_secret "edge" "PUBLICKEY" "publicKey.txt"

# Set Firefox secrets
set_secret "firefox" "APIKEY" "apiKey.txt"
set_secret "firefox" "APISECRET" "apiSecret.txt"

echo "=== Secrets Setup Complete ==="
echo "Run 'source scripts/set-secrets.sh' to apply these variables to your current shell"
echo "Or run '. scripts/set-secrets.sh' for short"
echo ""
echo "Note: Using 'source' is required because it sets environment variables in the current shell"
echo "Running 'sh scripts/set-secrets.sh' would execute in a subshell and variables wouldn't persist"
