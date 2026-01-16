import globals from 'globals';
import pluginJs from '@eslint/js';
import * as tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import pluginVue from 'eslint-plugin-vue';
import tailwind from "eslint-plugin-tailwindcss";
// 注意：在ESLint扁平配置（eslint.config.js）中，不需要明确设置root:true
// 这是因为扁平配置系统默认会按照从内到外的顺序应用配置，最近的配置会覆盖外部配置
// 可以通过files和ignores选项精确控制配置的应用范围

// 导出扁平配置数组
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
      'apps/extension/src/**/*.{js,ts,tsx,vue}',
    ],
  })),
  eslintConfigPrettier,

  // JavaScript 自定义规则
  {
    files: ['**/*.js'],
    rules: {
      indent: ['error', 2, { SwitchCase: 1 }], // 强制 2 空格缩进，switch case 语句缩进 1 级
      'no-console': 'warn', // 警告使用 console（保留调试但提醒清理）
      'no-debugger': 'error', // 禁止使用 debugger（生产环境必须移除）
      eqeqeq: ['error', 'always'], // 强制使用 ===/!== 而非 ==/!=
      curly: ['error', 'all'], // 强制所有条件语句（if/else/for）使用大括号包裹
      'dot-notation': 'error', // 强制使用点语法访问对象属性（而非方括号，如 obj.key 而非 obj['key']）
      'no-var': 'error', // 禁止使用 var，强制 let/const
      'prefer-const': 'error', // 强制使用 const 声明无需重新赋值的变量
      'object-shorthand': 'error', // 强制对象字面量使用简写（如 { key } 而非 { key: key }）
      'prefer-template': 'error', // 强制使用模板字符串而非字符串拼接（如 `${a}b` 而非 a + 'b'）
      radix: 'error', // 强制 parseInt 传入进制参数（如 parseInt('10', 10)）
      'array-callback-return': 'error', // 强制数组回调（map/filter/forEach）有返回值
      'consistent-return': 'error', // 强制函数返回值一致（如要么都返回，要么都不返回）
    },
  },

  // TypeScript 自定义规则
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
      // TypeScript 规则
      '@typescript-eslint/explicit-module-boundary-types': 'error', // 强制导出函数/方法显式声明返回值类型
      '@typescript-eslint/no-floating-promises': 'error', // 禁止未处理的 Promise（如未 await/捕获错误）
      '@typescript-eslint/no-explicit-any': 'error', // 禁止使用 any 类型（强制类型安全）
      '@typescript-eslint/explicit-function-return-type': 'error', // 强制函数显式声明返回值类型
      '@typescript-eslint/no-unsafe-assignment': 'error', // 禁止不安全的赋值（如 any 类型赋值给强类型）
      '@typescript-eslint/no-unsafe-call': 'error', // 禁止调用类型不安全的函数（如 any 类型的函数）
      '@typescript-eslint/no-unsafe-member-access': 'error', // 禁止访问类型不安全的属性（如 any 类型的属性）
      '@typescript-eslint/restrict-template-expressions': 'error', // 限制模板字符串中使用不安全的类型（如 any）
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }], // 禁止未使用的变量, 忽略下划线开头的参数
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'], // 强制使用 interface 而非 type 定义类型
    },
  },

  // Vue 自定义规则
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
      // 'vue/script-setup-uses-vars': 'error', // 强制 <script setup> 中使用的变量必须声明， 在eslint-plugin-vue v10.0.0中删除
      'vue/script-indent': ['error', 2, { baseIndent: 1 }], // 强制 Vue 脚本部分 2 空格缩进，基础缩进 1 级
      'vue/multi-word-component-names': 'error', // 强制 Vue 组件名使用多单词（如 UserInfo 而非 User）
      'vue/require-default-prop': 'error', // 强制非必选 prop 声明默认值
      'vue/no-unused-components': 'error', // 禁止未使用的组件（全局/局部）
      'vue/require-prop-types': 'error', // 强制 prop 声明类型（禁止只写默认值不写类型）
    },
  },
];
