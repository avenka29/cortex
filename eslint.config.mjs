import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Strictly ban require() to prevent the exact ESM crash we saw earlier
      "@typescript-eslint/no-require-imports": "error",
      
      // We are allowing any for our MCP args parsing for simplicity right now
      "@typescript-eslint/no-explicit-any": "off",

      // Disable this since we use process.exit and console extensively in CLI/Server
      "no-console": "off",
      "no-process-exit": "off"
    }
  }
);
