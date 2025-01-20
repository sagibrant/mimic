module.exports = {
  root: true,
  parser: '@typescript-eslint/parser', // Use TypeScript parser
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  env: {
    browser: true,
    es2020: true,
    webextensions: true
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'prettier' // disables rules that conflict with Prettier
  ],
  overrides: [
    {
      files: ['*.ts'],
      parserOptions: {
        project: ['./tsconfig.json'] // required for some type-aware rules
      }
    }
  ],
  rules: {
    // Example custom rules
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-floating-promises': 'warn',
    "@typescript-eslint/no-explicit-any": "error",
    "indent": ["error", 2],
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off'
  }
};
