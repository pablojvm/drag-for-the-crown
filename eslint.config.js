// Lint: estricto en el código nuevo (TypeScript) y solo errores reales en el código antiguo (js/),
// que comparte variables globales entre archivos y se irá migrando.
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**", "public/js/vendor/**", "supabase/functions/**", "*.timestamp-*", "js/historia/**"] },
  {
    files: ["src/**/*.ts", "tests/**/*.ts", "*.ts"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-unused-expressions": ["error", { allowShortCircuit: true, allowTernary: true }],
      "prefer-const": "warn",
      eqeqeq: ["error", "smart"],
    },
  },
  {
    files: ["js/**/*.js", "public/sw.js", "tools/**/*.mjs"],
    languageOptions: { ecmaVersion: 2023, sourceType: "script", globals: { ...globals.browser, ...globals.serviceworker, ...globals.node } },
    rules: {
      "no-dupe-keys": "error",
      "no-dupe-else-if": "error",
      "no-duplicate-case": "error",
      "no-unreachable": "error",
      "no-self-assign": "error",
      "no-self-compare": "error",
      "valid-typeof": "error",
      "no-unsafe-finally": "error",
      "no-unsafe-negation": "error",
      "no-sparse-arrays": "error",
      "no-func-assign": "error",
      "no-const-assign": "error",
      "no-redeclare": "error",
      "use-isnan": "error",
      "no-compare-neg-zero": "error",
      "no-loss-of-precision": "error",
      "no-constant-binary-expression": "error",
    },
  },
  { files: ["tools/**/*.mjs", "eslint.config.js"], languageOptions: { sourceType: "module" } },
);
