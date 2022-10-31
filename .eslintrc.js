module.exports = {
  root: true,
  extends: [
    '@pokemonon/formatter/typescript',
  ],
  rules: {
    'curly': 'off',
    '@typescript-eslint/space-before-blocks': 'off',
    '@typescript-eslint/brace-style': 'off',
    '@typescript-eslint/no-unused-vars': 'warn',
  },
}
