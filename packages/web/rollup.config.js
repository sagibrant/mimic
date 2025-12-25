import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import dts from 'rollup-plugin-dts';

const config = [
  // ES module build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/es/index.mjs',
      format: 'es',
      sourcemap: true
    },
    plugins: [
      nodeResolve({
        browser: false
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        sourceMap: true
      })
    ],
    external: [
      // Add any external dependencies that should not be bundled
      '@gogogo/shared',
      'openai'
    ]
  },

  // CommonJS build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/cjs/index.js',
      format: 'cjs',
      sourcemap: true
    },
    plugins: [
      nodeResolve({
        browser: false
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        sourceMap: true
      })
    ],
    external: [
      // Add any external dependencies that should not be bundled
      '@gogogo/shared',
      'openai'
    ]
  },

  // Browser build (UMD)
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/browser/index.js',
      format: 'umd',
      name: 'GogogoWeb',
      sourcemap: true,
      globals: {
        // Define global variables for external dependencies if any
        '@gogogo/shared': 'GogogoShared',
        'openai': 'OpenAI'
      }
    },
    plugins: [
      nodeResolve({
        browser: true
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        sourceMap: true
      })
    ],
    external: [
      // Add any external dependencies that should not be bundled
      '@gogogo/shared',
      'openai'
    ]
  },

  // Type declarations
  {
    input: 'src/index.ts',
    output: [{ file: 'dist/types/index.d.ts', format: 'es' }],
    plugins: [dts()]
  }
];

export default defineConfig(config);