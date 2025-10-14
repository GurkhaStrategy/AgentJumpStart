/* Root ESLint configuration with overrides for frontend (React) and API (Node) */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true }
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'prettier'
  ],
  settings: {
    react: { version: 'detect' }
  },
  env: { es2022: true, node: true, browser: true },
  overrides: [
    {
      files: ['api/**/*.ts'],
      env: { node: true },
      rules: {
        'react/*': 'off',
        'jsx-a11y/*': 'off'
      }
    }
  ],
  rules: {
    '@typescript-eslint/explicit-module-boundary-types': 'off'
  }
};
