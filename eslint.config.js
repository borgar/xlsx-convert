import borgarLint from '@borgar/eslint-config';
import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    files: [
      '**/*.js',
      '**/*.ts',
      '**/*.mjs'
    ],
    ignores: [
      'dist/*'
    ],
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: { projectService: { allowDefaultProject: [] } }
    }
  },
  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  borgarLint.config.recommended,
  borgarLint.config.stylistic({
    commaDangle: true,
    singleBlocks: true,
    lineLength: 120
  }),
  {
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "no-shadow": "off",
    }
  }
);
