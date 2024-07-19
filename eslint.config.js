import parser from '@typescript-eslint/parser'
import typescript from '@typescript-eslint/eslint-plugin'
import stylistic from '@stylistic/eslint-plugin'

export default [
  {
    languageOptions: {
      parser,
      parserOptions: {
        project: true
      }
    },
    files: ['**/*.{js,ts}'],
    ignores: ['lib/*'],
    plugins: {
      '@typescript-eslint': typescript,
      '@stylistic': stylistic
    },
    rules: {
      // Typescript
      ...typescript.configs['stylistic-type-checked'].rules,
      '@typescript-eslint/array-type': ['error', { default: 'generic' }],

      // Stylistic
      ...stylistic.configs['recommended-flat'].rules,
      '@stylistic/comma-dangle': ['error', 'never'],
      '@stylistic/arrow-parens': ['error', 'always'],
      '@stylistic/brace-style': ['error', '1tbs'],
      '@stylistic/quote-props': ['error', 'as-needed'],
      '@stylistic/no-extra-parens': ['error', 'all'],

      // Other
      'no-console': ['warn', { allow: ['error', 'warn'] }]
    }
  }
]
