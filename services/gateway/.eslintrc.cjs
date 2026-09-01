module.exports = {
    root: true,
    env: {
        browser: true,
        es2021: true,
        node: true,
    },
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended-type-checked',
        'plugin:@typescript-eslint/stylistic-type-checked',
        'plugin:promise/recommended',
        'plugin:import/recommended',
        'plugin:import/typescript',
        'plugin:prettier/recommended',
        'prettier',
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
    plugins: ['@typescript-eslint', 'import'],
    settings: {
        'import/parsers': {
            '@typescript-eslint/parser': ['.ts', '.tsx'],
        },
        'import/resolver': {
            typescript: true,
            node: true,
        },
    },
    ignorePatterns: ['*.cjs', '*.spec.ts'],
    rules: {
        quotes: ['error', 'single'],
        semi: ['error', 'always'],
        'import/no-unresolved': 'error',
        'import/no-named-as-default-member': 'off',
        'import/no-default-export': 'error',
        'eol-last': ['error', 'always'],
    },
};
