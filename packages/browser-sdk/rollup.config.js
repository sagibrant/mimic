import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import dts from 'rollup-plugin-dts';
import path from 'path';
import { fileURLToPath } from 'url';
import alias from '@rollup/plugin-alias';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
      alias({
        entries: [
          { find: '@gogogo/shared', replacement: path.resolve(__dirname, '../shared/dist/es/index.mjs') }
        ]
      }),
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
      alias({
        entries: [
          { find: '@gogogo/shared', replacement: path.resolve(__dirname, '../shared/dist/cjs/index.js') }
        ]
      }),

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
        'openai': 'OpenAI'
      }
    },
    plugins: [
      alias({
        entries: [
          { find: '@gogogo/shared', replacement: path.resolve(__dirname, '../shared/dist/browser/index.js') }
        ]
      }),

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
      'openai'
    ]
  },

  // Type declarations
  {
    input: 'src/index.ts',
    output: [{ file: 'dist/types/index.d.ts', format: 'es' }],
    plugins: [
      alias({
        entries: [
          { find: '@gogogo/shared', replacement: path.resolve(__dirname, '../shared/dist/types/index.d.ts') }
        ]
      }),
      dts()
    ]
  }
];

export default defineConfig(config);
