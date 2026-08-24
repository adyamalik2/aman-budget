import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'android']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      // __OWNER_BUILD__ di-inject vite.config.js lewat `define` (lihat di sana):
      // literal boolean pemisah build owner/web/customer, bukan variabel runtime.
      globals: { ...globals.browser, __OWNER_BUILD__: 'readonly' },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
])
