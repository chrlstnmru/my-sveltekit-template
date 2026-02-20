import antfu from '@antfu/eslint-config';
import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';

import svelteConfig from './svelte.config.js';

export default antfu(
  {
    type: 'app',
    svelte: true,
    formatters: true,
    stylistic: {
      indent: 2,
      semi: true,
      quotes: 'single'
    },
    gitignore: true
  },
  {
    rules: {
      'antfu/if-newline': 'off',
      'ts/no-redeclare': 'off',
      'ts/consistent-type-definitions': ['error', 'type'],
      'no-console': 'warn',
      'node/prefer-global/process': 'off',
      'node/no-process-env': 'error',
      'perfectionist/sort-imports': [
        'error',
        {
          tsconfigRootDir: '.',
          internalPattern: ['^\\$.*'],
          groups: [
            'type',
            ['builtin', 'external'],
            'internal-type',
            'internal',
            ['parent-type', 'sibling-type', 'index-type'],
            ['parent', 'sibling', 'index'],
            'object',
            'side-effect',
            'unknown'
          ]
        }
      ],
      'unicorn/filename-case': ['error', { case: 'kebabCase', ignore: ['README.md'] }]
    }
  },
  prettier,
  ...svelte.configs.prettier,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node }
    },
    rules: {
      'no-undef': 'off',
      'prefer-const': 'off',
      'svelte/block-lang': ['error', { script: 'ts' }],
      'svelte/button-has-type': ['warn'],
      'svelte/sort-attributes': ['warn'],
      'svelte/prefer-const': ['warn', { excludedRunes: ['$props', '$derived'] }],
      'svelte/html-self-closing': ['error'],
      'svelte/no-target-blank': ['error'],
      'svelte/no-top-level-browser-globals': ['error'],
      'svelte/no-add-event-listener': ['error'],
      'svelte/no-raw-special-elements': ['error'],
      'svelte/html-closing-bracket-new-line': ['error']
    }
  },
  {
    files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        extraFileExtensions: ['.svelte'],
        parser: ts.parser,
        svelteConfig
      }
    }
  }
);
