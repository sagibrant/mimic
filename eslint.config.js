import globals from 'globals';
import pluginJs from '@eslint/js';
import * as tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import pluginVue from 'eslint-plugin-vue';
import tailwind from "eslint-plugin-tailwindcss";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Note: In ESLint flat config (eslint.config.js), explicit root:true is not needed.
// This is because the flat config system applies configurations from the inside out by default,
// where the closest configuration overrides external ones.
// You can precisely control the scope of configuration application via files and ignores options.

// Export flat configuration array
export default [
  {
    ignores: ['node_modules/', 'dist/', 'tests/', 'build/'],
  },
  {
    files: ['**/*.{js,ts,vue}'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2020,
        ...globals.node,
        browser: true,
        chrome: true,
        webextensions: true,
      },
    },
  },

  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.strict,
  ...tailwind.configs["flat/recommended"].map(cfg => ({
    ...cfg,
    files: [
      'apps/extension/src/**/*.{tsx,jsx,vue,html}',
    ],
    settings: {
      tailwindcss: {
        config: {
          theme: {
            extend: {},
          },
          plugins: [],
        }
      }
    },
    rules: {
      ...cfg.rules,
      'tailwindcss/no-custom-classname': 'off'
    }
  })),
  eslintConfigPrettier,

  // JavaScript custom rules
  {
    files: ['**/*.js'],
    rules: {
      indent: ['error', 2, { SwitchCase: 1 }], // Enforce 2-space indentation; indent switch cases by 1 level
      'no-console': 'warn', // Warn on console usage (keep for debug, encourage cleanup)
      'no-debugger': 'error', // Disallow debugger (must be removed in production)
      eqeqeq: ['error', 'always'], // Enforce ===/!== instead of ==/!=
      curly: ['error', 'all'], // Require braces for all control statements (if/else/for)
      'dot-notation': 'error', // Enforce dot notation for property access (obj.key instead of obj['key'])
      'no-var': 'error', // Disallow var; use let/const
      'prefer-const': 'error', // Prefer const for variables not reassigned
      'object-shorthand': 'error', // Enforce object literal shorthand ({ key } instead of { key: key })
      'prefer-template': 'error', // Prefer template strings over concatenation (`${a}b` instead of a + 'b')
      radix: 'error', // Require radix for parseInt (e.g., parseInt('10', 10))
      'array-callback-return': 'error', // Require return values in array callbacks (map/filter/forEach)
      'consistent-return': 'error', // Enforce consistent return behavior in functions
    },
  },

  // TypeScript custom rules
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: process.cwd(),
      },
    },
    rules: {
      // TypeScript rules
      '@typescript-eslint/explicit-module-boundary-types': 'error', // Require explicit return types on exported functions/methods
      '@typescript-eslint/no-floating-promises': 'error', // Disallow unhandled Promises (must await/catch errors)
      '@typescript-eslint/no-explicit-any': 'error', // Disallow any type (enforce type safety)
      '@typescript-eslint/explicit-function-return-type': 'error', // Require explicit function return types
      '@typescript-eslint/no-unsafe-assignment': 'error', // Disallow unsafe assignments (e.g., assigning any to strong types)
      '@typescript-eslint/no-unsafe-call': 'error', // Disallow calls on values of unsafe types (e.g., any)
      '@typescript-eslint/no-unsafe-member-access': 'error', // Disallow member access on values of unsafe types (e.g., any)
      '@typescript-eslint/restrict-template-expressions': 'error', // Restrict template strings to safe types (avoid any)
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }], // Disallow unused variables; ignore args starting with underscore
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'], // Prefer interface over type for type definitions
    },
  },

  // Vue custom rules
  {
    files: ['**/*.vue'],
    plugins: {
      vue: pluginVue,
    },
    languageOptions: {
      parser: pluginVue.parser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
    },
    rules: {
      // 'vue/script-setup-uses-vars': 'error', // Enforce variables used in <script setup> to be declared; removed in eslint-plugin-vue v10.0.0
      'vue/script-indent': ['error', 2, { baseIndent: 1 }], // Enforce 2-space indentation in Vue script; base indent 1 level
      'vue/multi-word-component-names': 'error', // Enforce multi-word component names (e.g., UserInfo instead of User)
      'vue/require-default-prop': 'error', // Require default values for non-required props
      'vue/no-unused-components': 'error', // Disallow unused components (global/local)
      'vue/require-prop-types': 'error', // Require prop types (not just default values)
    },
  },
];
