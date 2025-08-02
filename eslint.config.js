import jsdoc from "eslint-plugin-jsdoc";
import eslint from "@eslint/js";
import tsEslintParser from "@typescript-eslint/parser";
import tsEslintPlugin from "@typescript-eslint/eslint-plugin";

export default [
  // 1. Base recommended rules for all JavaScript files.
  eslint.configs.recommended,

  // 2. Ignore specific folders globally.
  {
    ignores: ["**/dist"],
  },

  // 3. JSDoc rules applied to all supported file types.
  {
    files: [
      "**/*.ts",
      "**/*.tsx",
      "**/*.cts",
      "**/*.mts",
      "**/*.js",
      "**/*.jsx",
      "**/*.cjs",
      "**/*.mjs",
    ],
    plugins: {
      jsdoc,
    },
    // Override or add JSDoc rules here.
    rules: {
      "jsdoc/check-alignment": "error",
      "jsdoc/check-indentation": "error",
      "jsdoc/check-param-names": "error",
      "jsdoc/check-syntax": "error",
      "jsdoc/check-types": "off", // TypeScript handles this
      "jsdoc/require-description": "error",
      "jsdoc/require-param": "error",
      "jsdoc/require-param-description": "error",
      "jsdoc/require-param-name": "error",
      "jsdoc/require-returns": "error",
      "jsdoc/require-returns-description": "error",
      "jsdoc/require-returns-type": "off", // TypeScript handles this
      "jsdoc/require-jsdoc": [
        "error",
        {
          require: {
            FunctionDeclaration: true,
            MethodDefinition: true,
            ClassDeclaration: true,
            ArrowFunctionExpression: true,
            FunctionExpression: true,
          },
        },
      ],
    },
  },

  // 4. Recommended rules for TypeScript, with specific parser and language options.
  //    This is where you had the 'extends' issue. We now use a single object
  //    that explicitly defines the parser and rules.
  {
    files: ["**/*.ts"],
    plugins: {
      "@typescript-eslint": tsEslintPlugin,
    },
    languageOptions: {
      // Set the environment for all relevant files
      globals: {
        console: "readonly",
      },
      parser: tsEslintParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    // The `...tsEslintPlugin.configs.recommended` you had before is a full config
    // object that includes an `extends` key. You can't put that directly in the
    // array. Instead, you need to apply the rules it provides.
    // The simplest way to do this is to add the recommended rules directly.
    rules: {
      // Add the rules from the recommended config.
      // Eslint 9 has its own built-in `extends` key for flat configs, but it's
      // not available in all plugins yet. A safer and more explicit way is to
      // use the rules object directly.
      // You can find the rules you need to copy here:
      // https://typescript-eslint.io/rules/
      ...tsEslintPlugin.configs.recommended.rules,
    },
  },
];
